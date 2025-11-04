package auth

import (
	"net/http"
	"log"
	"time"
	"errors"
	"os"
	"context"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/go-redis/redis/v8"
	"github.com/oladev/ufinda_v0.01/internal/db"
	"github.com/oladev/ufinda_v0.01/internal/db/kyc/user"
	"github.com/cloudinary/cloudinary-go/v2"
	"golang.org/x/crypto/bcrypt"
	"strings"
	"github.com/oladev/ufinda_v0.01/internal/token"
	"github.com/oladev/ufinda_v0.01/internal/logs/auth"
	"github.com/oladev/ufinda_v0.01/internal/db/auth"
)


// <---------------------> Begin Sign Up And Verify OTP <---------------------->
func EmailSignUpHandler(c *gin.Context) {
	var req SignupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": InvalidRequest})
		return
	}

	// check if user is already created and email already verified
	isCreatedUser, err := authdb.FindCreatedUserByEmail(req.Email)
	if err != nil && errors.Is(err, ErrorGettingUser) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if isCreatedUser != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user already created, please login"})
		return		
	}

	// check if the user exists as a pending user
	isPendingUser, err := authdb.FindPendingUser(req.Email)
	if err != nil && errors.Is(err, ErrorGettingPendingUser) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if isPendingUser != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user already created, verify your email"})
		return
	}

	// hash the user password
	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	// generate otp
	otp, err := token.GenerateOTP()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate otp"})
		return
	}

	pendinguser := db.PendingUser {
		ID: uuid.New(),
		Email: req.Email,
		Password: string(hashedPwd),
		OTP: otp,
		Role: req.Role,
		FirstName: req.FirstName,
		LastName: req.LastName,
		Phone: req.Phone,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(15 * time.Minute),
	}

	// create as a pending user
	if err := authdb.InsertPendingUser(&pendinguser); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// send the otp tp email
	if err := token.SendOTP(req.Email, otp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
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
	if err != nil && errors.Is(err, ErrorGettingUser){
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if isCreatedUser != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user already created, please login"})
		return		
	}

	// check if the user exists as a pending user
	pendinguser, err := authdb.FindPendingUser(req.Email)
	if err != nil && errors.Is(err, ErrorGettingPendingUser) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if errors.Is(err, ErrorPendingUserNotFound) {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if pendinguser.OTP != req.OTP {
		c.JSON(http.StatusForbidden, gin.H{"error": "otp is invalid"})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error generating id"})
		fmt.Fprintf(os.Stderr, "CRITICAL: Failed to generate ID for user '%s': %w", req.Email, err)
		return
	}

	user := db.User {
		ID: userID,
		Email: pendinguser.Email,
		Password: pendinguser.Password,
		Role: pendinguser.Role,
		FirstName: pendinguser.FirstName,
		LastName: pendinguser.LastName,
		Phone: pendinguser.Phone,
		AuthProvider: "custom",
	}

	// create user after verifying their email
	if err := authdb.CreateUser(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}
	
	// delete pending user record
	if err := authdb.DeletePendingUser(req.Email); err != nil {
		log.Printf("Failed to delete pending user for %s: %v", req.Email, err)
	}

    accessToken, refreshToken, err := token.GenerateTokens(user.ID, user.Email)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

	if err := token.SendWelcomeEmail(user.Email, user.FirstName); err != nil {
		authlog.LogAuth(user.ID, err)
	}
	c.JSON(http.StatusOK, gin.H{
		"message": "verification successful",
		"access_token": accessToken,
		"refresh_token": refreshToken,
	})
}
// <---------------------> End Sign Up And Verify OTP <---------------------->

// <---------------------> Begin Login <---------------------->
func EmailLoginHandler(c *gin.Context) {
    var loginObj LoginRequest
    if err := c.ShouldBindJSON(&loginObj); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
        return
    }

    user, err := authdb.FindCreatedUserByEmail(loginObj.Email)
	if err != nil {
		if errors.Is(err, authdb.ErrorUserNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		}else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}

    // New Redis-based Rate Limiting Logic
    loginKey := "login_attempts:" + loginObj.Email
    ctx := c.Request.Context()

    // Get the current login attempts and TTL
    attempts, err := db.RedisClient.Get(ctx, loginKey).Int()
    if err != nil && err != redis.Nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "error checking login attempts"})
        return
    }

    // Check if the user is locked out
    if attempts >= 5 {
        ttl := db.RedisClient.TTL(ctx, loginKey).Val()
		log := authlog.Logs["3"]
		fmtMessage := fmt.Sprintf(log.Message, "login attempt exceeded")
		newLog := db.SecurityLog {
			ID: uuid.New(),
			UserID: user.ID,
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
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    if !isMatch {
        // Increment failed attempts and set a 20-minute expiry on the first failed attempt
        db.RedisClient.Incr(ctx, loginKey)
        if attempts == 0 {
            db.RedisClient.Expire(ctx, loginKey, 30*time.Minute)
        }
        c.JSON(http.StatusForbidden, gin.H{"error": "invalid password"})
        return
    }

    // If password matches, clear the login attempts counter
    db.RedisClient.Del(ctx, loginKey)

    accessToken, refreshToken, err := token.GenerateTokens(user.ID, user.Email)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "access_token": accessToken,
        "refresh_token": refreshToken,
		"role": user.Role,
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
	if err != nil && errors.Is(err, ErrorGettingUser) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if createduser != nil  {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user already created, please login"})
		return		
	}

	// check if the user exists as a pending user
	pendinguser, err := authdb.FindPendingUser(otpRequest.Email)
	if err != nil && errors.Is(err, ErrorGettingPendingUser) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if errors.Is(err, ErrorPendingUserNotFound) {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// generate the new otp
	otp, err := token.GenerateOTP()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate otp"})
		return
	}

	// set expiry
	data := map[string]interface{}{
		"otp": otp,
		"expire_at": time.Now().Add(15 * time.Minute),
	}

	// update the pending data with the new otp
	if err := authdb.UpdatePendingUser(pendinguser.Email, data); err != nil {
		c.JSON(http.StatusInternalServerError, err.Error())
		return
	}

	// send the new otp
	if err := token.SendOTP(pendinguser.Email, otp); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "otp resent successfully"})
}
// <---------------------> End Resend OTP <---------------------->

