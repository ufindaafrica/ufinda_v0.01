package auth

import (
	"net/http"
	"log"
	"time"
	"errors"
	"context"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/oladev/ufinda_v0.01/internal/db"
	"github.com/oladev/ufinda_v0.01/internal/db/kyc/user"
	"github.com/oladev/ufinda_v0.01/internal/db/kyc/vendor"
	"github.com/cloudinary/cloudinary-go/v2"
	"golang.org/x/crypto/bcrypt"
	"strings"
	"github.com/oladev/ufinda_v0.01/internal/token"
	"github.com/oladev/ufinda_v0.01/internal/logs/auth"
	"github.com/oladev/ufinda_v0.01/internal/db/auth"
)


func EmailSignUpHandler(c *gin.Context) {
	var req SignupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": InvalidRequest})
		return
	}

	// check if user is already created and email already verified
	isCreatedUser, err := authdb.FindCreatedUserByEmail(req.Email)
	if err != nil && errors.Is(err, ErrGettingUser) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if isCreatedUser != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user already created, please login"})
		return		
	}

	// check if the user exists as a pending user
	isPendingUser, err := authdb.FindPendingUser(req.Email)
	if err != nil && errors.Is(err, ErrGettingUser) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if isPendingUser != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": MsgAccountExists})
		return
	}

	// hash the user password
	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("[ERROR] failed to hash password")
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	// generate otp
	otp, err := token.GenerateOTP()
	if err != nil {
		log.Printf("[CRITICAL] error generating otp: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	var pendingUserName *string
	if req.UserName != nil && strings.TrimSpace(*req.UserName) != "" {
    cleanName := strings.ToLower(strings.TrimSpace(*req.UserName))
    pendingUserName = &cleanName
	} else {
		pendingUserName = nil
	}
	pendinguser := db.PendingUser {
		Email: req.Email,
		Password: string(hashedPwd),
		OTP: otp,
		Role: req.Role,
		FirstName: req.FirstName,
		UserName: pendingUserName,
		LastName: req.LastName,
		Phone: req.Phone,
		ExpiresAt: time.Now().Add(15 * time.Minute),
	}

	// create a pending user
	if err := authdb.InsertPendingUser(&pendinguser); err != nil {
		// List of friendly errors we defined above
		userFriendlyErrors := []string{
			"vendors must provide a valid username",
			"this email is already registered",
			"this username is already taken",
		}

		for _, msg := range userFriendlyErrors {
			if strings.Contains(err.Error(), msg) {
				c.JSON(http.StatusBadRequest, gin.H{"error": msg})
				return
			}
		}

		// If it's not a known user error, send a 500
		c.JSON(http.StatusInternalServerError, gin.H{"error": "An unexpected error occurred"})
		return
	}

	if err := token.SendOTP(req.Email, otp); err != nil {
		log.Printf("[CRITICAL] failed to send otp for user: %s: %v", req.Email, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "OTP sent to your email, please verify."})
}

// verify otp
func VerifyOtpHandler(c *gin.Context) {
	var req VerifyOtp
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": InvalidRequest})
		return
	}

	// check if user is already created and verified
	isCreatedUser, err := authdb.FindCreatedUserByEmail(req.Email)
	if err != nil && errors.Is(err, ErrGettingUser){
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if isCreatedUser != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": MsgAccountCreated})
		return		
	}

	// check if the user exists as a pending user
	pendinguser, err := authdb.FindPendingUser(req.Email)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		}else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		}
		return
	}


	if pendinguser.OTP != req.OTP {
		c.JSON(http.StatusForbidden, gin.H{"error": "invalid otp"})
		return
	}

	// check if otp is expired
	if time.Now().After(pendinguser.ExpiresAt) {
		c.JSON(http.StatusForbidden, gin.H{"error": "otp has expired"})
		return
	}

	checkUniqueness := func(id string) (bool, error) {
		return token.IsIDUnique(id, "/rest/v1/users")
	}

	var prefix string

	if pendinguser.Role == "user" {
		prefix = "user"
	} else { prefix = "vendor" }

	userID, err := token.GenerateRandomID(prefix, checkUniqueness)
	if err != nil {
		log.Printf("[CRITICAL] Failed to generate ID for user '%s': %w", req.Email, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	user := db.User {
		ID: userID,
		Email: pendinguser.Email,
		Password: pendinguser.Password,
		Role: pendinguser.Role,
		UserName: pendinguser.UserName,
		FirstName: pendinguser.FirstName,
		LastName: pendinguser.LastName,
		Phone: pendinguser.Phone,
		AuthProvider: "custom",
	}

	// create user after verifying their email
	if err := authdb.CreateUser(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}
	
	// delete pending user record
	if err := authdb.DeletePendingUser(req.Email); err != nil {
		log.Printf("[ERROR] Failed to delete pending user for %s: %v", req.Email, err)
	}

    accessToken, refreshToken, err := token.GenerateTokens(user.ID, user.Email, user.Role)
    if err != nil {
		log.Printf("[CRITICAL] failed to generate token for user: %s: %v", user.Email, err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
        return
    }

	if err := token.SendWelcomeEmail(user.Email, user.FirstName); err != nil {
		authlog.LogAuth(user.ID, err)
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "verification successful",
		"access_token": accessToken,
		"refresh_token": refreshToken,
		"id": user.ID,
		"role": user.Role,
	})
}

func EmailLoginHandler(c *gin.Context) {
    var loginObj LoginRequest
    if err := c.ShouldBindJSON(&loginObj); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": InvalidRequest})
        return
    }

    user, err := authdb.FindCreatedUserByEmail(loginObj.Email)
	if err != nil {
		if errors.Is(err, authdb.ErrUserNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		}else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		}
		return
	}

    // New Redis-based Rate Limiting Logic
    loginKey := "login_attempts:" + loginObj.Email
    ctx := c.Request.Context()

    // Get the current login attempts and TTL
    attempts, err := db.RedisClient.Get(ctx, loginKey).Int()
    if err != nil && err != redis.Nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
        return
    }

    // Check if the user is locked out
    if attempts >= 5 {
        ttl := db.RedisClient.TTL(ctx, loginKey).Val()
		log := authlog.Logs["3"]
		fmtMessage := fmt.Sprintf(log.Message, "login attempt exceeded")
		userID := user.ID
		newLog := db.SecurityLog {
			UserID: &userID,
			Log: fmtMessage,
			Level: log.Level,
		}
		authlog.SecurityLog(newLog)

        c.JSON(http.StatusTooManyRequests, gin.H{
            "error": fmt.Sprintf("Too many login attempts. Please try again in %d minutes", int(ttl.Minutes())),
        })
        return
    }

    isMatch, err := CheckPasswordMatch(loginObj.Password, user.Password)
    if err != nil {
		log.Printf("[CRITICAL] error checking password: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
        return
    }

    if !isMatch {
        db.RedisClient.Incr(ctx, loginKey)
        if attempts == 0 {
            db.RedisClient.Expire(ctx, loginKey, 30*time.Minute)
        }
        c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid password"})
        return
    }

    // If password matches, clear the login attempts counter
    db.RedisClient.Del(ctx, loginKey)

    accessToken, refreshToken, err := token.GenerateTokens(user.ID, user.Email, user.Role)
    if err != nil {
		log.Printf("[CRITICAL] failed to generate token for user: %s: %w", user.ID, err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "access_token": accessToken,
        "refresh_token": refreshToken,
		"role": user.Role,
		"id": user.ID,
    })
}
// <---------------------> End Login <---------------------->

