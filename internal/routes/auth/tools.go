package auth

import (
	"fmt"
	"golang.org/x/crypto/bcrypt"
	"errors"
)

// <-------------------------> Begin Error Tools <---------------------------->
var (
	ErrGettingPendingUser = errors.New("Failed to get pending user")
	ErrGettingUser = errors.New("Failed to get user")
	ErrUserNotFound = errors.New("user not found")
	InvalidRequest = "invalid request"
	MsgAccountExists = "An account with this email already exists. Please check your inbox to verify."
	MsgAccountCreated = "An account with this email already exists. Please login to your account."
	MsgServerError = "An unexpected error occurred. Please try again."
)
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

type ForgetPwdData struct {
	Email string `json:"email"`
}

type ResetPwdData struct{
	Token string `json:"token" binding:"required"`
	NewPassword string `json:"new_password" binding:"required"`
}

type ChangePwd struct {
	NewPassword string `json:"new_password" binding:"required"`
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
