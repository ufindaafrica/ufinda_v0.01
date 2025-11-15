package token

import (
	"github.com/golang-jwt/jwt/v5"
	"context"
	"github.com/go-redis/redis/v8"
	"net/url"
	"net/http"
	"io"
	"encoding/json"
	"encoding/base64"
	"github.com/google/uuid"
	"fmt"
	"time"
	"os"
	"math/big"
	"github.com/oladev/ufinda_v0.01/internal/db"
	"github.com/keighl/postmark"
	"log"
	"math"
	mrand"math/rand"
	"crypto/rand"
	"strings"
)

var jwtSecret = []byte(os.Getenv("JWT_SECRET"))

// Define the required prefixes for each entity type.
var prefixes = map[string]string{
	"user":    "usr-",
	"vendor":  "vnd-",
	"hostel":  "rmn-", // For Room/Rental
	"product": "prd-", // New prefix for Products
}

type Claims struct {
	UserID         string `json:"id"`
	Email          string `json:"email"`
	jwt.RegisteredClaims
}

// init function runs before main and is used to seed the pseudo-random number generator.
// This is crucial in Go to ensure the IDs are different on each execution.
func init() {
	mrand.Seed(time.Now().UnixNano())
}

func GenerateTokens(
	userID string,
	email string,
) (string, string, error) {

	// Generate a unique ID for this specific token
	jwtID := uuid.New().String()

	// Access token (expires in 15 minutes)
	accessClaims := Claims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   userID,
			ID:        jwtID, // <-- Correctly using a unique ID
		},
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims)
	accessTokenString, err := accessToken.SignedString(jwtSecret)
	if err != nil {
		return "", "", err
	}

	// Refresh token (expires in 7 days)
	refreshClaims := accessClaims
	refreshClaims.ExpiresAt = jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour))
	refreshClaims.ID = uuid.New().String() // <-- Create a separate unique ID for the refresh token

	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	refreshTokenString, err := refreshToken.SignedString(jwtSecret)
	if err != nil {
		return "", "", err
	}

	return accessTokenString, refreshTokenString, nil
}

// Validate JWT token
func ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token")
}

func RevokeTokens(
	ctx context.Context,
	accessjti string, refreshjti string,
	accessduration time.Duration, refreshduration time.Duration,
	) error {
	var accesserr error
	var refresherr error
	if accessjti != "" {
		accesserr = db.RedisClient.Set(ctx, accessjti, "revoked", accessduration).Err()
	}
	if refreshjti != "" {
		refresherr = db.RedisClient.Set(ctx, refreshjti, "revoked", refreshduration).Err()
	}
	
	if accesserr != nil || refresherr != nil {
		return fmt.Errorf("cannot revoke token")
	}

	return nil
}

// IsTokenBlacklisted checks if a token exists in the blacklist.
func IsTokenBlacklisted(ctx context.Context, tokenjti string) (bool, error) {
	_, err := db.RedisClient.Get(ctx, tokenjti).Result()
	if err == redis.Nil {
		return false, nil
	} else if err != nil {
		return false, err
	}
	
	return true, nil
}

func RefreshToken(userID string, email string) (string, string, error) {
	return GenerateTokens(userID, email)
}

// <-------------------------------> Begin OTP Tools <-------------------------------------->
func GenerateOTP() (string, error) {
	n, err := rand.Int(rand.Reader, big.NewInt(1000000)) // 0 to 999999
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil // zero-padded
}

// sending otp to email
func SendOTP(email string, otp string) error {
	// --- Postmark API Key Setup ---
	// Postmark requires a Server API Token for sending messages.
	apiKey := os.Getenv("POSTMARK_SERVER_KEY")
	if apiKey == "" {
		// Use a specific error message to help the user debug
		return fmt.Errorf("POSTMARK_SERVER_KEY environment variable not set")
	}

	client := postmark.NewClient(apiKey, "") // The second argument is for Account Token, which is not needed for sending

	// --- Email Content Construction ---
	subject := "Your uFinda One-Time Password"

	// Plain text version
	plainTextContent := fmt.Sprintf("Your one-time password is %s. This code will expire in 15 minutes.", otp)

	// HTML version with the OTP in bold
	htmlContent := fmt.Sprintf("<strong>Your one-time password is <b>%s</b>.</strong> This code will expire in 15 minutes.", otp)

	// --- Postmark Email Message Configuration ---
	emailMessage := postmark.Email{
		// Set the From address with name and email, as requested.
		// Note: This email MUST be a confirmed Sender Signature in Postmark.
		From:    "uFinda <no-reply@ufinda.org>",
		// Set the ReplyTo address, ensuring any replies go to the correct address (in this case, also no-reply).
		ReplyTo: "no-reply@ufinda.org",
		To:      email,
		Subject: subject,
		TextBody: plainTextContent,
		HtmlBody: htmlContent,
		// It's recommended to tag transactional emails for better statistics
		Tag: "otp-transactional", 
	}

	// --- Send Email ---
	_, err := client.SendEmail(emailMessage)

	if err != nil {
		// Postmark client typically returns a more descriptive error than SendGrid's simple error interface
		// We'll wrap it to provide context
		return fmt.Errorf("failed to send email via Postmark: %w", err)
	}

	return nil
}

