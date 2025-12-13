package chat
import (
	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"fmt"
	"io"
	"time"
	"context"
)

func UploadChatImages(cld *cloudinary.Cloudinary, reader io.Reader, filename string) (string, string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Minute) // Increased timeout for videos
	defer cancel()

	uploadParams := uploader.UploadParams{
		Folder:   "chat/images", // Correct folder for videos
		PublicID: filename,
		// Add resource type as 'video' for videos
		ResourceType: "image", 
	}
	
	resp, err := cld.Upload.Upload(ctx, reader, uploadParams)
	if err != nil {
		return "", "", fmt.Errorf("failed to upload file to cloud service: %w", err)
	}

	return resp.SecureURL, resp.PublicID, nil
}