// <---------------------> Begin Resend OTP <---------------------->
func ResendOTPHandler(c *gin.Context) {
	var otpRequest ResendOTP
	if err := c.ShouldBindJSON(&otpRequest); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": InvalidRequest})
		return
	}

	// check if user is already created and verified
	createduser, err := authdb.FindCreatedUserByEmail(otpRequest.Email)
	if err != nil && errors.Is(err, ErrGettingUser) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if createduser != nil  {
		c.JSON(http.StatusBadRequest, gin.H{"error": MsgAccountCreated})
		return		
	}

	// check if the user exists as a pending user
	pendinguser, err := authdb.FindPendingUser(otpRequest.Email)
	if err != nil && errors.Is(err, authdb.ErrGettingUser) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if errors.Is(err, ErrUserNotFound) {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// generate the new otp
	otp, err := token.GenerateOTP()
	if err != nil {
		log.Printf("[CRITICAL] error generating otp: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	// set expiry
	data := map[string]interface{}{
		"otp": otp,
		"expire_at": time.Now().Add(15 * time.Minute),
	}

	// update the pending data with the new otp
	if err := authdb.UpdatePendingUser(pendinguser.Email, data); err != nil {
		log.Printf("[CRITICAL] failed to update pending user record: %w", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	// send the new otp
	if err := token.SendOTP(pendinguser.Email, otp); err != nil {
		log.Printf("[CRITICAL] failed to send otp for user: %s: %v", pendinguser.Email, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "otp resent successfully"})
}

func LogoutHandler(c *gin.Context) {
	// 1. Extract tokens
	authHeader := c.GetHeader("Authorization")
	refreshtoken := c.GetHeader("X-Refresh-Token")

	if refreshtoken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "refresh token header not provided"})
		return
	}

	accesstoken := strings.TrimPrefix(authHeader, "Bearer ")
	refreshtoken = strings.TrimPrefix(refreshtoken, "Refresh ")

	// 2. Validate Access Token
	// We use a "soft" check here. If it's expired, we still want to try and revoke the refresh token.
	accessclaims, err := token.ValidateToken(accesstoken)
	if err != nil {
		// Log as info/warning, not a critical failure for logout
		log.Printf("[INFO] Access token validation failed during logout: %v", err)
	}

	// 3. Validate Refresh Token
	// This MUST be valid (or at least signed correctly) to identify which session to kill.
	refreshclaims, err := token.ValidateToken(refreshtoken)
	if err != nil {
		// If the refresh token is also expired or invalid, the session is already effectively dead.
		if errors.Is(err, token.ErrInvalidToken) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid refresh token"})
			return
		}
		log.Printf("[ERROR] Refresh token validation error: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "session already expired"})
		return
	}

	refreshjti := refreshclaims.ID
	userID := refreshclaims.UserID

	// 4. Check if token is already blacklisted
	isblacklisted, err := token.IsTokenBlacklisted(c.Request.Context(), refreshjti)
	if err != nil {
		log.Printf("[ERROR] Blacklist check failed: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal server error"})
		return
	}

	if isblacklisted {
		// Log the attempt to reuse a blacklisted token for security auditing
		secLog := db.SecurityLog{
			UserID: &userID,
			Log:    fmt.Sprintf("Logout attempted with already blacklisted refresh token: %s", refreshjti),
			Level:  "warning",
		}
		authlog.SecurityLog(secLog)
		
		c.JSON(http.StatusOK, gin.H{"message": "already logged out"})
		return
	}

	// 5. Calculate remaining durations for Redis/Blacklist TTL
	var accessjti string
	var accessduration time.Duration
	if accessclaims != nil {
		accessjti = accessclaims.ID
		// Only set duration if it's in the future
		if time.Until(accessclaims.ExpiresAt.Time) > 0 {
			accessduration = time.Until(accessclaims.ExpiresAt.Time)
		}
	}

	refreshexp := refreshclaims.ExpiresAt.Time
	refreshduration := time.Until(refreshexp)
	if refreshduration < 0 {
		refreshduration = time.Second * 1 // Minimal TTL if already expired
	}

	// 6. Revoke Tokens
	if err := token.RevokeTokens(c.Request.Context(), accessjti, refreshjti, accessduration, refreshduration); err != nil {
		log.Printf("[CRITICAL] failed to revoke tokens: %v", err) // Fixed: use %v not %w
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}

func RefreshTokenHandler(c *gin.Context) {
	refreshToken := c.GetHeader("X-Refresh-Token")
	if refreshToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "refresh token header not provided"})
		return		
	}

	refreshToken = strings.TrimPrefix(refreshToken, "Refresh ")
	refreshClaims, err := token.ValidateToken(refreshToken)
	if err != nil {
		if errors.Is(err, token.ErrInvalidToken){
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		}
		log.Printf("[CRITCAL] error validating token: %w", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	refreshjti := refreshClaims.ID
	// check if token has been used and blacklisted
	isblacklisted, err := token.IsTokenBlacklisted(c.Request.Context(), refreshjti)
	if err != nil {
		log.Printf("[CRITICAL] error checking token for blacklist: %w", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	if isblacklisted {
		// create a log
		log  := authlog.Logs["1"]
		fmtMessage := fmt.Sprintf(log.Message, refreshToken)
		userID := refreshClaims.UserID
		newLog := db.SecurityLog{
			UserID: &userID,
			Log: fmtMessage,
			Level: log.Level,
		}

		authlog.SecurityLog(newLog)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "expired token"})
		return
	}

	// first generate token
	access_token, refresh_token, err := token.RefreshToken(refreshClaims.UserID, refreshClaims.Email, refreshClaims.Role)
	if err != nil {
		log.Print("[CRITICAL] failed to generate refresh token for user: %s: %w", refreshClaims.UserID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	// then revoke token
	refreshexp := refreshClaims.ExpiresAt.Time
	refreshduration := time.Until(refreshexp)
	if err := token.RevokeTokens(c.Request.Context(), "", refreshjti, 0, refreshduration); err != nil {
		log.Printf("[CRITICAL] failed to revoke token: %w", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token": access_token,
		"refresh_token": refresh_token,
		"id": refreshClaims.UserID,
		"role": refreshClaims.Role,
	})

}
// <---------------------> End Refresh Token <---------------------->

func DeleteCreatedUser(cld *cloudinary.Cloudinary) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, exists := c.Get("id")
        if !exists {
			log.Printf("[CRITICAL] user not found in context")
            c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
            return
        }

		userID, ok := id.(string)
		if !ok {
			log.Printf("[ERROR] invalid auth request")
			c.JSON(http.StatusBadRequest, gin.H{"error": InvalidRequest})
			return
		}
        // 2. Find the user based on the trusted ID
        createdUser, err := authdb.FindCreatedUserByID(userID)
        if err != nil {
            if errors.Is(err, authdb.ErrUserNotFound) {
                c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
            } else {
                // Log the user retrieval failure
                authlog.LogAuth(userID, err)
                c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
            }
            return
        }

		ctx := context.Background()
		// delete all user's assets in cloudinary
		if createdUser.Role == "user" {
			kyc, err := userkycdb.FindUserKYC(createdUser.ID)
			if err != nil && !errors.Is(err, userkycdb.ErrKYCNotFound) {
				authlog.LogAuth(createdUser.ID,  err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
				return
			}
			if kyc != nil {
				if kyc.ProfileImg != nil && kyc.ProfileImg.PublicID != "" {
					if err := db.DeleteCloudinaryAsset(ctx, cld, kyc.ProfileImg.PublicID, "image"); err != nil {
						authlog.LogAuth(createdUser.ID,  err)
						c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
						return
					}
				}		
			}
		} else if createdUser.Role == "vendor" {
			kyc, err := vendorkycdb.FindVendorKYC(createdUser.ID)
			if err != nil && !errors.Is(err, vendorkycdb.ErrKYCNotFound) {
				authlog.LogAuth(createdUser.ID,  err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
				return
			}
			
			if kyc != nil {
				if kyc.ProfileImg != nil && kyc.ProfileImg.PublicID != "" {
					if err := db.DeleteCloudinaryAsset(ctx, cld, kyc.ProfileImg.PublicID, "image"); err != nil {
						authlog.LogAuth(createdUser.ID,  err)
						c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
						return
					}
				}
			}
		}
		if err := authdb.DeleteCreatedUserByID(createdUser.ID); err != nil {
			authlog.LogAuth(createdUser.ID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
			return
		}
		
		c.JSON(http.StatusOK, gin.H{"message": "account deleted successfully"})

	}
}

func ForgetPwd(c *gin.Context) {
	var forgetPwdData ForgetPwdData
	if err := c.ShouldBindJSON(&forgetPwdData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": InvalidRequest})
		return
	}

	// check if user exists by email
	user, err := authdb.FindCreatedUserByEmail(forgetPwdData.Email)
	if err != nil {
		if errors.Is(err, authdb.ErrUserNotFound) {
			c.JSON(http.StatusOK, gin.H{"message": "A password reset link has been sent to your email address."})
		}else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		}
		return
	}
	
	// generate a secure token
	newToken, err := token.GenerateSecureToken()
	if err != nil {
		authlog.LogAuth(user.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}
	expiresAt := time.Now().Add(15*time.Minute)
	resetData := db.ResetPwdData{
		UserID: user.ID,
		Token: newToken,
		ExpiresAt: expiresAt,
	}

	if err := authdb.CreateResetToken(resetData); err != nil {
		authlog.LogAuth(user.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	if err := token.SendPasswordResetLink(user.Email, newToken); err != nil {
		authlog.LogAuth(user.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "A password reset link has been sent to your email address."})
}

func ResetPwd(c *gin.Context) {
    var req ResetPwdData
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": InvalidRequest}) 
        return
    }

    // 1. Check if token exists
    getToken, err := authdb.FindResetToken(req.Token)
    if err != nil {
        if errors.Is(err, authdb.ErrResetTokenNotFound) {
            c.JSON(http.StatusGone, gin.H{"error": "token is invalid or expired"}) 
        } else {
			log.Printf("[CRITICAL] failed to retrieve reset token: %w", err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
        }
        return
    }

    if time.Now().After(getToken.ExpiresAt) {
        authdb.DeleteResetToken(getToken.Token) 
        
        c.JSON(http.StatusUnauthorized, gin.H{"error": "The reset link has expired. Please request a new one."})
        return
    }

    // 3. Hash New Password
    var updateData = make(map[string]interface{})
    hashedPwd, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
    if err != nil {
        authlog.LogAuth(getToken.UserID, err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
        return
    }
    updateData["password"] = string(hashedPwd)

    // 4. Delete token record
    if err := authdb.DeleteResetToken(getToken.Token); err != nil {
        log.Printf("[CRITICAL] failed to delete reset token for user: %s: %w", getToken.UserID, err)
    }

    // 5. Update user with new password
    if err := authdb.UpdateCreatedUser(getToken.UserID, updateData); err != nil {
		authlog.LogAuth(getToken.UserID, err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "password updated successfully"})
}

func ChangePassword(c *gin.Context) {
	userID:= c.GetString("id")

	getUser, err := authdb.FindCreatedUserByID(userID)
	if err != nil {
		authlog.LogAuth(userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	var req ChangePwd
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	if getUser.AuthProvider == "custom"{
		err := bcrypt.CompareHashAndPassword([]byte(getUser.Password), []byte(req.NewPassword))
		if err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "new password must be different from your current password"})
			return
		}

		hashedPwd, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
		if err != nil {
			authlog.LogAuth(getUser.ID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
			return
		}

		var updateData = make(map[string]interface{})
		updateData["password"] = string(hashedPwd)

		if err := authdb.UpdateCreatedUser(getUser.ID, updateData); err != nil {
			authlog.LogAuth(getUser.ID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "password updated successfully"})
		return
	}

	c.JSON(http.StatusForbidden, gin.H{"error": "action not allowed"})
}