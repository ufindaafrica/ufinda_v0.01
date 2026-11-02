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
	"github.com/oladev/ufinda_v0.01/internal/db/payment"
	"github.com/oladev/ufinda_v0.01/internal/response"
)

// email signup
func EmailSignUpHandler(c *gin.Context) {
	var req SignupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, response.ErrCodeBadRequest)
		return
	}

	// check if user is already created and email already verified
	isCreatedUser, err := authdb.FindCreatedUserByEmail(req.Email)
	if err != nil && errors.Is(err, ErrGettingUser) {
		log.Printf("[ERROR_CHECKING_CREATED_USER] %v", err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	if isCreatedUser != nil {
		response.Error(c, http.StatusConflict, response.ErrCodeAccountExists, "User already created, please login.")
		return      
	}

	// check if the user exists as a pending user
	isPendingUser, err := authdb.FindPendingUser(req.Email)
	if err != nil && errors.Is(err, ErrGettingUser) {
		log.Printf("[ERROR_CHECKING_PENDING_USER] %v", err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	if isPendingUser != nil {
		response.Error(c, http.StatusConflict, response.ErrCodeAccountExists)
		return
	}

	// hash the user password
	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("[ERROR] failed to hash password: %v", err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	// generate otp
	otp, err := token.GenerateOTP()
	if err != nil {
		log.Printf("[CRITICAL_OTP_GEN_ERR] error generating otp for user %s: %v", req.Email, err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
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
		// List of friendly errors we check for
		userFriendlyErrors := []string{
			"vendors must provide a valid username",
			"this email is already registered",
			"this username is already taken",
		}

		for _, msg := range userFriendlyErrors {
			if strings.Contains(err.Error(), msg) {
				response.Error(c, http.StatusBadRequest, response.ErrCodeBadRequest, msg)
				return
			}
		}

		// If it's not a known user error, send a 500
		log.Printf("[CRITICAL_INSERT_PENDING_USER] error inserting pending user: %v", err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	if err := token.SendOTP(req.Email, otp); err != nil {
		log.Printf("[CRITICAL_OTP_EMAIL_SEND_ERR] failed to send otp for user: %s: %v", req.Email, err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	response.Success(c, http.StatusCreated, "OTP sent to your email, please verify.", gin.H{
		"email": req.Email,
	})
}

// verify otp
func VerifyOtpHandler(c *gin.Context) {
	var req VerifyOtp
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, response.ErrCodeBadRequest)
		return
	}

	// 1. Check if user is already created and verified
	isCreatedUser, err := authdb.FindCreatedUserByEmail(req.Email)
	if err != nil && errors.Is(err, ErrGettingUser) {
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	if isCreatedUser != nil {
		response.Error(c, http.StatusConflict, response.ErrCodeAccountExists)
		return
	}

	// 2. Check if the user exists as a pending user
	pendinguser, err := authdb.FindPendingUser(req.Email)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			response.Error(c, http.StatusNotFound, response.ErrCodeUserNotFound)
		} else {
			log.Printf("[ERROR_CHECKING_PENDING_USR] error checking if user exists as a pending user for email %s: %v", pendinguser.Email, err)
			response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		}
		return
	}

	// 3. Validate OTP mismatch
	if pendinguser.OTP != req.OTP {
		response.Error(c, http.StatusBadRequest, response.ErrCodeInvalidOTP)
		return
	}

	// 4. Validate OTP expiration
	if time.Now().After(pendinguser.ExpiresAt) {
		response.Error(c, http.StatusBadRequest, response.ErrCodeOTPExpired)
		return
	}

	// 5. Determine user type and paid status
	userType := "vendor"
	var isPaid *bool

	if pendinguser.Role == "user" {
		userType = "user"
		paidStatus, err := paymentdb.IsPaidBookingFee(pendinguser.Email)
		if err != nil {
			log.Printf("[ERROR_GETTING_BOOKING_FEE] error checking for the booking fee status for user %s: %v", pendinguser.Email ,err)
			response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		}
		isPaid = &paidStatus // Assign directly to outer pointer
	}

	prefix := "vendor"
	if userType == "user" {
		prefix = "user"
	}

	checkUniqueness := func(id string) (bool, error) {
		return token.IsIDUnique(id, "/rest/v1/users")
	}

	userID, err := token.GenerateRandomID(prefix, checkUniqueness)
	if err != nil {
		log.Printf("[CRITICAL_ID_GEN_FAILED] Failed to generate ID for user '%s': %v", req.Email, err)
		response.Error(c, http.StatusInternalServerError, "SERVER_ERROR", MsgServerError)
		return
	}

	user := db.User{
		ID:           userID,
		Email:        pendinguser.Email,
		Password:     pendinguser.Password,
		Role:         pendinguser.Role,
		UserName:     pendinguser.UserName,
		FirstName:    pendinguser.FirstName,
		LastName:     pendinguser.LastName,
		Phone:        pendinguser.Phone,
		AuthProvider: "custom",
	}

	// 6. Create verified user record
	if err := authdb.CreateUser(user); err != nil {
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	// 7. Clean up pending user record
	if err := authdb.DeletePendingUser(req.Email); err != nil {
		log.Printf("[ERROR_PENDING_USR_DELETE_FAILED] Failed to delete pending user for %s: %v", req.Email, err)
	}

	// 8. Trigger Welcome Email asynchronously (don't block HTTP thread)
	go func() {
		if err := token.SendWelcomeEmail(user.Email, user.FirstName); err != nil {
			authlog.LogAuth(user.ID, err)
		}
	}()

	// 9. Respond based on payment state
	// Vendors/Agents (isPaid == nil) or Paid Students (isPaid == true) get full tokens
	if isPaid == nil || *isPaid {
		accessToken, refreshToken, err := token.GenerateTokens(user.ID, user.Email, user.Role)
		if err != nil {
			log.Printf("[CRITICAL] Failed to generate token for user %s: %v", user.Email, err)
			response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
			return
		}
		response.Success(c, http.StatusOK, "Verification successful", gin.H{
			"is_paid":       true,
			"access_token":  accessToken,
			"refresh_token": refreshToken,
			"id":   user.ID,
			"role": user.Role,
		})
		return
	}

	// Unpaid Students return is_paid: false (Mobile App navigates to Paystack onboarding prompt)
	response.Error(c, http.StatusPaymentRequired, response.ErrCodePaymentRequired, gin.H{
		"is_paid": false,
		"id":   user.ID,
		"role": user.Role,
	})
}

func EmailLoginHandler(c *gin.Context) {
	var loginObj LoginRequest
	if err := c.ShouldBindJSON(&loginObj); err != nil {
		response.Error(c, http.StatusBadRequest, response.ErrCodeBadRequest)
		return
	}

	user, err := authdb.FindCreatedUserByEmail(loginObj.Email)
	if err != nil {
		if errors.Is(err, authdb.ErrUserNotFound) {
			response.Error(c, http.StatusNotFound, response.ErrCodeUserNotFound)
		} else {
			log.Printf("[ERROR_FINDING_USR_BY_EMAIL] error getting user record by email for user %s: %v", loginObj.Email, err)
			response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		}
		return
	}

	// New Redis-based Rate Limiting Logic
	loginKey := "login_attempts:" + loginObj.Email
	ctx := c.Request.Context()

	// Get current login attempts
	attempts, err := db.RedisClient.Get(ctx, loginKey).Int()
	if err != nil && err != redis.Nil {
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	// Check if the user is locked out
	if attempts >= 5 {
		ttl := db.RedisClient.TTL(ctx, loginKey).Val()
		logEntry := authlog.Logs["3"]
		fmtMessage := fmt.Sprintf(logEntry.Message, "login attempt exceeded")
		userID := user.ID
		newLog := db.SecurityLog{
			UserID: &userID,
			Log:    fmtMessage,
			Level:  logEntry.Level,
		}
		authlog.SecurityLog(newLog)

		response.Error(c, http.StatusTooManyRequests, response.ErrCodeTooManyRequests, fmt.Sprintf("Too many login attempts. Please try again in %d minutes", int(ttl.Minutes())))
		return
	}

	isMatch, err := CheckPasswordMatch(loginObj.Password, user.Password)
	if err != nil {
		log.Printf("[CRITICAL_CHECKING_PWD_MATCH] error checking password for user %s: %v", loginObj.Email, err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	if !isMatch {
		db.RedisClient.Incr(ctx, loginKey)
		if attempts == 0 {
			db.RedisClient.Expire(ctx, loginKey, 15*time.Minute)
		}
		// Use standardized response envelope for unauthorized errors
		response.Error(c, http.StatusUnauthorized, "INVALID_PWD")
		return
	}

	// If password matches, clear the login attempts counter
	db.RedisClient.Del(ctx, loginKey)

	// Check if user has paid booking fee
	isPaid, err := paymentdb.IsPaidBookingFee(loginObj.Email)
	if err != nil {
		log.Printf("[ERROR_GETTING_BOOKING_FEE] error checking booking fee status for user %s: %v", loginObj.Email, err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return 
	}

	if user.IsBetaUser || isPaid || user.Role == "vendor" {
		accessToken, refreshToken, err := token.GenerateTokens(user.ID, user.Email, user.Role)
		if err != nil {
			log.Printf("[CRITICAL_ACCESS_TOKEN_GEN_FAILED] failed to generate token for user: %s: %v", user.ID, err)
			response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
			return
		}

		response.Success(c, http.StatusOK, "Login successful", gin.H{
			"is_paid":       true,
			"access_token":  accessToken,
			"refresh_token": refreshToken,
			"role":          user.Role,
			"id":            user.ID,
		})
		return
	}

	// Gated: Student has verified and authenticated, but onboarding fee is required
	response.Error(c, http.StatusPaymentRequired, response.ErrCodePaymentRequired, gin.H{
		"is_paid": false,
		"id":      user.ID,
		"role":    user.Role,
	})
}

// <---------------------> End Login <---------------------->

// <---------------------> Begin Resend OTP <---------------------->
func ResendOTPHandler(c *gin.Context) {
	var otpRequest ResendOTP
	if err := c.ShouldBindJSON(&otpRequest); err != nil {
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	// check if user is already created and verified
	createduser, err := authdb.FindCreatedUserByEmail(otpRequest.Email)
	if err != nil && errors.Is(err, ErrGettingUser) {
		log.Printf("[ERROR_FINDING_USR_BY_EMAIL] error getting user record by email for user %s: %v", otpRequest.Email, err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	if createduser != nil  {
		response.Error(c, http.StatusConflict, response.ErrCodeAccountExists)
		return		
	}

	// check if the user exists as a pending user
	pendinguser, err := authdb.FindPendingUser(otpRequest.Email)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			response.Error(c, http.StatusNotFound, response.ErrCodeUserNotFound)
		} else {
			log.Printf("[ERROR_CHECKING_PENDING_USR] error checking if user exists as a pending user for email %s: %v", pendinguser.Email, err)
			response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		}
		return
	}
	// generate the new otp
	otp, err := token.GenerateOTP()
	if err != nil {
		log.Printf("[CRITICAL_OTP_GEN_ERR] error generating otp for user %s: %v",  pendinguser.Email, err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	// set expiry
	data := map[string]interface{}{
		"otp": otp,
		"expire_at": time.Now().Add(15 * time.Minute),
	}

	// update the pending data with the new otp
	if err := authdb.UpdatePendingUser(pendinguser.Email, data); err != nil {
		log.Printf("[CRITICAL_PENDING_USR_UPD_ERR] failed to update pending user record for %s: %w", pendinguser.Email, err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	// send the new otp
	if err := token.SendOTP(pendinguser.Email, otp); err != nil {
		log.Printf("[CRITICAL_OTP_EMAIL_SEND_ERR] failed to send otp for user: %s: %v", pendinguser.Email, err)
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
		response.Error(c, http.StatusBadRequest, response.ErrCodeBadRequest, "Refresh token header not provided")
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
			response.Error(c, http.StatusUnauthorized, response.ErrCodeUnauthorized, "Invalid refresh token")
			return
		}
		log.Printf("[ERROR_REFRESH_TOKEN_VALIDATION_ERR] Refresh token validation error: %v", err)
		response.Error(c, http.StatusUnauthorized, response.ErrCodeUnauthorized, "Session already expired")
		return
	}

	refreshjti := refreshclaims.ID
	userID := refreshclaims.UserID

	// 4. Check if token is already blacklisted
	isblacklisted, err := token.IsTokenBlacklisted(c.Request.Context(), refreshjti)
	if err != nil {
		log.Printf("[ERROR_BLACKLIST_CHECK_ERR] Blacklist check failed: %v", err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
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
		
		response.Success(c, http.StatusOK, "Already logged out" )
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
		log.Printf("[CRITICAL_TOKEN_REVOKE_ERR] failed to revoke tokens: %v", err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	response.Success(c, http.StatusOK, "Logged out successfully")
}

func RefreshTokenHandler(c *gin.Context) {
	refreshToken := c.GetHeader("X-Refresh-Token")
	if refreshToken == "" {
		response.Error(c, http.StatusBadRequest, response.ErrCodeBadRequest, "Refresh token header not provided")
		return      
	}

	refreshToken = strings.TrimPrefix(refreshToken, "Refresh ")
	refreshClaims, err := token.ValidateToken(refreshToken)
	if err != nil {
		if errors.Is(err, token.ErrInvalidToken){
			response.Error(c, http.StatusUnauthorized, response.ErrCodeUnauthorized, err.Error())
			return
		}
		log.Printf("[CRITICAL_TOKEN_VALIDATION_ERR] error validating token: %v", err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	refreshjti := refreshClaims.ID
	// check if token has been used and blacklisted
	isblacklisted, err := token.IsTokenBlacklisted(c.Request.Context(), refreshjti)
	if err != nil {
		log.Printf("[CRITICAL_TOKEN_BLACKLIST_CHECK_ERR] error checking token for blacklist: %v", err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	if isblacklisted {
		// create a log
		logEntry := authlog.Logs["1"]
		fmtMessage := fmt.Sprintf(logEntry.Message, refreshToken)
		userID := refreshClaims.UserID
		newLog := db.SecurityLog{
			UserID: &userID,
			Log: fmtMessage,
			Level: logEntry.Level,
		}

		authlog.SecurityLog(newLog)
		response.Error(c, http.StatusUnauthorized, response.ErrCodeUnauthorized, "Token has already been used or expired")
		return
	}

	// generate new token pair
	access_token, refresh_token, err := token.RefreshToken(refreshClaims.UserID, refreshClaims.Email, refreshClaims.Role)
	if err != nil {
		log.Printf("[CRITICAL_REFRESH_TOKEN_GEN_ERR] failed to generate refresh token for user: %s: %v", refreshClaims.UserID, err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	// revoke old token
	refreshexp := refreshClaims.ExpiresAt.Time
	refreshduration := time.Until(refreshexp)
	if err := token.RevokeTokens(c.Request.Context(), "", refreshjti, 0, refreshduration); err != nil {
		log.Printf("[CRITICAL_TOKEN_REVOKE_ERR] failed to revoke token: %v", err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	response.Success(c, http.StatusOK, "Tokens refreshed successfully", gin.H{
		"access_token":  access_token,
		"refresh_token": refresh_token,
		"id":            refreshClaims.UserID,
		"role":          refreshClaims.Role,
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
		response.Error(c, http.StatusBadRequest, response.ErrCodeBadRequest)
		return
	}

	// check if user exists by email
	user, err := authdb.FindCreatedUserByEmail(forgetPwdData.Email)
	if err != nil {
		if errors.Is(err, authdb.ErrUserNotFound) {
			// Security Best Practice: Return a generic success message even if the 
			// email does not exist to prevent user enumeration attacks.
			response.Success(c, http.StatusOK, "A password reset link has been sent to your email address.")
		} else {
			log.Printf("[ERROR_FINDING_USER_FOR_RESET] %v", err)
			response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		}
		return
	}
	
	// generate a secure token
	newToken, err := token.GenerateSecureToken()
	if err != nil {
		authlog.LogAuth(user.ID, err)
		log.Printf("[CRITICAL_GENERATE_RESET_TOKEN] %v", err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	expiresAt := time.Now().Add(15 * time.Minute)
	resetData := db.ResetPwdData{
		UserID:    user.ID,
		Token:     newToken,
		ExpiresAt: expiresAt,
	}

	if err := authdb.CreateResetToken(resetData); err != nil {
		authlog.LogAuth(user.ID, err)
		log.Printf("[CRITICAL_CREATE_RESET_TOKEN_DB] %v", err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	if err := token.SendPasswordResetLink(user.Email, newToken); err != nil {
		authlog.LogAuth(user.ID, err)
		log.Printf("[CRITICAL_SEND_RESET_EMAIL] %v", err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	response.Success(c, http.StatusOK, "A password reset link has been sent to your email address.")
}

func ResetPwd(c *gin.Context) {
	var req ResetPwdData
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, response.ErrCodeBadRequest)
		return
	}

	// 1. Check if token exists
	getToken, err := authdb.FindResetToken(req.Token)
	if err != nil {
		if errors.Is(err, authdb.ErrResetTokenNotFound) {
			response.Error(c, http.StatusGone, response.ErrCodeBadRequest, "Token is invalid or expired")
		} else {
			log.Printf("[CRITICAL_GET_RESET_TOKEN_ERR] failed to retrieve reset token: %v", err)
			response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		}
		return
	}

	if time.Now().After(getToken.ExpiresAt) {
		authdb.DeleteResetToken(getToken.Token) 
		
		response.Error(c, http.StatusUnauthorized, response.ErrCodeOTPExpired)
		return
	}

	// 3. Hash New Password
	var updateData = make(map[string]interface{})
	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		authlog.LogAuth(getToken.UserID, err)
		log.Printf("[CRITICAL_HASH_PASSWORD] %v", err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}
	updateData["password"] = string(hashedPwd)

	// 4. Delete token record
	if err := authdb.DeleteResetToken(getToken.Token); err != nil {
		log.Printf("[CRITICAL_TOKEN_DELETE_ERR] failed to delete reset token for user: %s: %v", getToken.UserID, err)
	}

	// 5. Update user with new password
	if err := authdb.UpdateCreatedUser(getToken.UserID, updateData); err != nil {
		authlog.LogAuth(getToken.UserID, err)
		log.Printf("[CRITICAL_UPDATE_USER_PASSWORD] %v", err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	response.Success(c, http.StatusOK, "Password updated successfully")
}

func ChangePassword(c *gin.Context) {
	userID := c.GetString("id")

	getUser, err := authdb.FindCreatedUserByID(userID)
	if err != nil {
		authlog.LogAuth(userID, err)
		log.Printf("[ERROR_FINDING_USER_BY_ID] %v", err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	var req ChangePwd
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, response.ErrCodeBadRequest)
		return
	}

	if getUser.AuthProvider == "custom" {
		err := bcrypt.CompareHashAndPassword([]byte(getUser.Password), []byte(req.NewPassword))
		if err == nil {
			response.Error(c, http.StatusBadRequest, response.ErrCodeBadRequest, "New password must be different from your current password")
			return
		}

		hashedPwd, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
		if err != nil {
			authlog.LogAuth(getUser.ID, err)
			log.Printf("[CRITICAL_HASH_PASSWORD] %v", err)
			response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
			return
		}

		var updateData = make(map[string]interface{})
		updateData["password"] = string(hashedPwd)

		if err := authdb.UpdateCreatedUser(getUser.ID, updateData); err != nil {
			authlog.LogAuth(getUser.ID, err)
			log.Printf("[CRITICAL_UPDATE_USER_PASSWORD] %v", err)
			response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
			return
		}

		response.Success(c, http.StatusOK, "Password updated successfully")
		return
	}

	response.Error(c, http.StatusForbidden, response.ErrCodeBadRequest, "Action not allowed")
}