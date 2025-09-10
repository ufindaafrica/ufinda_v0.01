package kycdb

import (
	"fmt"
	"net/url"
	"errors"
	"net/http"
	"encoding/json"
	"github.com/google/uuid"
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

// find if kyc is already created for user
func FindUserKYC(id uuid.UUID) (*db.UserKYC, error) {
    endpoint := fmt.Sprintf("/rest/v1/user_kyc?user_id=eq.%s", id)

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
func CheckUserKYCFailReason(user_id uuid.UUID) (string, error) {
	url := fmt.Sprintf("/rest/v1/kyc_fail_reason?user_id=eq.%s", user_id)

	resp, err := db.MakeDBRequest("GET", url, nil, nil)
	if err != nil {
		return "", err
	}

	defer resp.Body.Close()

	var failReason db.KycFailReason

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("fail to get kyc fail reason")
	}
	if err := json.NewDecoder(resp.Body).Decode(&failReason); err != nil {
		return "", err
	}

	return failReason.Reason, nil
}

func CreateUserKYCFailReason(user_id uuid.UUID, reason db.KycFailReason) error {
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

func DeleteKycFailReason(user_id uuid.UUID) error {
	url := fmt.Sprintf("/rest/v1/kyc_fail_reason?user_id=eq.%s", user_id)

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