package tasks

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"bytes"
	"mime/multipart"
	"io"
	"github.com/hibiken/asynq"
	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/oladev/ufinda_v0.01/internal/db/hostel"
	"github.com/oladev/ufinda_v0.01/internal/logs/hostel"
	"github.com/oladev/ufinda_v0.01/internal/db"
)

// Define a task type
const (
	TypeHostelMediaUpload = "media:upload"
)
type FileData struct {
	Filename string
	Content  []byte
}

// HostelMediaUploadPayload defines the data for the background media upload task.
type HostelMediaUploadPayload struct {
	HostelID       string
	VendorID 	   string
	ImageFilesData []FileData
	VideoFilesData []FileData
}

// HandleHostelMediaUpload is the task handler for processing media uploads.
func HandleHostelMediaUpload(cld *cloudinary.Cloudinary, ctx context.Context, t *asynq.Task) error {
	log.Printf("Processing task for type: %s", t.Type())

	var p HostelMediaUploadPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		hostellog.LogHostel(p.VendorID, &p.HostelID, fmt.Errorf("failed to retrieve payload for worker"))
		return fmt.Errorf("json.Unmarshal failed: %v: %w", err, asynq.SkipRetry)
	}

	log.Printf("Starting media upload for Hostel ID: %s", p.HostelID)

	// Process and upload images
	var uploadedImages []db.UploadedFile

	for _, data := range p.ImageFilesData {
		reader := bytes.NewReader(data.Content)
		url, publicID, err := hosteldb.UploadHostelImages(cld, reader, data.Filename)
		if err != nil {
			log.Printf("Hostel ID %s: Failed to upload image '%s'. Error: %v", p.HostelID, data.Filename, err)
			hostellog.LogHostel(p.VendorID, &p.HostelID, fmt.Errorf("image upload error: %w", err))
			return fmt.Errorf("error uploading image '%s': %w", data.Filename, asynq.SkipRetry)
		}
		uploadedImages = append(uploadedImages, db.UploadedFile{
			URL: url,
			PublicID: publicID,
		})
		log.Printf("Hostel ID %s: Successfully uploaded image '%s' to %s", p.HostelID, data.Filename, url)
	}

	var uploadedVideos []db.UploadedFile

	for _, data := range p.VideoFilesData {
		reader := bytes.NewReader(data.Content)
		url, publicID, err := hosteldb.UploadHostelVideos(cld, reader, data.Filename)
		if err != nil {
			log.Printf("Hostel ID %s: Failed to upload video '%s'. Error: %v", p.HostelID, data.Filename, err)
			hostellog.LogHostel(p.VendorID, &p.HostelID, fmt.Errorf("video upload error: %w", err))
			return fmt.Errorf("error uploading video '%s': %w", data.Filename, asynq.SkipRetry)
		}
		uploadedVideos = append(uploadedVideos, db.UploadedFile{
			URL: url,
			PublicID: publicID,
		})
		
		log.Printf("Hostel ID %s: Successfully uploaded video '%s' to %s", p.HostelID, data.Filename, url)
	}

	updateData := make(map[string]interface{})

	if len(uploadedImages) > 0 {
		// Marshal the slice of image structs into JSON bytes
		imageData, err := json.Marshal(uploadedImages)
		if err != nil {
			return fmt.Errorf("failed to marshal image data: %w", err)
		}
		// Add the marshaled JSON to the map
		updateData["hostel_images"] = json.RawMessage(imageData)
	}

	if len(uploadedVideos) > 0 {
		// Marshal the slice of video structs into JSON bytes
		videoData, err := json.Marshal(uploadedVideos)
		if err != nil {
			return fmt.Errorf("failed to marshal video data: %w", err)
		}
		// Add the marshaled JSON to the map
		updateData["hostel_videos"] = json.RawMessage(videoData)
	}

	if len(updateData) > 0 {
		if err := hosteldb.UpdateHostel(p.HostelID, updateData); err != nil {
			log.Printf("Hostel ID %s: Failed to update hostel media in DB. Error: %v", p.HostelID, err)
			hostellog.LogHostel(p.VendorID, &p.HostelID, fmt.Errorf("database update error: %w", err))
			return fmt.Errorf("failed to update hostel media in DB for Hostel ID %s: %w", p.HostelID, asynq.SkipRetry)
		}
		log.Printf("Hostel ID %s: Successfully updated database with media URLs.", p.HostelID)
	} else {
		log.Printf("Hostel ID %s: No new media uploaded or processed. Skipping database update for media.", p.HostelID)
	}

	log.Printf("Successfully processed all media for hostel ID %s", p.HostelID)
	return nil
}

func FilesToBytes(headers []*multipart.FileHeader) []FileData {
	var filesData []FileData
	for _, header := range headers {
		file, err := header.Open()
		if err != nil {
			log.Printf("Failed to open file %s: %v", header.Filename, err)
			continue
		}
		
		data, err := io.ReadAll(file)
		file.Close() // Ensure file is closed after reading
		if err != nil {
			log.Printf("Failed to read file %s: %v", header.Filename, err)
			continue
		}

		filesData = append(filesData, FileData{
			Filename: header.Filename,
			Content:  data,
		})
	}
	return filesData
}