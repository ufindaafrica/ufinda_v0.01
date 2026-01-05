package userkycdb

import (
	"fmt"
	"io"
	"errors"
	"net/http"
	"net/url"
	"encoding/json"
	"github.com/oladev/ufinda_v0.01/internal/db"
)

var ErrKYCNotFound = errors.New("no KYC found")
var ErrUserNotFound = errors.New("no user found, please create an account")
var ErrGettingKYC = errors.New("Failed to get kyc")
var ErrGettingUser = errors.New("Failed to get user")


// create kyc
func CreateUserKYC(kyc db.UserKYC) error {
	endpoint := fmt.Sprintf("/rest/v1/user_kyc")

	resp, err := db.MakeDBRequest("POST", endpoint, kyc, nil)
	if err != nil {
		// Handles network errors, connection issues, etc.
		return fmt.Errorf("failed to create kyc: %w", err)
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
		return fmt.Errorf("failed to update KYC: %w", err)
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
		return nil, fmt.Errorf("failed to get KYC: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, readErr := io.ReadAll(resp.Body)
		bodyString := string(bodyBytes)

		if readErr != nil {
			return nil, fmt.Errorf("failed to get KYC: received status code %d. Also, failed to read response body: %w",
				resp.StatusCode, readErr)
		}

		return nil, fmt.Errorf("failed to get KYC: received unexpected status code %d. Response body: %s",
			resp.StatusCode, bodyString)
	}

	var kyc []db.UserKYC // Note: DB APIs often return an array even for single resource queries
	if err := json.NewDecoder(resp.Body).Decode(&kyc); err != nil {
		return nil, fmt.Errorf("failed to get KYC: %w", err)
	}

	if len(kyc) == 0 {
		return nil, ErrKYCNotFound
	}

	// Successfully found and decoded the KYC record
	return &kyc[0], nil
}

// return reason for kyc fail which will be updated by admin
func CheckUserKycLog(user_id string) (string, error) {
	url := fmt.Sprintf("/rest/v1/kyc_log?user_id=eq.%s", url.QueryEscape(user_id))

	resp, err := db.MakeDBRequest("GET", url, nil, nil)
	if err != nil {
		return "", fmt.Errorf("fail to get kyc fail reason: %w", err)
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
		return fmt.Errorf("fail to create kyc fail reason: %w", err)
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

func GetUserProfile(userID string) (*db.UserProfileInfo, error) {
	selectQuery := "first_name,last_name,phone,email,kyc_data:fk_user_kyc(profile_img,address,level,dept,faculty,matric,about_me)"

	// 2. Construct the URL
	params := url.Values{}
	params.Set("id", "eq."+userID)
	params.Set("select", selectQuery)
	params.Set("limit", "1") 

	finalURL := fmt.Sprintf("/rest/v1/users?%s", params.Encode())

	// 3. Make the Request
	resp, err := db.MakeDBRequest("GET", finalURL, nil, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get user profile: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)

        bodyString := string(bodyBytes)
        
        return nil, fmt.Errorf("failed to get user profile. Status: %d, Response Body: %s", resp.StatusCode, bodyString)
	}

	var users []db.UserProfileInfo
	if err := json.NewDecoder(resp.Body).Decode(&users); err != nil {
		return nil, fmt.Errorf("failed to get user profile: %w", err)
	}

	if len(users) == 0 {
		return nil, ErrUserNotFound
	}

	return &users[0], nil
}