// <---------------------> Begin Logout OTP <---------------------->
func LogoutHandler(c *gin.Context) {
    // 1. Extract the access and refresh token from the payload.
	accesstoken := c.GetHeader("Authorization")

	refreshtoken := c.GetHeader("X-Refresh-Token")
	if refreshtoken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "refresh token header not provided"})
		return		
	}

	accesstoken = strings.TrimPrefix(accesstoken, "Bearer ")
	refreshtoken = strings.TrimPrefix(refreshtoken, "Refresh ")

	accessclaims, err := token.ValidateToken(accesstoken)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// validate token before blacklisting
	refreshclaims, err := token.ValidateToken(refreshtoken)
	if err != nil {
		log := authlog.Logs["4"]
		userID := accessclaims.UserID
		newLog := db.SecurityLog {
			ID: uuid.New(),
			UserID: userID,
			Log: log.Message,
			Level: log.Level,
		}
		authlog.SecurityLog(newLog)

		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}

	refreshjti := refreshclaims.ID

	isblacklisted, err := token.IsTokenBlacklisted(c.Request.Context(), refreshjti)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// check if token had already been blacklisted
	if isblacklisted {
		// create a log
		log  := authlog.Logs["1"]
		fmtMessage := fmt.Sprintf(log.Message, refreshtoken)
		newLog := db.SecurityLog{
			ID: uuid.New(),
			UserID: refreshclaims.UserID,
			Log: fmtMessage,
			Level: log.Level,
		}

		authlog.SecurityLog(newLog)

		c.JSON(http.StatusForbidden, gin.H{"error": "token already used"})
		return
	}

	accessjti := accessclaims.ID
	accessexp := accessclaims.ExpiresAt.Time
	accessduration := time.Until(accessexp)
	
	refreshexp := refreshclaims.ExpiresAt.Time
	refreshduration := time.Until(refreshexp)

	if err := token.RevokeTokens(c.Request.Context(), accessjti, refreshjti, accessduration, refreshduration); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

    // The client app, upon receiving this, should delete the tokens from its local storage.
    c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}
// <---------------------> End Logout OTP <---------------------->

// <---------------------> Begin Refresh Token <---------------------->
func RefreshTokenHandler(c *gin.Context) {
	refreshToken := c.GetHeader("X-Refresh-Token")
	if refreshToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "refresh token header not provided"})
		return		
	}

	refreshToken = strings.TrimPrefix(refreshToken, "Refresh ")
	refreshclaims, err := token.ValidateToken(refreshToken)
	if err != nil {
		log := authlog.Logs["4"]
		newLog := db.SecurityLog {
			ID: uuid.New(),
			Log: log.Message,
			Level: log.Level,
		}
		authlog.SecurityLog(newLog)

		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	refreshjti := refreshclaims.ID
	// check if token has been used and blacklisted
	isblacklisted, err := token.IsTokenBlacklisted(c.Request.Context(), refreshjti)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if isblacklisted {
		// create a log
		log  := authlog.Logs["1"]
		fmtMessage := fmt.Sprintf(log.Message, refreshToken)
		newLog := db.SecurityLog{
			ID: uuid.New(),
			UserID: refreshclaims.UserID,
			Log: fmtMessage,
			Level: log.Level,
		}

		authlog.SecurityLog(newLog)

		c.JSON(http.StatusForbidden, gin.H{"error": "token already used"})
		return
	}

	// first generate token
	access_token, refresh_token, err := token.RefreshToken(refreshclaims.UserID, refreshclaims.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// then revoke token
	refreshexp := refreshclaims.ExpiresAt.Time
	refreshduration := time.Until(refreshexp)
	if err := token.RevokeTokens(c.Request.Context(), "", refreshjti, 0, refreshduration); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_token": access_token,
		"refresh_token": refresh_token,
	})

}
// <---------------------> End Refresh Token <---------------------->

