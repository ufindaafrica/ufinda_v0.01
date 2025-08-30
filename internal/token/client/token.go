package token

import (
	"github.com/golang-jwt/jwt/v5"
	"context"
	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
	"fmt"
	"time"
	"os"
	"uFinda/internal/db"
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
	plainTextContent := fmt.Sprintf("Your one-time password is %s. This code will expire in 15 minutes.", otp)
	message := mail.NewSingleEmail(from, subject, to, plainTextContent, "")

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