package response

import (
	// "net/http"

	"github.com/gin-gonic/gin"
)

// Response defines the universal top-level JSON envelope
type Response struct {
	Status  string      `json:"status"`
	Code    string      `json:"code,omitempty"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	// Meta    interface{} `json:"meta,omitempty"` // Easy extensibility for pagination, extra debug info, etc.
}

// 1. Centralized Error Code Constants
const (
	ErrCodeBadRequest      = "BAD_REQUEST"
	ErrCodeUserNotFound    = "USER_NOT_FOUND"
	ErrCodeAccountExists   = "ACCOUNT_ALREADY_EXISTS"
	ErrCodeInvalidOTP      = "INVALID_OTP"
	ErrCodeInvalidPWD	   = "INVALID_PWD"
	ErrCodeOTPExpired      = "OTP_EXPIRED"
	ErrCodePaymentRequired = "PAYMENT_REQUIRED"
	ErrCodeServerError     = "SERVER_ERROR"
	ErrCodeUnauthorized	   = "UNAUTHORIZED"
	ErrCodeTooManyRequests = "RATE_LIMIT_EXCEEDED"
)

// 2. Centralized Error Messages Registry (Optional Map Lookup)
var ErrorMessages = map[string]string{
	ErrCodeBadRequest:      "Invalid request payload. Please check your input.",
	ErrCodeUserNotFound:    "No account found with this email. Please sign up to continue.",
	ErrCodeAccountExists:   "An account with this email already exists. Please log in.",
	ErrCodeInvalidPWD:		"Invalid Password",
	ErrCodeInvalidOTP:      "The OTP entered is incorrect. Please check and try again.",
	ErrCodeOTPExpired:      "Your OTP has expired. Please request a new code.",
	ErrCodePaymentRequired: "An onboarding fee is required to activate your account.",
	ErrCodeServerError:     "An unexpected error occurred. Please try again.",
	ErrCodeUnauthorized:	"Unauthorized access. Please log in again.",
	ErrCodeTooManyRequests: "Too many attempts. Please wait a moment before trying again.",
}

// Error responds with a standardized error JSON structure.
// You can supply a custom message, or pass an empty string "" to automatically use the map lookup.
func Error(c *gin.Context, statusCode int, code string, optionalArgs ...interface{}) {
	message := ErrorMessages[code] // Fallback to registry map
	var data interface{}

	for _, arg := range optionalArgs {
		switch v := arg.(type) {
		case string:
			if v != "" {
				message = v
			}

		default:
			data = v
		}
	}

	c.JSON(statusCode, Response{
		Status:  "error",
		Code:    code,
		Message: message,
		Data: data,
	})
}

// Success responds with a standardized success JSON structure
func Success(c *gin.Context, statusCode int, message string, data ...interface{}) {
	var responseData interface{}
	if len(data) > 0 {
		responseData = data[0]
	}

	c.JSON(statusCode, Response{
		Status:  "success",
		Message: message,
		Data:    responseData,
	})
}