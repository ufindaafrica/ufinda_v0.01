package routes

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	mathrand "math/rand"
	"net/http"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"
	"uFinda/internal/db"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// Request structures
type SendOTPRequest struct {
	Phone string `json:"phone" binding:"required"`
	Role string `json:"role" binding:"required,oneof=user vendor"`
}

type VerifyOTPRequest struct {
	Phone string `json:"phone" binding:"required"`
	OTP   string `json:"otp" binding:"required"`
	Role string `json:"role" binding:"required,oneof=user vendor"`
}

type PhoneSignupRequest struct {
	Phone    string `json:"phone" binding:"required"`
	Password string `json:"password" binding:"required"`
	Role string `json:"role" binding:required,oneof=user vendor"`
}

type PhoneLoginRequest struct {
	Phone    string `json:"phone" binding:"required"`
	Password string `json:"password" binding:"required"`
	Role string `json:"role" binding:required,oneof=user vendor"`
}

// Response structures
type AuthResponse struct {
	Success      bool   `json:"success"`
	Message      string `json:"message"`
	AccessToken  string `json:"access_token,omitempty"`
	RefreshToken string `json:"refresh_token,omitempty"`
	User         User   `json:"user,omitempty"`
}

type User struct {
	ID            string `json:"id"`
	Phone         string `json:"phone,omitempty"`
	PhoneVerified *bool   `json:"phone_verified,omitempty"`
	Email         string `json:"email,omitempty"`
	EmailVerified *bool   `json:"email_verified,omitempty"`
}

// Termii API response structures
type TermiiResponse struct {
	MessageID string `json:"message_id"`
	Message   string `json:"message"`
	Balance   int    `json:"balance"`
	User      string `json:"user"`
}

// Custom phone user structure
type CustomPhoneUser struct {
	UserID       string `json:"id"`
	PhonePassword string `json:"password"`
	phone string `json:"phone"`
	PhoneVerified bool   `json:"phone_verified"`
}

// In-memory OTP storage (use Redis in production)
var otpStore = make(map[string]string)

// Hash password
func hashPassword(password string) (string, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashedPassword), nil
}

// Verify password
func verifyPassword(hashedPassword, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	return err == nil
}

// Generate 6-digit OTP
func generateOTP() string {
	mathrand.Seed(time.Now().UnixNano())
	otp := mathrand.Intn(900000) + 100000
	return strconv.Itoa(otp)
}

// Validate and format phone number
func validatePhone(phone string) (string, error) {
	// Remove all non-numeric characters except +
	re := regexp.MustCompile(`[^\d+]`)
	cleanPhone := re.ReplaceAllString(phone, "")
	
	// Handle Nigerian numbers
	if !strings.HasPrefix(cleanPhone, "+") {
		if strings.HasPrefix(cleanPhone, "0") {
			cleanPhone = "+234" + cleanPhone[1:]
		} else if strings.HasPrefix(cleanPhone, "234") {
			cleanPhone = "+" + cleanPhone
		} else {
			cleanPhone = "+234" + cleanPhone
		}
	}
	
	// Validate format
	phoneRegex := regexp.MustCompile(`^\+[1-9]\d{1,14}$`)
	if !phoneRegex.MatchString(cleanPhone) {
		return "", fmt.Errorf("invalid phone number format")
	}
	
	return cleanPhone, nil
}

// Send OTP via Termii or console
func sendOTP(phone, otp string) error {
	message := fmt.Sprintf("Your uFinda verification PIN is: %s. Valid for 5 minutes.", otp)
	
	// Store OTP with 5-minute expiry
	otpStore[phone] = otp
	go func() {
		time.Sleep(5 * time.Minute)
		delete(otpStore, phone)
	}()

	devMode := os.Getenv("DEV_MODE")
	if devMode == "dev" {
		// Log to console in development
		fmt.Printf("\n=== SMS OTP (DEV MODE) ===\n")
		fmt.Printf("Phone: %s\n", phone)
		fmt.Printf("OTP: %s\n", otp)
		fmt.Printf("Message: %s\n", message)
		fmt.Printf("========================\n\n")
		return nil
	}

	// Send actual SMS via Termii
	return sendSMSViaTermii(phone, message)
}

