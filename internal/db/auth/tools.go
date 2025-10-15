package authdb

import (
	"fmt"
	"errors"
	"net/http"
	"io"
	"github.com/oladev/ufinda_v0.01/internal/db"
	"net/url"
	"encoding/json"
)
// <-------------------------> Begin Error Tools <---------------------------->
var ErrorGettingPendingUser = errors.New("Failed to get pending user")
var ErrorGettingUser = errors.New("Failed to get user")
var ErrorUserNotFound = errors.New("no user found")
var ErrorPendingUserNotFound = errors.New("no pending user found")
var ErrorAssetNotFound = errors.New("no asset found")
var ErrorResetTokenNotFound = errors.New("no reset token found")
// <-------------------------> End Error Tools <---------------------------->

// <-------------------------------> Begin User Creation, Search, Update and Delete Tools <-------------------------------------->

func InsertPendingUser(pendinguser *db.PendingUser) error {
	// Construct the API endpoint string.
	endpoint := fmt.Sprintf("/rest/v1/pending_users")

	// Make the database request.
	resp, err := db.MakeDBRequest("POST", endpoint, pendinguser, nil)
	if err != nil {
		// Return the error directly if there was a problem making the request (e.g., network error).
		return fmt.Errorf("error making DB request to insert pending user: %w", err)
	}
	defer resp.Body.Close()

	// Check if the status code is what we expect for a successful creation (201 Created).
	if resp.StatusCode != http.StatusCreated {
		// --- Error Handling for Non-201 Status Code ---

		// 1. Read the entire response body.
		// This body often contains the detailed error message from the backend.
		bodyBytes, readErr := io.ReadAll(resp.Body)
		if readErr != nil {
			// If reading the body fails, return an error that includes the status code and the read error.
			return fmt.Errorf("failed to create pending user (Status: %d). Additionally, failed to read response body: %w", resp.StatusCode, readErr)
		}

		// 2. Convert the body bytes to a string for inclusion in the final error.
		bodyString := string(bodyBytes)
		
		// 3. Construct a detailed error.
		// This error now includes the non-success status code and the response body 
		// which should contain the detailed reason for the failure.
		return fmt.Errorf("failed to create pending user. Status: %d, Response Body: %s", resp.StatusCode, bodyString)
	}

	// Request was successful (Status 201).
	return nil
}

