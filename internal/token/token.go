package token

import (
	"github.com/golang-jwt/jwt/v5"
	"context"
	"github.com/go-redis/redis/v8"
	"net/url"
	"net/http"
	"io"
	"encoding/json"
	"github.com/google/uuid"
	"fmt"
	"time"
	"os"
	"crypto/rand"
	"math/big"
	"github.com/oladev/ufinda_v0.01/internal/db"
	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
)

var jwtSecret = []byte(os.Getenv("JWT_SECRET"))

type Claims struct {
	UserID         string `json:"id"`
	Email          string `json:"email"`
	jwt.RegisteredClaims
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
	from := mail.NewEmail("uFinda", "ufinda.app@gmail.com")
	subject := "Your One-Time Password"
	to := mail.NewEmail("User", email)

	// Plain text version (for email clients that don't support HTML)
	plainTextContent := fmt.Sprintf("Your one-time password is %s. This code will expire in 15 minutes.", otp)

	// HTML version with the OTP in bold
	htmlContent := fmt.Sprintf("<strong>Your one-time password is <b>%s</b>.</strong> This code will expire in 15 minutes.", otp)

	message := mail.NewSingleEmail(from, subject, to, plainTextContent, htmlContent)

	apiKey := os.Getenv("SENDGRID_KEY")
	if apiKey == "" {
		return fmt.Errorf("sendgrid key not set")
	}

	client := sendgrid.NewSendClient(apiKey)
	_, err := client.Send(message)

	if err != nil {
		return fmt.Errorf("failed to send email")
	}
	return nil
}
// <-------------------------------> End OTP Tools <-------------------------------------->

// <-------------------------------> Begin ID Tools <-------------------------------------->

// The character set: 62 possible characters (A-Z, a-z, 0-9)
const charSet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
const idLength = 6

// generateRandomID generates a 6-character alphanumeric string.
func generateRandomID() (string, error) {
	bytes := make([]byte, idLength)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", fmt.Errorf("error reading random bytes: %w", err)
	}
	
	for i, b := range bytes {
		// Map the random byte to an index in the charSet
		bytes[i] = charSet[b%byte(len(charSet))]
	}
	
	return string(bytes), nil
}

// GetUniqueID generates a 7-character ID (1-char prefix + 6-char random ID)
// that is guaranteed to be unique in the specified table.
func GetUniqueID(prefix string, checkUniquenessFunc func(string) (bool, error)) (string, error) {
	const maxAttempts = 10 
	
	for attempt := 0; attempt < maxAttempts; attempt++ {
		// Generate the random 6-character base ID
		baseID, err := generateRandomID()
		if err != nil {
			return "", err
		}
		
		// Create the final 7-character ID
		finalID := prefix + baseID
		
		// Check the database for collisions
		isUnique, err := checkUniquenessFunc(finalID)
		if err != nil {
			// Handle database error during check
			return "", fmt.Errorf("database error during uniqueness check for ID %s: %w", finalID, err)
		}
		
		if isUnique {
			return finalID, nil // Success!
		}
		// If not unique, the loop continues to the next attempt
	}
	
	// If maxAttempts is reached without success, something is seriously wrong (high collision rate).
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