// <-------------------------------> End OTP Tools <-------------------------------------->

// <-------------------------------> Begin ID Tools <-------------------------------------->

// generateRandomDigits generates a random integer with the specified length.
// For length=6, it generates a number between 100000 and 999999 (inclusive).
func generateRandomDigits(length int) int {
	// Calculate min (10^5 for length 6)
	min := int(math.Pow10(length - 1))
	
	// Calculate max (10^6 - 1 for length 6, i.e., 999999)
	max := int(math.Pow10(length)) - 1

	// Generate random number in the range [min, max]
	// Go's rand.Intn(n) returns [0, n).
	// Range size is (max - min + 1). We add min to shift the range up.
	return mrand.Intn(max-min+1) + min
}

func GenerateRandomID(entityType string, checkUniquenessFunc func(string) (bool, error)) (string, error) {
	const maxAttempts = 5
	// Normalize the type input to ensure it matches the keys in the prefixes map.
	normalizedType := strings.ToLower(entityType)
	var attempt int

	// 1. Check if the type is supported.
	prefix, ok := prefixes[normalizedType]
	if !ok {
		// Log the error (Go equivalent of console.error) and fall back.
		log.Printf("Invalid ID type: %s. Falling back to a generic prefix.", entityType)
		
		// Fallback to 'gen-' + 6 random digits
		return fmt.Sprintf("gen-%d", generateRandomDigits(6)), nil
	}
	
	for attempt = 0; attempt <= maxAttempts; attempt++ {
		// 2. Generate the random numerical suffix (6 digits).
		suffix := generateRandomDigits(6)
		generatedID := fmt.Sprintf("%s%d", prefix, suffix)

		// Check the database for collisions
		isUnique, err := checkUniquenessFunc(generatedID)
		if err != nil {
			return "", fmt.Errorf("database error during uniqueness check for ID %s: %w", generatedID, err)
		}
		
		if isUnique {
			return generatedID, nil // Success!
		}
	}

	return "", fmt.Errorf("failed to generate unique ID after %d attempts. Collision rate is too high", maxAttempts)
}

func IsIDUnique(id string, endpoint string) (bool, error) {
	if id == "" {
		return false, fmt.Errorf("ID cannot be empty")
	}
	if endpoint == "" {
		return false, fmt.Errorf("endpoint cannot be empty")
	}


	queryURL := fmt.Sprintf("%s?id=eq.%s", endpoint, url.QueryEscape(id))

	resp, err := db.MakeDBRequest("GET", queryURL, nil, nil)
	if err != nil {
		return false, fmt.Errorf("error making DB request to check uniqueness on %s: %w", endpoint, err)
	}
	defer resp.Body.Close()

	// 2. Handle Non-200 Status Codes
	if resp.StatusCode != http.StatusOK {
		bodyBytes, readErr := io.ReadAll(resp.Body)
		if readErr != nil {
			return false, fmt.Errorf("failed to check uniqueness (Status: %d). Failed to read body: %w", resp.StatusCode, readErr)
		}
		bodyString := string(bodyBytes)
		return false, fmt.Errorf("uniqueness check failed on %s. Status: %d, Response Body: %s", endpoint, resp.StatusCode, bodyString)
	}

	var responseArray []interface{}
	if err := json.NewDecoder(resp.Body).Decode(&responseArray); err != nil {
		// Log the error but treat it as a potential collision risk if decoding fails
		return false, fmt.Errorf("error decoding response for uniqueness check on %s: %w", endpoint, err)
	}

	isUnique := len(responseArray) == 0

	return isUnique, nil
}

// <-------------------------------> End ID Tools <-------------------------------------->

func GenerateSecureToken() (string, error) {
	const length = 32 
	
	randomBytes := make([]byte, length)
	
	_, err := rand.Read(randomBytes)
	if err != nil {
		return "", fmt.Errorf("failed to generate random bytes for token: %w", err)
	}

	token := base64.URLEncoding.EncodeToString(randomBytes)

	return token, nil
}


