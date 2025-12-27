package producttasks

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"bytes"
	"github.com/hibiken/asynq"
	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/oladev/ufinda_v0.01/internal/db/product"
	"github.com/oladev/ufinda_v0.01/internal/logs/product"
	"github.com/oladev/ufinda_v0.01/internal/db"
)


func HandleProductMediaUpload(cld *cloudinary.Cloudinary, ctx context.Context, t *asynq.Task) error {
	log.Printf("Processing task for type: %s", t.Type())

	var p ProductMediaUploadPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		// Return SkipRetry if payload is corrupted to avoid infinite loops
		return fmt.Errorf("json.Unmarshal failed: %v: %w", err, asynq.SkipRetry)
	}

	log.Printf("Starting media upload for Product ID: %s", p.ProductID)

	// 1. Process and upload Images from Memory
	var uploadedImages []db.UploadedFile
	for _, data := range p.ImageFilesData {
		// Convert byte slice to an io.Reader
		reader := bytes.NewReader(data.Content)

		// Upload using your productdb helper
		url, publicID, err := productdb.UploadProductImages(cld, reader, data.Filename)
		if err != nil {
			log.Printf("Product ID %s: Failed to upload image '%s'. Error: %v", p.ProductID, data.Filename, err)
			productlog.LogProduct(p.VendorID, &p.ProductID, fmt.Errorf("image upload error: %w", err))
			continue // Move to next image
		}

		uploadedImages = append(uploadedImages, db.UploadedFile{
			URL:      url,
			PublicID: publicID,
		})
		log.Printf("Product ID %s: Successfully uploaded image '%s'", p.ProductID, data.Filename)
	}

	// 2. Process and upload Videos from Memory
	var uploadedVideos []db.UploadedFile
	for _, data := range p.VideoFilesData {
		// Convert byte slice to an io.Reader
		reader := bytes.NewReader(data.Content)

		url, publicID, err := productdb.UploadProductVideos(cld, reader, data.Filename)
		if err != nil {
			log.Printf("Product ID %s: Failed to upload video '%s'. Error: %v", p.ProductID, data.Filename, err)
			productlog.LogProduct(p.VendorID, &p.ProductID, fmt.Errorf("video upload error: %w", err))
			continue
		}

		uploadedVideos = append(uploadedVideos, db.UploadedFile{
			URL:      url,
			PublicID: publicID,
		})
		log.Printf("Product ID %s: Successfully uploaded video '%s'", p.ProductID, data.Filename)
	}

	// 3. Prepare Database Update
	updateData := make(map[string]interface{})

	if len(uploadedImages) > 0 {
		imageData, _ := json.Marshal(uploadedImages)
		updateData["product_images"] = json.RawMessage(imageData)
	}

	if len(uploadedVideos) > 0 {
		videoData, _ := json.Marshal(uploadedVideos)
		updateData["product_video"] = json.RawMessage(videoData)
	}

	// 4. Update the Database
	if len(updateData) > 0 {
		if err := productdb.UpdateProduct(p.ProductID, updateData); err != nil {
			log.Printf("Product ID %s: Failed to update DB. Error: %v", p.ProductID, err)
			productlog.LogProduct(p.VendorID, &p.ProductID, fmt.Errorf("database update error: %w", err))
			// Return error to allow asynq to retry for DB issues
			return fmt.Errorf("failed to update product in DB: %w", err)
		}
		log.Printf("Product ID %s: Successfully updated database.", p.ProductID)
	} else {
		log.Printf("Product ID %s: No media processed, skipping DB update.", p.ProductID)
	}

	log.Printf("Successfully completed task for product ID %s", p.ProductID)
	return nil
}