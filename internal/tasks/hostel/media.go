package hosteltasks

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"bytes"
	"github.com/hibiken/asynq"
	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/oladev/ufinda_v0.01/internal/db/hostel"
	"github.com/oladev/ufinda_v0.01/internal/logs/hostel"
	"github.com/oladev/ufinda_v0.01/internal/db"
)


// HandleHostelMediaUpload is the task handler for processing media uploads.
func HandleHostelMediaUpload(cld *cloudinary.Cloudinary, ctx context.Context, t *asynq.Task) error {
	log.Printf("Processing task for type: %s", t.Type())

	var p HostelMediaUploadPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		// Return SkipRetry if payload is corrupted
		return fmt.Errorf("json.Unmarshal failed: %v: %w", err, asynq.SkipRetry)
	}

	log.Printf("Starting media upload for Hostel ID: %s", p.HostelID)

	// 1. Process and upload Images from Memory
	var uploadedImages []db.UploadedFile
	for _, data := range p.ImageFilesData {
		// Create a reader from the byte slice
		reader := bytes.NewReader(data.Content)

		// Upload to Cloudinary using the reader
		url, publicID, err := hosteldb.UploadHostelImages(cld, reader, data.Filename)
		if err != nil {
			log.Printf("Hostel ID %s: Failed to upload image '%s'. Error: %v", p.HostelID, data.Filename, err)
			hostellog.LogHostel(p.VendorID, fmt.Errorf("image upload error: %w", err))
			continue 
		}

		uploadedImages = append(uploadedImages, db.UploadedFile{
			URL:      url,
			PublicID: publicID,
		})
		log.Printf("Hostel ID %s: Successfully uploaded image '%s'", p.HostelID, data.Filename)
	}

	// 2. Process and upload Videos from Memory
	var uploadedVideos []db.UploadedFile
	for _, data := range p.VideoFilesData {
		// Create a reader from the byte slice
		reader := bytes.NewReader(data.Content)

		url, publicID, err := hosteldb.UploadHostelVideos(cld, reader, data.Filename)
		if err != nil {
			log.Printf("Hostel ID %s: Failed to upload video '%s'. Error: %v", p.HostelID, data.Filename, err)
			hostellog.LogHostel(p.VendorID, fmt.Errorf("video upload error: %w", err))
			continue
		}

		uploadedVideos = append(uploadedVideos, db.UploadedFile{
			URL:      url,
			PublicID: publicID,
		})
		log.Printf("Hostel ID %s: Successfully uploaded video '%s'", p.HostelID, data.Filename)
	}

	// 3. Update Database
	updateData := make(map[string]interface{})

	if len(uploadedImages) > 0 {
		imageData, _ := json.Marshal(uploadedImages)
		updateData["hostel_images"] = json.RawMessage(imageData)
	}

	if len(uploadedVideos) > 0 {
		videoData, _ := json.Marshal(uploadedVideos)
		updateData["hostel_videos"] = json.RawMessage(videoData)
	}

	if len(updateData) > 0 {
		if err := hosteldb.UpdateHostel(p.HostelID, updateData); err != nil {
			log.Printf("Hostel ID %s: Failed to update DB. Error: %v", p.HostelID, err)
			hostellog.LogHostel(p.VendorID, fmt.Errorf("database update error: %w", err))
			return fmt.Errorf("failed to update database: %w", err) 
		}
		log.Printf("Hostel ID %s: Successfully updated database with media URLs.", p.HostelID)
	}

	log.Printf("Successfully processed media for hostel ID %s", p.HostelID)
	return nil
}
