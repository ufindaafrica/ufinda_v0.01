package auth

import (
	"fmt"
	"golang.org/x/crypto/bcrypt"
	"errors"
	"github.com/redis/go-redis/v9"
	"time"
	"context"
	"github.com/oladev/ufinda_v0.01/internal/db"
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
	UserName *string  `json:"username,omitempty"`
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


type RateLimitResult struct {
	Allowed   bool
	Reason    string
	RetryAfter time.Duration
}

func CheckAndSetOTPRateLimit(ctx context.Context, email string) (RateLimitResult, error) {
	cooldownKey := fmt.Sprintf("otp_cooldown:%s", email)
	countKey := fmt.Sprintf("otp_count:%s", email)

	// 1. Check 60-second cooldown
	ttl, err := db.RedisClient.TTL(ctx, cooldownKey).Result()
	if err == nil && ttl > 0 {
		return RateLimitResult{
			Allowed:    false,
			Reason:     fmt.Sprintf("Please wait %d seconds before requesting another code", int(ttl.Seconds())),
			RetryAfter: ttl,
		}, nil
	}

	// 2. Get hourly count (Ignore redis.Nil)
	count, err := db.RedisClient.Get(ctx, countKey).Int()
	if err != nil {
		// If key doesn't exist in Redis, go-redis returns redis.Nil
		if errors.Is(err, redis.Nil) || err.Error() == "redis: nil" {
			count = 0
		} else {
			return RateLimitResult{}, fmt.Errorf("redis get count failed: %w", err)
		}
	}

	if count >= 5 {
		countTTL, _ := db.RedisClient.TTL(ctx, countKey).Result()
		return RateLimitResult{
			Allowed:    false,
			Reason:     "Maximum OTP request limit reached for this hour. Try again later.",
			RetryAfter: countTTL,
		}, nil
	}

	// 3. Set 60-second cooldown
	if err := db.RedisClient.Set(ctx, cooldownKey, "1", 60*time.Second).Err(); err != nil {
		return RateLimitResult{}, fmt.Errorf("redis set cooldown failed: %w", err)
	}

	// 4. Increment 1-hour count
	newCount, err := db.RedisClient.Incr(ctx, countKey).Result()
	if err != nil {
		return RateLimitResult{}, fmt.Errorf("redis incr failed: %w", err)
	}

	// 5. Set 1-hour expiration on first increment
	if newCount == 1 {
		if err := db.RedisClient.Expire(ctx, countKey, 1*time.Hour).Err(); err != nil {
			return RateLimitResult{}, fmt.Errorf("redis expire failed: %w", err)
		}
	}

	return RateLimitResult{Allowed: true}, nil
}