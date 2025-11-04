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

var ErrorKYCNotFound = errors.New("no KYC found")

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
	var kyc []db.VendorKYC // Note: DB APIs often return an array even for single resource queries
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