// update pending user record
func UpdatePendingUser(email string, data interface{}) error {
    endpoint := "/rest/v1/pending_users?email=eq." + url.QueryEscape(email)
    
    headers := map[string]string{
        "Prefer": "return=representation",
    }

    resp, err := db.MakeDBRequest("PATCH", endpoint, data, headers)
    if err != nil {
        return fmt.Errorf("error making DB request to update pending user: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode < 200 || resp.StatusCode >= 300 {
        bodyBytes, readErr := io.ReadAll(resp.Body)
        if readErr != nil {
            return fmt.Errorf("failed to update pending user (Status: %d). Additionally, failed to read response body: %w", resp.StatusCode, readErr)
        }

        // 2. Convert the body bytes to a string.
        bodyString := string(bodyBytes)
        
        return fmt.Errorf("failed to update pending user. Status: %d, Response Body: %s", resp.StatusCode, bodyString)
    }

    return nil
}

// find user during sign up
func FindPendingUser(email string) (*db.PendingUser, error) {
    url := fmt.Sprintf("/rest/v1/pending_users?email=eq.%s", url.QueryEscape(email))

    resp, err := db.MakeDBRequest("GET", url, nil, nil)
    if err != nil {
        return nil, fmt.Errorf("error making DB request to find pending user: %w: %w", err, ErrorGettingPendingUser)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        bodyBytes, readErr := io.ReadAll(resp.Body)
        if readErr != nil {
            return nil, fmt.Errorf("failed to find pending user (Status: %d). Additionally, failed to read response body: %w: %w", resp.StatusCode, readErr, ErrorGettingPendingUser)
        }

        // 2. Convert the body bytes to a string.
        bodyString := string(bodyBytes)

        return nil, fmt.Errorf("failed to find pending user by email. Status: %d, Response Body: %s: %w", resp.StatusCode, bodyString, ErrorGettingPendingUser)
    }


    var pendinguser []db.PendingUser
    if err := json.NewDecoder(resp.Body).Decode(&pendinguser); err != nil {
        return nil, fmt.Errorf("error decoding response for pending user: %w", err)
    }

    if len(pendinguser) == 0 {
        return nil, ErrorPendingUserNotFound
    }

    return &pendinguser[0], nil
}

// create the user in user table after verification
func CreateUser(user db.User) error {
    url := fmt.Sprintf("/rest/v1/users")

    resp, err := db.MakeDBRequest("POST", url, user, nil)
    if err != nil {
        return fmt.Errorf("error making DB request to create user: %w", err)
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusCreated {
        bodyBytes, readErr := io.ReadAll(resp.Body)
        if readErr != nil {
            return fmt.Errorf("failed to create user (Status: %d). Additionally, failed to read response body: %w", resp.StatusCode, readErr)
        }

        bodyString := string(bodyBytes)
        
        return fmt.Errorf("failed to create user. Status: %d, Response Body: %s", resp.StatusCode, bodyString)
    }

    return nil
}

// update created user
func UpdateCreatedUser(id string, data interface{}) error {
    endpoint := fmt.Sprintf("/rest/v1/users?id=eq.%s", url.QueryEscape(id))
    
    headers := map[string]string {
        "Prefer": "return=representation",
    }

    resp, err := db.MakeDBRequest("PATCH", endpoint, data, headers)
    if err != nil {
        return fmt.Errorf("database request failed: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode < 200 || resp.StatusCode >= 300 {
        bodyBytes, readErr := io.ReadAll(resp.Body)
        if readErr != nil {
            return fmt.Errorf("failed to update user (Status: %d). Additionally, failed to read response body: %w", resp.StatusCode, readErr)
        }

        bodyString := string(bodyBytes)
        
        return fmt.Errorf("failed to update user. Status: %d, Response Body: %s", resp.StatusCode, bodyString)
    }

    return nil
}

// delete the pending user afer successful verification and creation of the user
func DeletePendingUser(email string) error {
	url := fmt.Sprintf("/rest/v1/pending_users?email=eq.%s", url.QueryEscape(email))

	resp, err := db.MakeDBRequest("DELETE", url, nil, nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		return fmt.Errorf("failed to delete user")
	}
	return nil
}

func FindCreatedUserByEmail(email string) (*db.User, error) {
	var user []db.User

	url := fmt.Sprintf("/rest/v1/users?email=eq.%s", url.QueryEscape(email))

	resp, err := db.MakeDBRequest("GET", url, nil, nil)
	if err != nil {
		return nil, ErrorGettingUser
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, ErrorGettingUser
	}

	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, err
	}
	if len(user) == 0 {
		return nil, ErrorUserNotFound
	}
	return &user[0], nil
}

func FindCreatedUserByID(id string) (*db.User, error) {
    var user []db.User

    url := fmt.Sprintf("/rest/v1/users?id=eq.%s", url.QueryEscape(id))

    resp, err := db.MakeDBRequest("GET", url, nil, nil)
    if err != nil {
        return nil, fmt.Errorf("error making DB request to find user: %w: %w", err, ErrorGettingUser)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        bodyBytes, readErr := io.ReadAll(resp.Body)
        if readErr != nil {
            return nil, fmt.Errorf("failed to find user by ID (Status: %d). Additionally, failed to read response body: %w: %w", resp.StatusCode, readErr, ErrorGettingUser)
        }

        bodyString := string(bodyBytes)
        
        return nil, fmt.Errorf("failed to find user. Status: %d, Response Body: %s: %w", resp.StatusCode, bodyString, ErrorGettingUser)
    }

    if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
        return nil, fmt.Errorf("error decoding response for user: %w", err)
    }
    
    if len(user) == 0 {
        return nil, ErrorUserNotFound
    }
    
    return &user[0], nil
}
// <-------------------------------> End User Creation, Search, Update and Delete Tools <-------------------------------------->

// AssetsResponse represents the data we expect back, containing only the nested tables.
type AssetsResponse struct {
	// Embedded 'user_kyc' fields (expected as a slice with one element)
	UserKYC []struct {
		ProfileImg string `json:"profile_img"`
	} `json:"user_kyc"`

	// Embedded 'hostel' fields (expected as a slice with one element)
	Hostel []struct {
		HostelImages  []string `json:"hostel_images"`
		HostelVideos  []string `json:"hostel_videos"`
	} `json:"hostel"`
}


func DeleteCreatedUserByID(userID string) error {
	url := fmt.Sprintf("/rest/v1/users?id=eq.%s", url.QueryEscape(userID)) 

	resp, err := db.MakeDBRequest("DELETE", url, nil, nil)
	if err != nil {
		// Return the error encountered during the HTTP request itself (e.g., network issues)
		return fmt.Errorf("error making DB request to delete user %s: %w", userID, err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		// Read the entire response body for detailed error information
		bodyBytes, readErr := io.ReadAll(resp.Body)
		bodyString := string(bodyBytes)

		// Check if there was an error reading the body
		if readErr != nil {
			return fmt.Errorf("failed to delete user: received status code %d. Also, failed to read response body: %w", resp.StatusCode, readErr)
		}

		// Return a detailed error including the status code and the response body
		return fmt.Errorf("failed to delete user: received unexpected status code %d. Response body: %s", resp.StatusCode, bodyString)
	}

	// Deletion was successful (StatusNoContent)
	return nil
}

func CreateResetToken(resetData db.ResetPwdData) error {
	url := fmt.Sprint("/rest/v1/password_reset")

	resp, err := db.MakeDBRequest("POST", url, resetData, nil)
	if err != nil {
		return fmt.Errorf("error making DB request to upload reset token: %w", err)
	}
	defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusCreated {
        bodyBytes, readErr := io.ReadAll(resp.Body)
        if readErr != nil {
            return fmt.Errorf("failed to upload reset token (Status: %d). Additionally, failed to read response body: %w", resp.StatusCode, readErr)
        }

        bodyString := string(bodyBytes)
        
        return fmt.Errorf("failed to upload reset token. Status: %d, Response Body: %s", resp.StatusCode, bodyString)
    }

    return nil
}

func FindResetToken(token string) (*db.ResetPwdData, error) {
	if token == "" {
		return nil, fmt.Errorf("token cannot be empty")
	}
	url := fmt.Sprintf("/rest/v1/password_reset?token=eq.%s", url.QueryEscape(token))
	resp, err := db.MakeDBRequest("GET", url, nil, nil)

	if err != nil {
		return nil, fmt.Errorf("error making DB request to find reset token data: %w", err)
	}
	defer resp.Body.Close()

	// 2. Elaborate Error Handling (reading body on non-200 status)
	if resp.StatusCode != http.StatusOK {
		bodyBytes, readErr := io.ReadAll(resp.Body)
		if readErr != nil {
			return nil, fmt.Errorf("failed to find reset token data (Status: %d). Failed to read body: %w", resp.StatusCode, readErr)
		}
		bodyString := string(bodyBytes)
		return nil, fmt.Errorf("failed to find reset token data. Status: %d, Response Body: %s", resp.StatusCode, bodyString)
	}

	var responseArray []db.ResetPwdData
	if err := json.NewDecoder(resp.Body).Decode(&responseArray); err != nil {
		return nil, fmt.Errorf("error decoding response for reset token data: %w", err)
	}

	if len(responseArray) == 0 {
		return nil, ErrorResetTokenNotFound
	}

	return &responseArray[0], nil
}

func DeleteResetToken(token string) error {
	url := fmt.Sprintf("/rest/v1/password_reset?token=eq.%s", url.QueryEscape(token))
	resp, err := db.MakeDBRequest("DELETE", url, nil, nil)

	if err != nil {
		return fmt.Errorf("error making DB request to delete reset token data: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		bodyBytes, readErr := io.ReadAll(resp.Body)
		if readErr != nil {
			return fmt.Errorf("failed to delete reset token data (Status: %d). Failed to read body: %w", resp.StatusCode, readErr)
		}
		bodyString := string(bodyBytes)
		return fmt.Errorf("failed to delete reset token data. Status: %d, Response Body: %s", resp.StatusCode, bodyString)
	}

	return nil
}