func SendPasswordResetLink(email string, resetToken string) error {
	// --- Postmark API Key Setup ---
	apiKey := os.Getenv("POSTMARK_SERVER_KEY")
	if apiKey == "" {
		// Postmark uses a server key for sending
		return fmt.Errorf("POSTMARK_SERVER_KEY environment variable not set")
	}

	client := postmark.NewClient(apiKey, "") // Second arg (Account Token) is not needed for sending

	// --- Link Construction: Base URL + Token ---
	// Base URL for the reset page (must be HTTPS for security)
	const baseURL = "https://ufinda.org/reset-password"

	// Construct the final link by appending the token as a query parameter
	finalResetLink := fmt.Sprintf("%s?token=%s", baseURL, resetToken)
	log.Printf("this is the final url: %s", finalResetLink)

	// --- Email Content Construction ---
	subject := "Password Reset Request for uFinda"

	// Plain text version
	plainTextContent := fmt.Sprintf(
		"You requested a password reset. Please use the following link to reset your password: %s. This link will expire in 15 minutes.\n\n" +
		"If you did not initiate this password reset request, please ignore this email or contact support@ufinda.org immediately.",
		finalResetLink,
	)

	htmlContent := fmt.Sprintf(`
		<div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
			<h2 style="color: #333;">Password Reset Request</h2>
			<p>You requested a password reset. Please click the button below to securely reset your password:</p>
			
			<p style="margin: 30px 0; text-align: center;">
				<a href="%s" 
					style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
					Reset Password
				</a>
			</p>

			<p style="text-align: center; margin-top: 10px;">Alternatively, you can copy and paste the following URL into your browser:</p>
			<p style="text-align: center; word-break: break-all;"><a href="%s">%s</a></p>
			
			<p style="color: #888; margin-top: 25px; text-align: center;">This link is valid for 15 minutes.</p>

			<!-- Security Disclaimer -->
			<div style="border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px;">
				<p style="font-size: 12px; color: #cc0000; font-weight: bold;">
					If you did not request this password reset, please ignore this email and contact us immediately at
					<a href="mailto:support@ufinda.org" style="color: #cc0000; text-decoration: underline;">support@ufinda.org</a>.
				</p>
			</div>
		</div>
	`, finalResetLink, finalResetLink, finalResetLink)

	// --- Postmark Email Message Configuration ---
	emailMessage := postmark.Email{
		From: "uFinda <no-reply@ufinda.org>",
		ReplyTo: "no-reply@ufinda.org",
		To: email,
		Subject: subject,
		TextBody: plainTextContent,
		HtmlBody: htmlContent,
		Tag: "password-reset",
	}

	// --- Send Email ---
	_, err := client.SendEmail(emailMessage)

	if err != nil {
		return fmt.Errorf("failed to send password reset link via Postmark: %w", err)
	}

	return nil
}

func SendWelcomeEmail(email string, userName string) error {
	// --- Postmark API Key Setup ---
	apiKey := os.Getenv("POSTMARK_SERVER_KEY")
	if apiKey == "" {
		return fmt.Errorf("POSTMARK_SERVER_KEY environment variable not set")
	}

	client := postmark.NewClient(apiKey, "")

	// --- Email Content Construction ---
	subject := "Welcome to uFinda! Your Hunting Starts Now."

	// Customize content for the new user
	plainTextContent := fmt.Sprintf(
		"Hello %s,\n\nWelcome to uFinda! We're thrilled to have you join our community. You can now log in and start exploring. \n\nIf you have any questions, please visit our help center or reply to this email.\n\nHappy finding!\nThe uFinda Team",
		userName,
	)

	// HTML version with a simple button or link
	htmlContent := fmt.Sprintf(`
		<html>
		<head>
			<style>
				.container { font-family: sans-serif; padding: 20px; color: #333; }
				.header { color: #4F46E5; font-size: 24px; margin-bottom: 20px; }
				.button {
					display: inline-block;
					padding: 10px 20px;
					margin: 20px 0;
					background-color: #4F46E5;
					color: white !important;
					text-decoration: none;
					border-radius: 5px;
					font-weight: bold;
				}
			</style>
		</head>
		<body>
			<div class="container">
				<div class="header">Welcome to uFinda, %s!</div>
				<p>We're thrilled to have you join our community. Your account is ready, and your hunting starts now.</p>
				<p>You can use the button below to log in and start exploring.</p>
				<a href="https://your-app-domain.com/login" class="button">Log In to uFinda</a>
				<p>If you have any questions, please visit our help center or simply reply to this email.</p>
				<p>Happy hunting!</p>
				<p>The uFinda Team</p>
			</div>
		</body>
		</html>
	`, userName)

	// --- Postmark Email Message Configuration ---
	emailMessage := postmark.Email{
		From:     "uFinda <contact@ufinda.org>",
		ReplyTo:  "contact@ufinda.org",
		To:       email,
		Subject:  subject,
		TextBody: plainTextContent,
		HtmlBody: htmlContent,
		Tag:      "welcome-onboarding", 
	}

	// --- Send Email ---
	_, err := client.SendEmail(emailMessage)

	if err != nil {
		return fmt.Errorf("failed to send welcome email via Postmark: %w", err)
	}

	return nil
}



