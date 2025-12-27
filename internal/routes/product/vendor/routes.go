package vendorproduct

import (
	"github.com/gin-gonic/gin"
	"github.com/oladev/ufinda_v0.01/internal/db"
	"github.com/oladev/ufinda_v0.01/internal/token"
	"net/http"
	"encoding/json"
    "io"
	"strings"
	"mime/multipart"
	"github.com/oladev/ufinda_v0.01/internal/tasks/product"
	"github.com/oladev/ufinda_v0.01/internal/tasks"
	"strconv"
	"github.com/hibiken/asynq"
	"log"
	"fmt"
	"github.com/oladev/ufinda_v0.01/internal/logs/product"
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


        form, err := c.MultipartForm()
        if err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "error getting request"})
            return
        }

        // Corrected variable name to match usage below
        imageHeaders := form.File["product_images"]
        if len(imageHeaders) < 1 {
            c.JSON(http.StatusBadRequest, gin.H{"error": "no image provided"})
            return
        }

        // Use c.FormFile for a single file or form.File["video"] for a slice
        videoHeader, _ := c.FormFile("product_video") 
		var videoSlice []*multipart.FileHeader
		if videoHeader != nil {
			videoSlice = append(videoSlice, videoHeader)
		}

		rawPrice := c.PostForm("price")

		// 2. Remove all commas
		cleanPrice := strings.ReplaceAll(rawPrice, ",", "") // becomes "200000"

		// 3. Now parse the clean string
		price, err := strconv.ParseInt(cleanPrice, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid price format"})
			return
		}

        title := c.PostForm("title")
        description := c.PostForm("description")
        categorySlug := c.PostForm("category")
        attributes := c.PostForm("attributes")

        var attributesJSON json.RawMessage
        if attributes != "" {
            attributesJSON = json.RawMessage(attributes)
        } else {
            attributesJSON = json.RawMessage(`{}`)
        }

        checkUniquenessFunc := func(id string) (bool, error) {
            return token.IsIDUnique(id, "/rest/v1/product_items")
        }

        productID, err := token.GenerateRandomID("product", checkUniquenessFunc)
        if err != nil {
            // Changed to log generic error or use product log
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate id"})
            return
        }

        // Corrected: added the second '}' for map[string]interface{}{}
        data := map[string]interface{}{
            "p_id":          productID,
			"p_vendor_id":	 getUser.ID,
            "p_slug":        categorySlug,
            "p_title":       title,
            "p_price":       price,
            "p_attributes":  attributesJSON,
            "p_description": description,
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

        // Prepare payload for background task
        // Note: Check if your videoHeader needs to be handled as a slice or single
        payload, err := json.Marshal(producttasks.ProductMediaUploadPayload{
            ProductID:      productID,
            VendorID:       getUser.ID,
            ImageFilesData: tasks.FilesToBytes(imageHeaders), 
            VideoFilesData: tasks.FilesToBytes(videoSlice), // Adjusted helper name for clarity
        })
        
        if err == nil {
            task := asynq.NewTask(producttasks.TypeProductMediaUpload, payload)
            if _, err := asynqClient.Enqueue(task, asynq.MaxRetry(3)); err != nil {
                log.Printf("Could not enqueue task: %v", err)
            }
        }

        c.JSON(http.StatusAccepted, gin.H{"message": "Product listed. Media is being processed in the background."})
    }
}