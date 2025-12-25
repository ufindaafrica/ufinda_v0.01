package hosteltasks

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"path/filepath"
	"os"
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
        // Note: p.VendorID/HostelID might be empty if unmarshal fails
        return fmt.Errorf("json.Unmarshal failed: %v: %w", err, asynq.SkipRetry)
    }

    log.Printf("Starting media upload for Hostel ID: %s", p.HostelID)

    // 1. Process and upload Images from Disk
    var uploadedImages []db.UploadedFile
    for _, path := range p.ImagePaths {
        // Open file from disk
        file, err := os.Open(path)
        if err != nil {
            log.Printf("Hostel ID %s: Failed to open image at %s: %v", p.HostelID, path, err)
            continue // Skip this specific file but continue others
        }

        // Upload to Cloudinary using the existing helper
        url, publicID, err := hosteldb.UploadHostelImages(cld, file, filepath.Base(path))
        file.Close() // Close immediately after reading

        if err != nil {
            log.Printf("Hostel ID %s: Failed to upload image at '%s'. Error: %v", p.HostelID, path, err)
            hostellog.LogHostel(p.VendorID, &p.HostelID, fmt.Errorf("image upload error: %w", err))
            continue 
        }

        // Cleanup: Remove file from disk after successful upload
        os.Remove(path)

        uploadedImages = append(uploadedImages, db.UploadedFile{
            URL:      url,
            PublicID: publicID,
        })
    }

    // 2. Process and upload Videos from Disk
    var uploadedVideos []db.UploadedFile
    for _, path := range p.VideoPaths {
        file, err := os.Open(path)
        if err != nil {
            log.Printf("Hostel ID %s: Failed to open video at %s: %v", p.HostelID, path, err)
            continue
        }

        url, publicID, err := hosteldb.UploadHostelVideos(cld, file, filepath.Base(path))
        file.Close()

        if err != nil {
            log.Printf("Hostel ID %s: Failed to upload video at '%s'. Error: %v", p.HostelID, path, err)
            hostellog.LogHostel(p.VendorID, &p.HostelID, fmt.Errorf("video upload error: %w", err))
            continue
        }

        // Cleanup: Remove file from disk after successful upload
        os.Remove(path)

        uploadedVideos = append(uploadedVideos, db.UploadedFile{
            URL:      url,
            PublicID: publicID,
        })
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
            log.Printf("Hostel ID %s: Failed to update hostel media in DB. Error: %v", p.HostelID, err)
            hostellog.LogHostel(p.VendorID, &p.HostelID, fmt.Errorf("database update error: %w", err))
            return fmt.Errorf("failed to update database: %w", err) // Allow retry for DB errors
        }
        log.Printf("Hostel ID %s: Successfully updated database with media URLs.", p.HostelID)
    }

    log.Printf("Successfully processed media for hostel ID %s", p.HostelID)
    return nil
}
