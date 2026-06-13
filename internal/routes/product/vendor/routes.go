package vendorproduct

import (
	"github.com/gin-gonic/gin"
	"github.com/oladev/ufinda_v0.01/internal/db"
	"github.com/oladev/ufinda_v0.01/internal/token"
	"net/http"
    "io"
	"strings"
	"strconv"
	"github.com/hibiken/asynq"
	"log"
	"fmt"
	"github.com/oladev/ufinda_v0.01/internal/logs/product"
    "github.com/oladev/ufinda_v0.01/internal/db/notification"
)

func CreateProductHandler(asynqClient *asynq.Client) gin.HandlerFunc {
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