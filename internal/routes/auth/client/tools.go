package auth

import (
	"fmt"
	"golang.org/x/crypto/bcrypt"
	"errors"
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
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required`
	Role string `json:"role" binding:"required`
	LastName string `json:"last_name" binding:"required`
	FirstName string `json:"first_name" binding:"required`
	Phone string `json:"phone" binding:"required`
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
