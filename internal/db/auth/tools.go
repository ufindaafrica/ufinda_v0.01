package authdb

import (
	"fmt"
	"errors"
	"net/http"
	"github.com/google/uuid"
	"github.com/oladev/ufinda_v0.01/internal/db"
	"net/url"
	"encoding/json"
)
// <-------------------------> Begin Error Tools <---------------------------->
var ErrorGettingPendingUser = errors.New("Failed to get pending user")
var ErrorGettingUser = errors.New("Failed to get user")
var ErrorUserNotFound = errors.New("no user found")
var ErrorPendingUserNotFound = errors.New("no pending user found")
// <-------------------------> End Error Tools <---------------------------->

// <-------------------------------> Begin User Creation, Search, Update and Delete Tools <-------------------------------------->
func InsertPendingUser(pendinguser *db.PendingUser) error {

	endpoint := fmt.Sprintf("/rest/v1/pending_users")
	
	resp, err := db.MakeDBRequest("POST", endpoint, pendinguser, nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("failed to create pending user")
	}
	return nil
}

// update pending user record
func UpdatePendingUser(email string, data interface{}) error {
	if email == "" {
		return fmt.Errorf("email cannot be empty")
	}

	// Correct endpoint for a PATCH request to a specific user.
	// We'll use a URL query parameter for filtering and add headers.
	endpoint := "/rest/v1/pending_users?email=eq." + url.QueryEscape(email)
	headers := map[string]string{
		"Prefer": "return=representation", // Some APIs require this for PATCH
	}

	resp, err := db.MakeDBRequest("PATCH", endpoint, data, headers)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("failed to update data with status code: %d", resp.StatusCode)
	}

	return nil
}

// find user during sign up
func FindPendingUser(email string) (*db.PendingUser, error) {
	url := fmt.Sprintf("/rest/v1/pending_users?email=eq.%s", url.QueryEscape(email))

	resp, err := db.MakeDBRequest("GET", url, nil, nil)
	if err != nil {
		return nil, ErrorGettingPendingUser
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, ErrorGettingPendingUser
	}

	var pendinguser []db.PendingUser
	if err := json.NewDecoder(resp.Body).Decode(&pendinguser); err != nil {
		return nil, err
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
		return err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("failed to create user")
	}

	return nil
}

// update created user
func UpdateCreatedUser(id uuid.UUID, data interface{}) error {
	endpoint := fmt.Sprintf("/rest/v1/users?id=eq.%s", id)
	
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

func FindCreatedUserByID(id uuid.UUID) (*db.User, error) {
	var user []db.User

	url := fmt.Sprintf("/rest/v1/users?id=eq.%s", id)

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
// <-------------------------------> End User Creation, Search, Update and Delete Tools <-------------------------------------->
