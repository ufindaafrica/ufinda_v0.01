package authdb

import (
	"fmt"
	"errors"
	"strings"
	"net/http"
	"io"
	"log"
	"github.com/oladev/ufinda_v0.01/internal/db"
	"net/url"
	"encoding/json"
)

type PostgrestError struct {
    Message string `json:"message"`
    Code    string `json:"code"`
    Details string `json:"details"`
    Hint    string `json:"hint"`
}

// <-------------------------> Begin Error Tools <---------------------------->
var (
	ErrGettingUser = errors.New("Failed to get user")
	ErrUserNotFound = errors.New("user not found")
	ErrAssetNotFound = errors.New("no asset found")
	ErrResetTokenNotFound = errors.New("no reset token found")
	ErrUserCreateFailed = errors.New("could not create user account")
)
// <-------------------------> End Error Tools <---------------------------->

// <-------------------------------> Begin User Creation, Search, Update and Delete Tools <-------------------------------------->

func InsertPendingUser(pendinguser *db.PendingUser) error {
    // 1. PRE-CHECK: Is the username already taken in the main 'users' table?
    if pendinguser.UserName != nil && *pendinguser.UserName != "" {
        // Query the main users table for this specific username
        // PostgREST syntax: /users?username=eq.the_name&select=id
        checkEndpoint := fmt.Sprintf("/rest/v1/users?username=eq.%s&select=id", *pendinguser.UserName)
        
        checkResp, err := db.MakeDBRequest("GET", checkEndpoint, nil, nil)
        if err != nil {
            log.Printf("[ERROR] Failed to check username existence: %v", err)
            return errors.New("service temporarily unavailable")
        }
        defer checkResp.Body.Close()

        // PostgREST returns an array. If the array is not empty (length > 2), it exists.
        bodyBytes, _ := io.ReadAll(checkResp.Body)
        if string(bodyBytes) != "[]" {
            return errors.New("this username is already taken by a verified user")
        }
    }

    // 2. INSERT: If check passes, proceed to save in pending_users
    endpoint := "/rest/v1/pending_users"
    resp, err := db.MakeDBRequest("POST", endpoint, pendinguser, nil)
    if err != nil {
        log.Printf("[CRITICAL] DB Connection Error: %v", err)
        return errors.New("could not connect to database")
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusCreated {
        var pgErr PostgrestError // Use the struct we defined earlier
        bodyBytes, _ := io.ReadAll(resp.Body)
        json.Unmarshal(bodyBytes, &pgErr)

        // Handle Database Constraint Errors (like the Vendor Username rule)
        if strings.Contains(pgErr.Message, "pending_username_role_check") {
            return errors.New("vendors must provide a valid username")
        }

        // Handle Duplicate Email in pending_users
        if pgErr.Code == "23505" {
            return errors.New("this email is already registered")
        }

        return errors.New("registration failed, please try again")
    }

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

func FindPendingUser(email string) (*db.PendingUser, error) {
    url := fmt.Sprintf("/rest/v1/pending_users?email=eq.%s", url.QueryEscape(email))

    resp, err := db.MakeDBRequest("GET", url, nil, nil)
    if err != nil {
		log.Printf("[CRITICAL] DB error: %v", err)
        return nil, ErrGettingUser
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        bodyBytes, _ := io.ReadAll(resp.Body)
        bodyString := string(bodyBytes)
		log.Printf("[CRITICAL] failed to find pending user by email. Status: %d, Response Body: %s", resp.StatusCode, bodyString)
        return nil, ErrGettingUser
    }

    var pendinguser []db.PendingUser
    if err := json.NewDecoder(resp.Body).Decode(&pendinguser); err != nil {
		log.Printf("error decoding response: %w", err)
        return nil, ErrGettingUser
    }

    if len(pendinguser) == 0 {
        return nil, ErrUserNotFound
    }

    return &pendinguser[0], nil
}

// create the user in user table after verification
func CreateUser(user db.User) error {
    url := fmt.Sprintf("/rest/v1/users")

    resp, err := db.MakeDBRequest("POST", url, user, nil)
    if err != nil {
		log.Printf("[CRITICAL] DB Error: %v", err)
        return ErrUserCreateFailed
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusCreated {
        bodyBytes, _ := io.ReadAll(resp.Body)
        bodyString := string(bodyBytes)
        log.Printf("[CRITICAL] failed to create user. Status: %d, Response Body: %s", resp.StatusCode, bodyString)
        return ErrUserCreateFailed
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
		log.Printf("[CRITICAL] DB Error: %v", err)
		return nil, ErrGettingUser
	}
	defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        bodyBytes, _ := io.ReadAll(resp.Body)
        bodyString := string(bodyBytes)
		log.Printf("[CRITICAL] failed to get user [%s] by email. Status: %d, Response Body: %s", email, resp.StatusCode, bodyString)
        return nil, ErrGettingUser
    }

	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		log.Printf("error decoding response: %w", err)
		return nil, ErrGettingUser
	}

	if len(user) == 0 {
		return nil, ErrUserNotFound
	}
	return &user[0], nil
}

func FindCreatedUserByID(id string) (*db.User, error) {
    var user []db.User

    url := fmt.Sprintf("/rest/v1/users?id=eq.%s", url.QueryEscape(id))

    resp, err := db.MakeDBRequest("GET", url, nil, nil)
    if err != nil {
        return nil, fmt.Errorf("error making DB request to find user: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        bodyBytes, _ := io.ReadAll(resp.Body)

        bodyString := string(bodyBytes)
        
        return nil, fmt.Errorf("failed to find user. Status: %d, Response Body: %s", resp.StatusCode, bodyString)
    }

    if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
        return nil, fmt.Errorf("error decoding response for user: %w", err)
    }
    
    if len(user) == 0 {
        return nil, ErrUserNotFound
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
		bodyBytes, _ := io.ReadAll(resp.Body)
		bodyString := string(bodyBytes)

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
        bodyBytes, _ := io.ReadAll(resp.Body)

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
		bodyBytes, _ := io.ReadAll(resp.Body)

		bodyString := string(bodyBytes)
		return nil, fmt.Errorf("failed to find reset token data. Status: %d, Response Body: %s", resp.StatusCode, bodyString)
	}

	var responseArray []db.ResetPwdData
	if err := json.NewDecoder(resp.Body).Decode(&responseArray); err != nil {
		return nil, fmt.Errorf("error decoding response for reset token data: %w", err)
	}

	if len(responseArray) == 0 {
		return nil, ErrResetTokenNotFound
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
		bodyBytes, _ := io.ReadAll(resp.Body)

		bodyString := string(bodyBytes)
		return fmt.Errorf("failed to delete reset token data. Status: %d, Response Body: %s", resp.StatusCode, bodyString)
	}

	return nil
}