// Send SMS via Termii API
func sendSMSViaTermii(phone, message string) error {
	apiKey := os.Getenv("TERMII_API_KEY")
	
	if apiKey == "" {
		return fmt.Errorf("Termii API key not configured")
	}

	// Remove the + prefix for Termii API
	cleanPhone := strings.TrimPrefix(phone, "+")

	// Get sender ID from environment or use default
	senderID := os.Getenv("TERMII_SENDER_ID")
	if senderID == "" {
		senderID = "uFinda"
	}

	// Prepare JSON payload for Termii API
	payload := map[string]interface{}{
		"to":      cleanPhone,
		"from":    senderID,
		"sms":     message,
		"type":    "plain",
		"channel": "generic",
		"api_key": apiKey,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %v", err)
	}

	// Create request
	termiiBaseUrl := os.Getenv("TERMII_BASE_URL")
	if termiiBaseUrl == "" {
		return fmt.Errorf("termii base url not configured")
	}
	req, err := http.NewRequest("POST", termiiBaseUrl + "/api/sms/send", 
		bytes.NewBuffer(jsonData))
	if err != nil {
		return fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send SMS: %v", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("failed to read response body: %v", err)
	}

	var termiiResp TermiiResponse
	if err := json.Unmarshal(body, &termiiResp); err != nil {
		return fmt.Errorf("failed to parse response: %v", err)
	}

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("SMS API error (HTTP %d): %s", resp.StatusCode, termiiResp.Message)
	}

	if termiiResp.MessageID == "" {
		return fmt.Errorf("Termii API error: %s", termiiResp.Message)
	}

	fmt.Printf("SMS sent successfully to %s (Message ID: %s)\n", phone, termiiResp.MessageID)
	return nil
}

// Verify OTP
func verifyOTP(phone, inputOTP string) bool {
	storedOTP, exists := otpStore[phone]
	if !exists {
		return false
	}
	
	if storedOTP == inputOTP {
		delete(otpStore, phone) // Remove after successful verification
		return true
	}
	
	return false
}

// Get auth user by phone
func getAuthUserByPhone(phone string, role string) (map[string]interface{}, error) {
	resp, err := db.GetUserByPhone(phone, role)
	if err != nil {
		fmt.Println(err)
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("user not found")
	}

	body, _ := io.ReadAll(resp.Body)
	var users []map[string]interface{}

	if err := json.Unmarshal(body, &users); err != nil {
		return nil, err
	}

	if len(users) == 0 {
		return nil, fmt.Errorf("user not found")
	}

	return users[0], nil
}

// Get custom phone user by user ID
func getCustomPhoneUser(userID string, role string) (*CustomPhoneUser, error) {
	resp, err := db.GetCustomPhoneUserByID(userID, role)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("phone user not found")
	}

	body, _ := io.ReadAll(resp.Body)
	var result []CustomPhoneUser

	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	if len(result) == 0 {
		return nil, fmt.Errorf("phone user not found")
	}

	return &result[0], nil
}

// ENDPOINTS

// Send OTP endpoint
func SendOTP(c *gin.Context) {
	var req SendOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	validPhone, err := validatePhone(req.Phone)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid phone number format"})
		return
	}
	getUser, err := getAuthUserByPhone(validPhone, req.Role)
	if err != nil && err.Error() != "user not found" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user"})
		return
	}
	if getUser != nil {
		if verified, ok := getUser["phone_verified"].(bool); ok && verified {
			c.JSON(http.StatusConflict, gin.H{"error": "user already verified"})
			return
		}
	}

	otp := generateOTP()
	if err := sendOTP(validPhone, otp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send OTP"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "OTP sent successfully",
	})
}

