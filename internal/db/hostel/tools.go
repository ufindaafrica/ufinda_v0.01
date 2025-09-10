package hosteldb

import (
	"fmt"
	"github.com/cloudinary/cloudinary-go/v2"
	"time"
	"context"
	"io"
	"log"
	"github.com/google/uuid"
	"errors"
	"encoding/json"
	"net/http"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/oladev/ufinda_v0.01/internal/db"
)

var ErrorGettingHostel = errors.New("failed to get hostel")
var ErrorHostelNotFound = errors.New("hostel not found")

type hostelImageResponse struct {
    HostelImages []db.UploadedImage `json:"hostel_images"`
}

type hostelVideoResponse struct {
    HostelVideos []db.UploadedVideo `json:"hostel_videos"`
}

func UploadHostelImages(cld *cloudinary.Cloudinary, reader io.Reader, filename string) (string, string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	uploadParams := uploader.UploadParams{
		Folder:   "hostel/images", // Correct folder for images
		PublicID: filename,
	}

	resp, err := cld.Upload.Upload(ctx, reader, uploadParams)
	if err != nil {
		return "", "", fmt.Errorf("failed to upload file to cloud service: %w", err)
	}

	return resp.SecureURL, resp.PublicID, nil
}

func UploadHostelVideos(cld *cloudinary.Cloudinary, reader io.Reader, filename string) (string, string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Minute) // Increased timeout for videos
	defer cancel()

	uploadParams := uploader.UploadParams{
		Folder:   "hostel/videos", // Correct folder for videos
		PublicID: filename,
		// Add resource type as 'video' for videos
		ResourceType: "video", 
	}
	
	resp, err := cld.Upload.Upload(ctx, reader, uploadParams)
	if err != nil {
		return "", "", fmt.Errorf("failed to upload file to cloud service: %w", err)
	}

	return resp.SecureURL, resp.PublicID, nil
}

func CreateHostelAndReturnID(data db.Hostel) (uuid.UUID, error) {
	url := fmt.Sprintf("/rest/v1/hostels")

	header := map[string]string{
		"Prefer": "return=representation",
	}

	resp, err := db.MakeDBRequest("POST", url, data, header)
	if err != nil {
		return uuid.Nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		bodyBytes, readErr := io.ReadAll(resp.Body)
		if readErr != nil {
			return uuid.Nil, fmt.Errorf("failed to create log with status %d, and couldn't read response body: %w", resp.StatusCode, readErr)
		}

		bodyString := string(bodyBytes)
		return uuid.Nil, fmt.Errorf("failed to create hostel: server responded with status %d and body: %s", resp.StatusCode, bodyString)
	}

	var responseData []db.Hostel
	decoder := json.NewDecoder(resp.Body)
	if err := decoder.Decode(&responseData); err != nil {
		return uuid.Nil, fmt.Errorf("failed to decode successful response body: %w", err)
	}

	if len(responseData) == 0 || responseData[0].ID == uuid.Nil {
		return uuid.Nil, errors.New("successful response did not contain a valid hostel ID")
	}

	// Extract the ID of the newly created hostel
	createdHostelID := responseData[0].ID

	return createdHostelID, nil
}

// update hostel
func UpdateHostel(id uuid.UUID, data interface{}) error {
	url := fmt.Sprintf("/rest/v1/hostels?id=eq.%s", id)

	header := map[string]string {
		"Prefer": "return=representation",
	}

	resp, err := db.MakeDBRequest("PATCH", url, data, header)

	if err != nil {
		return err
	}

	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to update hostel")
	}

	return nil
}

// find hostel
func FindHostelByID(id uuid.UUID) (*db.Hostel, error) {
	url := fmt.Sprintf("/rest/v1/hostels?id=eq.%s", id)

	resp, err := db.MakeDBRequest("GET", url, nil, nil)
	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, ErrorGettingHostel
	}

	var hostel []db.Hostel

	if err := json.NewDecoder(resp.Body).Decode(&hostel); err != nil {
		return nil, err
	}

	if len(hostel) == 0 {
		return nil, ErrorHostelNotFound
	}

	return &hostel[0], nil
}

func GetHostelImagesPublicIDAndUrl(id uuid.UUID) ([]db.UploadedImage, error) {
	url := fmt.Sprintf("/rest/v1/hostels?id=eq.%s&select=hostel_images", id)

	resp, err := db.MakeDBRequest("GET", url, nil, nil)

	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var rows []hostelImageResponse
    if err := json.NewDecoder(resp.Body).Decode(&rows); err != nil {
        return nil, fmt.Errorf("decode failed: %w", err)
    }

	if len(rows) == 0 {
		return nil, nil
	}

	return rows[0].HostelImages, nil
}

func GetHostelVideosPublicIDAndUrl(id uuid.UUID) ([]db.UploadedVideo, error) {
	url := fmt.Sprintf("/rest/v1/hostels?id=eq.%s&select=hostel_videos", id)

	resp, err := db.MakeDBRequest("GET", url, nil, nil)

	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var rows []hostelVideoResponse
    if err := json.NewDecoder(resp.Body).Decode(&rows); err != nil {
        return nil, fmt.Errorf("decode failed: %w", err)
    }

	if len(rows) == 0 {
		return nil, nil
	}

	return rows[0].HostelVideos, nil
}

func DeleteHostel(id uuid.UUID) error {
	url := fmt.Sprintf("/rest/v1/hostels?id=eq.%s", id)

	resp, err := db.MakeDBRequest("DELETE", url, nil, nil)

	if err != nil {
		return err
	}

	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		return fmt.Errorf("failed to delete listing")
	}
	
	return nil
}


func DeleteCloudinaryAsset(cld *cloudinary.Cloudinary, publicID, resourceType string) error {
	ctx := context.Background()

	// Set parameters for the destroy method
	destroyParams := uploader.DestroyParams{
		PublicID: publicID,
	}

	// Set the resource type if provided (e.g., "video")
	if resourceType != "" {
		destroyParams.ResourceType = resourceType
	}

	resp, err := cld.Upload.Destroy(ctx, destroyParams)
	if err != nil {
		return fmt.Errorf("failed to destroy asset with public ID %s: %w", publicID, err)
	}

	if resp.Result != "ok" {
		return fmt.Errorf("failed to destroy asset with public ID %s. Result: %s", publicID, resp.Result)
	}

	log.Printf("Successfully deleted asset with public ID: %s", publicID)
	return nil
}