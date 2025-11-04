package userkycdb

import (
	"fmt"
	"io"
	"context"
	"time"
	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"errors"
	"net/http"
	"net/url"
	"encoding/json"
	"github.com/oladev/ufinda_v0.01/internal/db"
)

var ErrorKYCNotFound = errors.New("no KYC found")
var ErrorUserNotFound = errors.New("no user found, please create an account")
var ErrorGettingKYC = errors.New("Failed to get kyc")
var ErrorGettingUser = errors.New("Failed to get user")


// create kyc
func CreateUserKYC(kyc db.UserKYC) error {
	endpoint := fmt.Sprintf("/rest/v1/user_kyc")

	resp, err := db.MakeDBRequest("POST", endpoint, kyc, nil)
	if err != nil {
		// Handles network errors, connection issues, etc.
		return fmt.Errorf("database request failed during KYC creation: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		// --- Read the Error Response Body ---
		bodyBytes, readErr := io.ReadAll(resp.Body)
		if readErr != nil {
			// If reading the body fails, return the status code error
			return fmt.Errorf("failed to create kyc with status %d, and failed to read error body: %w", resp.StatusCode, readErr)
		}

		// Attempt to parse the body as a JSON error response (common for PostgREST/APIs)
		var apiError struct {
			Message string `json:"message"`
			Details string `json:"details"`
			Code    string `json:"code"`
		}

		// Try to unmarshal the JSON error body
		if jsonErr := json.Unmarshal(bodyBytes, &apiError); jsonErr == nil && apiError.Message != "" {
			// If parsing is successful, return the detailed API message
			return fmt.Errorf("failed to create kyc (Status: %d). API Error: %s, Details: %s", 
				resp.StatusCode, apiError.Message, apiError.Details)
		}

		// Fallback: If parsing failed, return the raw status and body
		return fmt.Errorf("failed to create kyc (Status: %d). Raw response: %s", 
			resp.StatusCode, string(bodyBytes))
	}

	return nil
}

func UpdateUserKYC(id string, data interface{}) error {
	endpoint := fmt.Sprintf("/rest/v1/user_kyc?user_id=eq.%s", url.QueryEscape(id)) 
    
	headers := map[string]string{
		"Prefer": "return=representation",
	}

	resp, err := db.MakeDBRequest("PATCH", endpoint, data, headers)
	if err != nil {
		return fmt.Errorf("database request failed for KYC update: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		bodyBytes, readErr := io.ReadAll(resp.Body)
		if readErr != nil {
			// If reading the body fails, return the status code error
			return fmt.Errorf("failed to update KYC (Status: %d). Failed to read error body: %w", resp.StatusCode, readErr)
		}

		// Attempt to parse the body as a JSON error response (common for APIs)
		var apiError struct {
			Message string `json:"message"`
			Details string `json:"details"`
			Code    string `json:"code"`
		}

		// Try to unmarshal the JSON error body
		if jsonErr := json.Unmarshal(bodyBytes, &apiError); jsonErr == nil && apiError.Message != "" {
			// If parsing is successful, return the detailed API message
			return fmt.Errorf("failed to update KYC (Status: %d). API Error: %s, Details: %s, Code: %s",
				resp.StatusCode, apiError.Message, apiError.Details, apiError.Code)
		}

		// Fallback: If parsing failed, return the raw status and body content
		return fmt.Errorf("failed to update KYC (Status: %d). Raw response: %s",
			resp.StatusCode, string(bodyBytes))
	}

	return nil
}

func FindUserKYC(id string) (*db.UserKYC, error) {
	endpoint := fmt.Sprintf("/rest/v1/user_kyc?user_id=eq.%s", url.QueryEscape(id))

	resp, err := db.MakeDBRequest("GET", endpoint, nil, nil)
	if err != nil {
		// Return a nil pointer and a detailed error for the request failure
		return nil, fmt.Errorf("error executing DB request for KYC: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, readErr := io.ReadAll(resp.Body)
		bodyString := string(bodyBytes)

		// Check if there was an error reading the body
		if readErr != nil {
			return nil, fmt.Errorf("failed to retrieve KYC: received status code %d. Also, failed to read response body: %w",
				resp.StatusCode, readErr)
		}

		// Return a detailed error including the status code and the response body
		return nil, fmt.Errorf("failed to retrieve KYC: received unexpected status code %d. Response body: %s",
			resp.StatusCode, bodyString)
	}

	// Assuming a successful 200 OK response from the database API
	var kyc []db.UserKYC // Note: DB APIs often return an array even for single resource queries
	if err := json.NewDecoder(resp.Body).Decode(&kyc); err != nil {
		// Return a nil pointer and a detailed error for JSON decoding failure
		// The error will include context on why the decoding failed (e.g., unexpected format)
		return nil, fmt.Errorf("failed to decode KYC response into expected structure: %w", err)
	}

	if len(kyc) == 0 {
		// This is the specific "not found" case, which should be returned as the custom error.
		return nil, ErrorKYCNotFound
	}

	// Successfully found and decoded the KYC record
	return &kyc[0], nil
}

// return reason for kyc fail which will be updated by admin
func CheckUserKycLog(user_id string) (string, error) {
	url := fmt.Sprintf("/rest/v1/kyc_log?user_id=eq.%s", url.QueryEscape(user_id))

	resp, err := db.MakeDBRequest("GET", url, nil, nil)
	if err != nil {
		return "", err
	}

	defer resp.Body.Close()

	var failReason db.KycLog

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("fail to get kyc fail reason")
	}
	if err := json.NewDecoder(resp.Body).Decode(&failReason); err != nil {
		return "", err
	}

	return failReason.Reason, nil
}

func CreateUserKycLog(user_id string, reason db.KycLog) error {
	url := fmt.Sprintf("/rest/v1/kyc_fail_reason?user_id=eq.%s", user_id)

	resp, err := db.MakeDBRequest("POST", url, reason, nil)
	if err != nil {
		return err
	}

	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("fail to create kyc fail reason")
	}

	return nil
}

func DeleteKycLog(user_id string) error {
	url := fmt.Sprintf("/rest/v1/kyc_log?user_id=eq.%s", url.QueryEscape(user_id))

	resp, err := db.MakeDBRequest("DELETE", url, nil, nil)
	if err != nil {
		return err
	}

	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("fail to delete kyc fail reason")
	}

	return nil
}

func UploadProfileImage(cld *cloudinary.Cloudinary, reader io.Reader, filename string) (string, string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	uploadParams := uploader.UploadParams{
		Folder:   "user/profile/images", // Correct folder for images
		PublicID: filename,
	}

	resp, err := cld.Upload.Upload(ctx, reader, uploadParams)
	if err != nil {
		return "", "", fmt.Errorf("failed to upload file to cloud service: %w", err)
	}

	return resp.SecureURL, resp.PublicID, nil
}
