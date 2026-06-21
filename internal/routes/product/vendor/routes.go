package vendorproduct

import (
	"github.com/gin-gonic/gin"
	"github.com/oladev/ufinda_v0.01/internal/db"
    "github.com/oladev/ufinda_v0.01/internal/db/product"
	"github.com/oladev/ufinda_v0.01/internal/token"
    "github.com/cloudinary/cloudinary-go/v2"
	"net/http"
    "errors"
    "io"
	"strings"
    "context"
	"strconv"
	"log"
	"fmt"
	"github.com/oladev/ufinda_v0.01/internal/logs/product"
    "github.com/oladev/ufinda_v0.01/internal/logs/auth"
    "github.com/oladev/ufinda_v0.01/internal/db/notification"
)

func CreateProductHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        user, exists := c.Get("user")
        if !exists {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
            return
        }

        getUser, ok := user.(*db.User)
        if !ok {
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user"})
            return
        }

		if !getUser.IsVerified {
			productlog.LogProduct(getUser.ID, nil, fmt.Errorf("vendor not verified"))
			c.JSON(http.StatusUnauthorized, gin.H{"error": "vendor not verified"})
			return
		}

        var req CreateProductRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }

		// 2. clean price
		cleanPrice := strings.ReplaceAll(req.Price, ",", "")
		price, err := strconv.ParseInt(cleanPrice, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid price format"})
			return
		}

        checkUniquenessFunc := func(id string) (bool, error) {
            return token.IsIDUnique(id, "/rest/v1/product_items")
        }

        productID, err := token.GenerateRandomID("product", checkUniquenessFunc)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate id"})
            return
        }

        data := map[string]interface{}{
            "p_id":          productID,
			"p_vendor_id":	 getUser.ID,
            "p_slug":        req.Category,
            "p_title":       req.Title,
            "p_price":       price,
            "p_attributes":  req.Attributes,
            "p_description": req.Description,
            "p_product_images": req.ProductImages,
            "p_product_video": req.ProductVideo,
        }

        resp, err := db.MakeDBRequest("POST", "/rest/v1/rpc/create_product_by_slug", data, nil)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "database error"})
            return
        }
        defer resp.Body.Close()

        if resp.StatusCode >= 400 {
            // Read the error body to see why it failed
            body, _ := io.ReadAll(resp.Body)
            log.Printf("Database rejected request: %s", string(body))
            
            c.JSON(resp.StatusCode, gin.H{
                "error": "database rejected the product creation",
                "details": string(body),
            })
            return
        }

        go func(userID, productName string) {
			tokens, err := notifdb.GetPushTokens(userID)
			if err == nil && len(tokens) > 0 {
				title := "Listing Added! 🎉"
				body := fmt.Sprintf("Your product/service '%s' has been listed successfully.", productName)
				
				for _, tData := range tokens {
					if tData.DeviceToken != "" {
						_ = notifdb.SendPushNotification(tData.DeviceToken, title, body, "LISTING_SCREEN")
					}
				}
			}
		}(getUser.ID, req.Title)

        c.JSON(http.StatusAccepted, gin.H{"message": "Product listed successfully", "id": productID})
    }
}

func DeleteProductHandler(cld *cloudinary.Cloudinary) gin.HandlerFunc {
    return func(c *gin.Context) {
        user, exists := c.Get("user")
        if !exists {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
            return
        }

        getUser, ok := user.(*db.User)
        if !ok {
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user"})
            return
        }

		if !getUser.IsVerified {
			productlog.LogProduct(getUser.ID, nil, fmt.Errorf("vendor not verified"))
			c.JSON(http.StatusUnauthorized, gin.H{"error": "vendor not verified"})
			return
		}

        productID := c.Param("id")

        getListing, err := productdb.FindProductByID(productID)
        if err != nil {
			if errors.Is(err, productdb.ErrorListingNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "listing not found"})
			} else {
				productlog.LogProduct(getUser.ID, nil, err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
			}
			return
		}

        // 3. Verify the logged-in user owns the product listing
		if getListing.VendorID != getUser.ID {
			logData := authlog.Logs["3"]
			formattedMessage := fmt.Sprintf(logData.Message, "user tried to delete product listing")
            logEntry := db.SecurityLog{
                Log:   formattedMessage,
                Level: logData.Level,
            }
            authlog.SecurityLog(logEntry)
			c.JSON(http.StatusForbidden, gin.H{"error": "unauthorized"})
			return
		}

        ctx := context.Background()

        // 1. Delete Images (defensive check)
        for _, img := range getListing.ProductImages {
            // Check if PublicID exists
            if img.PublicID != "" {
                if err := db.DeleteCloudinaryAsset(ctx, cld, img.PublicID, "image"); err != nil {
                    // Log the error, but do not return; continue deleting other assets
                    log.Printf("failed to delete image %s: %v", img.URL, err)
                }
            }
        }

        // 2. Delete Video (CRITICAL: Nil check added here)
        if getListing.ProductVideo != nil && getListing.ProductVideo.PublicID != "" {
            if err := db.DeleteCloudinaryAsset(ctx, cld, getListing.ProductVideo.PublicID, "video"); err != nil {
                log.Printf("failed to delete video %s: %v", getListing.ProductVideo.URL, err)
            }
        }
        
        // 3. Delete Product from DB
        if err := productdb.DeleteProduct(productID); err != nil {
            productlog.LogProduct(getUser.ID, nil, err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
            return
        }

		c.JSON(http.StatusOK, gin.H{"message": "listing deleted successfully"})
    }
}

// func UpdateProductHandler(c *gin.Context) {
//     user, exists := c.Get("user")
//     if !exists {
//         c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
//         return
//     }

//     getUser, ok := user.(*db.User)
//     if !ok {
//         c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user"})
//         return
//     }

//     if !getUser.IsVerified {
//         productlog.LogProduct(getUser.ID, nil, fmt.Errorf("vendor not verified"))
//         c.JSON(http.StatusUnauthorized, gin.H{"error": "vendor not verified"})
//         return
//     }

//     productID := c.Param("id")

//     getListing, err := productdb.FindProductByID(productID)
//     if err != nil {
//         if errors.Is(err, productdb.ErrorListingNotFound) {
//             c.JSON(http.StatusNotFound, gin.H{"error": "listing not found"})
//         } else {
//             productlog.LogProduct(getUser.ID, nil, err)
//             c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
//         }
//         return
//     }

//     // 3. Verify the logged-in user owns the product listing
//     if getListing.VendorID != getUser.ID {
//         logData := authlog.Logs["3"]
//         formattedMessage := fmt.Sprintf(logData.Message, "user tried to delete product listing")
//         logEntry := db.SecurityLog{
//             Log:   formattedMessage,
//             Level: logData.Level,
//         }
//         authlog.SecurityLog(logEntry)
//         c.JSON(http.StatusForbidden, gin.H{"error": "unauthorized"})
//         return
//     }

// }