func DeleteCreatedUser(cld *cloudinary.Cloudinary) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, exists := c.Get("id")
        if !exists {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "user ID not found in context"})
            return
        }

		userID, ok := id.(string)
		if !ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id type"})
			return
		}
        // 2. Find the user based on the trusted ID
        createdUser, err := authdb.FindCreatedUserByID(userID)
        if err != nil {
            if errors.Is(err, authdb.ErrorUserNotFound) {
                c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
            } else {
                // Log the user retrieval failure
                authlog.LogAuth(userID, err)
                c.JSON(http.StatusInternalServerError, gin.H{"error": "error getting user"})
            }
            return
        }

		ctx := context.Background()
		// delete all user's assets in cloudinary
		if createdUser.Role == "user" {
			kyc, err := userkycdb.FindUserKYC(createdUser.ID)
			if err != nil && !errors.Is(err, userkycdb.ErrorKYCNotFound) {
				authlog.LogAuth(createdUser.ID,  err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get kyc record"})
				return
			}
			if kyc != nil {
				if err := db.DeleteCloudinaryAsset(ctx, cld, kyc.ProfileImg.PublicID, "image"); err != nil {
					authlog.LogAuth(createdUser.ID,  err)
					c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete asset"})
					return
				}				
			}
		} else {
			//will do this later
		}
		// if err := authdb.DeleteCreatedUserByID(createdUser.ID); err != nil {
		// 	authlog.LogAuth(createdUser.ID, err)
		// 	c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete account"})
		// 	return
		// }
		
		c.JSON(http.StatusOK, gin.H{"message": "account deleted successfully"})
	}
}

func ForgetPwd(c *gin.Context) {
	var forgetPwdData ForgetPwdData
	if err := c.ShouldBindJSON(&forgetPwdData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	// check if user exists by email
	user, err := authdb.FindCreatedUserByEmail(forgetPwdData.Email)
	if err != nil {
		if errors.Is(err, authdb.ErrorUserNotFound) {
			c.JSON(http.StatusOK, gin.H{"message": "A password reset link has been sent to your email address."})
		}else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	// generate a secure token
	newToken, err := token.GenerateSecureToken()
	if err != nil {
		authlog.LogAuth(user.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate reset password token"})
		return
	}
	expiresAt := time.Now().Add(15*time.Minute)
	resetData := db.ResetPwdData{
		ID: uuid.New(),
		UserID: user.ID,
		Token: newToken,
		ExpiresAt: expiresAt,
	}

	if err := authdb.CreateResetToken(resetData); err != nil {
		authlog.LogAuth(user.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create reset token data"})
		return
	}

	if err := token.SendPasswordResetLink(user.Email, newToken); err != nil {
		authlog.LogAuth(user.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to send reset token link to user email"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "A password reset link has been sent to your email address."})
}

func ResetPwd(c *gin.Context) {
    var req ResetPwdData
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request format"}) 
        return
    }

    // 1. Check if token exists
    getToken, err := authdb.FindResetToken(req.Token)
    if err != nil {
        if errors.Is(err, authdb.ErrorResetTokenNotFound) {
            c.JSON(http.StatusNotFound, gin.H{"error": "token is invalid or has expired"}) 
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "database operation failed"})
        }
        return
    }

    // --- 2. CHECK FOR TOKEN EXPIRATION (THE FIX) ---
    // getToken.ExpiresAt is assumed to be a time.Time value
    if time.Now().After(getToken.ExpiresAt) {
        authdb.DeleteResetToken(getToken.Token) 
        
        c.JSON(http.StatusUnauthorized, gin.H{"error": "token has expired"})
        return
    }

    // 3. Hash New Password
    var updateData = make(map[string]interface{})
    hashedPwd, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
    if err != nil {
        authlog.LogAuth(getToken.UserID, err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
        return
    }
    updateData["password"] = string(hashedPwd)

    // 4. Delete token record
    if err := authdb.DeleteResetToken(getToken.Token); err != nil {
        // Log the failure but continue, as the password change is more important
        authlog.LogAuth(getToken.UserID, fmt.Errorf("failed to delete reset token: %w", err))
        // Do NOT return here unless the error is severe enough to stop the process
    }

    // 5. Update user with new password
    if err := authdb.UpdateCreatedUser(getToken.UserID, updateData); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update record with new password"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "password updated successfully"})
}