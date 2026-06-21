package productdb
import (
	"github.com/cloudinary/cloudinary-go/v2"
	"context"
	"encoding/json"
	"time"
	"errors"
	"io"
	"log"
	"fmt"
	"net/url"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/oladev/ufinda_v0.01/internal/db"
	"net/http"
)

var ErrorListingNotFound = errors.New("listing not found")


func UploadProductImages(cld *cloudinary.Cloudinary, reader io.Reader, filename string) (string, string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	uploadParams := uploader.UploadParams{
		Folder:   "product/images", // Correct folder for images
		PublicID: filename,
	}

	resp, err := cld.Upload.Upload(ctx, reader, uploadParams)
	if err != nil {
		return "", "", fmt.Errorf("failed to upload file to cloud service: %w", err)
	}

	return resp.SecureURL, resp.PublicID, nil
}

func UploadProductVideos(cld *cloudinary.Cloudinary, reader io.Reader, filename string) (string, string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Minute) // Increased timeout for videos
	defer cancel()

	uploadParams := uploader.UploadParams{
		Folder:   "product/videos", // Correct folder for videos
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

func UpdateProduct(id string, data interface{}) error {
	url := fmt.Sprintf("/rest/v1/product_items?id=eq.%s", url.QueryEscape(id))

	header := map[string]string {
		"Prefer": "return=representation",
	}

	resp, err := db.MakeDBRequest("PATCH", url, data, header)

	if err != nil {
		return err
	}

	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to update product")
	}

	return nil
}

func DeleteProduct(id string) error {
	url := fmt.Sprintf("/rest/v1/product_items?id=eq.%s", url.QueryEscape(id))

	resp, err := db.MakeDBRequest("DELETE", url, nil, nil)

	if err != nil {
		return fmt.Errorf("failed to delete listing: %w", err)
	}

	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		return fmt.Errorf("failed to delete listing")
	}
	
	return nil
}

func FindProductByID(id string) (*db.Product, error) {
    endpoint := fmt.Sprintf("/rest/v1/product_items?id=eq.%s", id)

    resp, err := db.MakeDBRequest("GET", endpoint, nil, nil)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
		log.Printf("listing not found or db error: status %d", resp.StatusCode)
        return nil, fmt.Errorf("unable to retrieve listing")
    }

    var products []db.Product
    if err := json.NewDecoder(resp.Body).Decode(&products); err != nil {
        return nil, err
    }

    if len(products) == 0 {
        return nil, ErrorListingNotFound
    }

    return &products[0], nil
}