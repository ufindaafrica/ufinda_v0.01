package userkyc

import (
	"fmt"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"log"
	"os"
	"context"
	"time"
	"github.com/cloudinary/cloudinary-go/v2"
	"mime/multipart"
)

type UpdateKYC struct {
	Level string `json:"level"`
	Dept string `json:"dept"`
	Faculty string `json:"faculty"`
}

// upload NIN to cloud
func UploadUserNIN(file *multipart.FileHeader) (string, error) {
	cld, err := cloudinary.NewFromParams(
		os.Getenv("CLOUDINARY_CLOUD_NAME"),
		os.Getenv("CLOUDINARY_API_KEY"),
		os.Getenv("CLOUDINARY_API_SECRET"),
	)
	
	if err != nil {
		log.Printf("Failed to initialize Cloudinary client: %v", err)
		return "", fmt.Errorf("server configuration error")
	}

	fileStream, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("failed to open file")
	}
	defer fileStream.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	uploadParams := uploader.UploadParams{
		Folder: "user/nin_imgs", 
		Type:   "private",      // This is the crucial part for security.
	}
	resp, err := cld.Upload.Upload(ctx, fileStream, uploadParams)
	if err != nil {
		return "", fmt.Errorf("failed to upload file to cloud service: %w", err)
	}

	return resp.SecureURL, nil
}

