package clientauth

import (
	"os"
	"fmt"
	"crypto/rand"
	"errors"
	"math/big"
	"net/http"
	"uFinda/internal/db"
	"net/url"
	"encoding/json"
	"golang.org/x/crypto/bcrypt"
)



// <-------------------------> Begin Error Tools <---------------------------->
var ErrorGettingPendingUser = errors.New("Failed to get pending user")
var ErrorGettingUser = errors.New("Failed to get user")
var ErrorUserNotFound = errors.New("no user found")
var ErrorPendingUserNotFound = errors.New("no pending user found")
var InvalidRequest = "invalid request"
// <-------------------------> End Error Tools <---------------------------->

// <-------------------------> Begin Data Type Tools <---------------------------->
type SignupRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	LastName string `json:"last_name"`
	FirstName string `json:"first_name"`
	Phone string `json:"phone"`
}

type VerifyOtp struct {
	Email string `json:"email"`
	OTP string `json:"otp"`
}

type LoginRequest struct {
	Email string `json:"email"`
	Password string `json:"password"`
}

type ResendOTP struct {
	Email string `json:"email"`
}
// <-------------------------> End Data Type Tools <---------------------------->

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
func UpdateCreatedUser(email string, data interface{}) error {
	if email == "" {
		return fmt.Errorf("email cannot be empty")
	}

	endpoint := fmt.Sprintf("/rest/v1/users?email=eq.%s", url.QueryEscape(email))
	
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

func FindCreatedUser(email string) (*db.User, error) {
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
// <-------------------------------> End User Creation, Search, Update and Delete Tools <-------------------------------------->

// <-------------------------------> Password Check Tools <-------------------------------------->
func CheckPasswordMatch(loginpwd string, hashedPwd string) (bool, error) {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPwd), []byte(loginpwd))
	if err != nil {
		if err == bcrypt.ErrMismatchedHashAndPassword {
			// This is a common error, indicating a password mismatch.
			return false, nil
		}
		return false, fmt.Errorf("error comparing hash and password: %w", err)
	}

	return true, nil
}
// <-------------------------------> End Password Check Tools <-------------------------------------->