// Phone signup
func PhoneSignup(c *gin.Context) {
	var req PhoneSignupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	validPhone, err := validatePhone(req.Phone)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid phone number format"})
		return
	}

	// Hash password
	hashedPassword, err := hashPassword(req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Password processing error"})
		return
	}

	// Check if user already exists
	if _, err := getAuthUserByPhone(validPhone, req.Role); err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "user already exists"})
		return
	}

	// Create auth user data (minimal data for phone auth)
	userData := map[string]interface{}{
		"phone": validPhone,
		"user_metadata": map[string]interface{}{
			"auth_type": "phone",
			"phone_verified": false,
		},
	}

	// Create auth user
	resp, err := db.CreateAuthUser(userData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Authentication service error"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		fmt.Printf("Supabase Auth error: %s\n", string(body))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user account"})
		return
	}

	// Parse response to get user ID
	body, _ := io.ReadAll(resp.Body)
	var authUser map[string]interface{}
	if err := json.Unmarshal(body, &authUser); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse user data"})
		return
	}

	userID := authUser["id"].(string)

	// Create custom phone user record
	phoneResp, err := db.CreateCustomPhoneUser(userID, hashedPassword, validPhone, req.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create phone user record"})
		return
	}
	defer phoneResp.Body.Close()

	if phoneResp.StatusCode != http.StatusOK && phoneResp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(phoneResp.Body)
		fmt.Printf("Custom phone user error: %s\n", string(body))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create phone user record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Account created successfully. Please verify your phone number with OTP.",
	})
}

// Verify OTP and mark phone as verified
func VerifyPhoneOTP(c *gin.Context) {
	var req VerifyOTPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	validPhone, err := validatePhone(req.Phone)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid phone number format"})
		return
	}

	// Only call getAuthUserByPhone once
	getUser, err := getAuthUserByPhone(validPhone, req.Role)
	if err != nil && err.Error() != "user not found" {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get user"})
		return
	}
	if getUser == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if verified, ok := getUser["phone_verified"].(bool); ok && verified {
		c.JSON(http.StatusConflict, gin.H{"error": "User already verified"})
		return
	}

	// Verify OTP
	if !verifyOTP(validPhone, req.OTP) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired OTP"})
		return
	}

	// Use getUser from earlier
	userID := getUser["id"].(string)

	phoneVerified := map[string]interface{}{
		"phone_verified": true,
	}
	updateAuth, err := db.UpdateUserMetadata(userID, phoneVerified)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update verification status"})
		return
	}
	defer updateAuth.Body.Close()
	if updateAuth.StatusCode != http.StatusOK && updateAuth.StatusCode != http.StatusNoContent {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update verification status in auth users"})
		return
	}

	updateResp, err := db.UpdatePhoneVerification(userID, true, req.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update verification status"})
		return
	}
	defer updateResp.Body.Close()
	if updateResp.StatusCode != http.StatusOK && updateResp.StatusCode != http.StatusNoContent {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update verification status in phone users"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Phone number verified successfully",
	})
}


// Phone login
func PhoneLogin(c *gin.Context) {
	var req PhoneLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	validPhone, err := validatePhone(req.Phone)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid phone number format"})
		return
	}

	// Get auth user
	authUser, err := getAuthUserByPhone(validPhone, req.Role)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	userID := authUser["id"].(string)

	// Get custom phone user
	phoneUser, err := getCustomPhoneUser(userID, req.Role)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Verify password
	if !verifyPassword(phoneUser.PhonePassword, req.Password) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Declare nil pointers for email fields
	var email *string
	var emailVerified *bool

	// Generate tokens
	accessToken, refreshToken, err := generateTokens(
		userID,
		&validPhone,
		email,
		&phoneUser.PhoneVerified,
		emailVerified,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Token generation failed"})
		return
	}
	_, err = db.UpdateLastSignIn(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update last sign in"})
		return
	}

	// Create user response
	userResponse := User{
		ID:            userID,
		Phone:         validPhone,
		PhoneVerified: &phoneUser.PhoneVerified,
	}

	c.JSON(http.StatusOK, AuthResponse{
		Success:      true,
		Message:      "Login successful",
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         userResponse,
	})
}