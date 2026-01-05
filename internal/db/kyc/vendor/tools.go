package vendorkycdb

import (
	"github.com/oladev/ufinda_v0.01/internal/db"
	"fmt"
	"encoding/json"
	"net/http"
	"errors"
	"net/url"
	"io"
)

var ErrKYCNotFound = errors.New("no kyc found")
var ErrUserNotFound = errors.New("user not found")

func CreateVendorKyc(data db.VendorKYC) error {
	// 1. Define the endpoint for creation
	url := fmt.Sprintf("/rest/v1/vendor_kyc")

	// 2. IMPORTANT FIX: Change method to POST and pass 'data' as the body
	// Assuming db.MakeDBRequest can handle marshalling the body interface{}
	resp, err := db.MakeDBRequest("POST", url, data, nil) // Changed "GET" to "POST" and added 'data'
	if err != nil {
		// Handles network errors, connection issues, etc.
		return fmt.Errorf("database request failed during KYC creation: %w", err)
	}
	defer resp.Body.Close()

	// 3. IMPORTANT FIX: Expect StatusCreated (201) for a successful POST
	if resp.StatusCode != http.StatusCreated { 
		// --- Error Handling Block (Correct) ---
		bodyBytes, readErr := io.ReadAll(resp.Body)
		if readErr != nil {
			return fmt.Errorf("failed to create kyc with status %d, and failed to read error body: %w", resp.StatusCode, readErr)
		}

		var apiError struct {
			Message string `json:"message"`
			Details string `json:"details"`
			Code string `json:"code"`
		}

		if jsonErr := json.Unmarshal(bodyBytes, &apiError); jsonErr == nil && apiError.Message != "" {
			return fmt.Errorf("failed to create kyc (Status: %d). API Error: %s, Details: %s", 
				resp.StatusCode, apiError.Message, apiError.Details)
		}

		// Fallback: Return raw status and body
		return fmt.Errorf("failed to create kyc (Status: %d). Raw response: %s", 
			resp.StatusCode, string(bodyBytes))
	}

	return nil
}


func UpdateVendorKyc(userid string, data interface{}) error {
	url := fmt.Sprintf("/rest/v1/vendor_kyc?user_id=eq.%s", url.QueryEscape(userid))

	headers := map[string]string{
		"Prefer": "return=representation",
	}

	resp, err := db.MakeDBRequest("PATCH", url, data, headers)
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

func FindVendorKYC(id string) (*db.VendorKYC, error) {
	endpoint := fmt.Sprintf("/rest/v1/vendor_kyc?user_id=eq.%s", url.QueryEscape(id))

	resp, err := db.MakeDBRequest("GET", endpoint, nil, nil)
	if err != nil {
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

	var kyc []db.VendorKYC
	if err := json.NewDecoder(resp.Body).Decode(&kyc); err != nil {
		return nil, fmt.Errorf("failed to decode KYC response into expected structure: %w", err)
	}

	if len(kyc) == 0 {
		return nil, ErrKYCNotFound
	}

	return &kyc[0], nil
}

func GetVendorProfile(userID string) (*db.VendorProfileInfo, error) {
	selectQuery := "first_name,last_name,email,phone,kyc_data:fk_vendor_kyc(profile_img,address,about_me)"

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

	var users []db.VendorProfileInfo
	if err := json.NewDecoder(resp.Body).Decode(&users); err != nil {
		return nil, fmt.Errorf("failed to get user profile: %w", err)
	}

	if len(users) == 0 {
		return nil, ErrUserNotFound
	}

	return &users[0], nil
}