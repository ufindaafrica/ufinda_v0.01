package userkyc

import (
	"fmt"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"log"
	"net/url"
	"os"
	"errors"
	"net/http"
	"context"
	"time"
	"encoding/json"
	"github.com/cloudinary/cloudinary-go/v2"
	"mime/multipart"
	"uFinda/internal/db"
)
var ErrorKYCNotFound = errors.New("no KYC found")
var ErrorUserNotFound = errors.New("no user found, please create an account")
var ErrorGettingKYC = errors.New("Failed to get kyc")
var ErrorGettingUser = errors.New("Failed to get user")

type UserKYCData struct {
	Level string `json:"level"`
	Dept string `json:"dept"`
	NIN string `json:"nin"`
	Faculty string `json:"faculty"`
	Matric string `json:"matric"`
}

type UpdateKYC struct {
	Level string `json:"level"`
	Dept string `json:"dept"`
	Faculty string `json:"faculty"`
}

// create kyc
func CreateUserKYC(kyc db.UserKYC) error {
	endpoint := fmt.Sprintf("/rest/v1/user_kyc")

	resp, err := db.MakeDBRequest("POST", endpoint, kyc, nil)
	if err != nil {
		return err
	}

	resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
        return fmt.Errorf("failed to create kyc")
	}

	return nil
}

// updating KYC
func UpdateUserKYC(email string, data interface{}) error {
	if email == "" {
		return fmt.Errorf("email cannot be empty")
	}

	endpoint := fmt.Sprintf("/rest/v1/user_kyc?email=eq.%s", url.QueryEscape(email))
	headers := map[string]string {
		"Prefer": "return=representation",
	}

	resp, err := db.MakeDBRequest("PATCH", endpoint, data, headers)
	if err != nil {
		return fmt.Errorf("database request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("failed to update data with status code: %d", resp.StatusCode)
	}

	return nil
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

// find if kyc is already created for user
func FindUserKYC(id string) (*db.UserKYC, error) {
    if id == "" {
        return nil, fmt.Errorf("id cannot be empty")
    }

    endpoint := fmt.Sprintf("/rest/v1/user_kyc?user_id=eq.%s", url.QueryEscape(id))

    resp, err := db.MakeDBRequest("GET", endpoint, nil, nil)
    if err != nil {
        // Return a nil pointer to the user, and the error from the request
        return nil, err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        // Return a nil pointer to the user, and the custom error
        return nil, ErrorGettingKYC
    }

    var kyc []db.UserKYC
    if err := json.NewDecoder(resp.Body).Decode(&kyc); err != nil {
        // Return a nil pointer to the user, and the decoding error
        return nil, err
    }

    if len(kyc) == 0 {
        // This is the correct way to handle "not found"
        // Return a nil pointer and a specific error
        return nil, ErrorKYCNotFound
    }

    // Return the user data and a nil error
    return &kyc[0], nil
}

// return reason for kyc fail which will be updated by admin
func checkUserKYCFailReason(id string) (string, error) {
	if id == "" {
		return "", fmt.Errorf("id cannot be empty")
	}

	// this will be mod later to allow admin update reason automatically from admin dashboard
	return "id mismatch", nil
}