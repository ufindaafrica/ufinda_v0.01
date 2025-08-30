package clientauth

import (
	"net/http"
	"log"
	"time"
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"uFinda/internal/db"
	"golang.org/x/crypto/bcrypt"
	"strings"
	"uFinda/internal/token/vendor"
	"uFinda/internal/logs/auth"
	"uFinda/internal/routes/auth"
)


// <---------------------> Begin Sign Up And Verify OTP <---------------------->
func EmailSignUpHandler(c *gin.Context) {
	var req SignupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": InvalidRequest})
		return
	}

	// check if vendor is already created and email already verified
	isCreatedVendor, err := FindCreatedVendor(req.Email)
	if err != nil && errors.Is(err, ErrorGettingVendor) {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	if isCreatedVendor != nil {
		c.JSON(400, gin.H{"error": "user already created, please login"})
		return		
	}

	// check if the vendor exists as a pending vendor
	isPendingVendor, err := FindPendingVendor(req.Email)
	if err != nil && errors.Is(err, ErrorGettingPendingVendor) {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	if isPendingVendor != nil {
		c.JSON(400, gin.H{"error": "user already created, verify your email"})
		return
	}

	// hash the vendor password
	hashedPwd, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(500, gin.H{"error": "failed to hash password"})
		return
	}

	// generate otp
	otp, err := token.GenerateOTP()
	if err != nil {
		c.JSON(500, gin.H{"error": "failed to generate otp"})
		return
	}

	pendingvendor := db.PendingVendor {
		Email: req.Email,
		Password: string(hashedPwd),
		OTP: otp,
		FirstName: req.FirstName,
		LastName: req.LastName,
		Phone: req.Phone,
		CreatedAt: time.Now(),
		ExpiresAt: time.Now().Add(15 * time.Minute),
	}

	// create as a pending vendor
	if err := InsertPendingVendor(&pendingvendor); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	// send the otp tp email
	if err := token.SendOTP(req.Email, otp); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "OTP sent to your email, please verify."})
}

// verify otp
func VerifyOtpHandler(c *gin.Context) {
	var req VerifyOtp
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": InvalidRequest})
		return
	}

	// check if vendor is already created and verified
	isCreatedVendor, err := FindCreatedVendor(req.Email)
	if err != nil && errors.Is(err, ErrorGettingVendor){
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	if isCreatedVendor != nil {
		c.JSON(400, gin.H{"error": "vendor already created, please login"})
		return		
	}

	// check if the vendor exists as a pending vendor
	pendingvendor, err := FindPendingvendor(req.Email)
	if err != nil && errors.Is(err, ErrorGettingPendingvendor) {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	if errors.Is(err, ErrorPendingVendorNotFound) {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	if pendingvendor.OTP != req.OTP {
		c.JSON(401, gin.H{"error": "otp is invalid"})
		return
	}

	// check if otp is expired
	if time.Now().After(pendingvendor.ExpiresAt) {
		c.JSON(401, gin.H{"error": "otp has expired"})
		return
	}

	vendor := db.Vendor {
		Email: pendingvendor.Email,
		Password: pendingvendor.Password,
		FirstName: pendingvendor.FirstName,
		LastName: pendingvendor.LastName,
		Phone: pendingvendor.Phone,
		AuthProvider: "custom",
	}

	// create vendor after verifying their email
	if err := Createvendor(vendor); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}
	
	// delete pending vendor record
	if err := DeletePendingVendor(req.Email); err != nil {
		log.Printf("Failed to delete pending user for %s: %v", req.Email, err)
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "verification successful"})
}
// <---------------------> End Sign Up And Verify OTP <---------------------->

// <---------------------> Begin Login <---------------------->
func EmailLoginHandler(c *gin.Context) {
    var loginObj LoginRequest
    if err := c.ShouldBindJSON(&loginObj); err != nil {
        c.JSON(400, gin.H{"error": "Invalid request"})
        return
    }

    vendor, err := FindCreatedVendor(loginObj.Email)
	if err != nil && errors.Is(err, ErrorGettingVendor) {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

    // New Redis-based Rate Limiting Logic
    loginKey := "login_attempts:" + loginObj.Email
    ctx := c.Request.Context()

    // Get the current login attempts and TTL
    attempts, err := db.RedisClient.Get(ctx, loginKey).Int()
    if err != nil && err != redis.Nil {
        c.JSON(500, gin.H{"error": "error checking login attempts"})
        return
    }

    // Check if the vendor is locked out
    if attempts >= 5 {
        ttl := db.RedisClient.TTL(ctx, loginKey).Val()
		log := authlog.Logs["3"]
		fmtMessage := fmt.Sprintf(log.Message, "login attempt exceeded")
		newLog := db.SecurityLog {
			VendorID: vendor.ID,
			Log: fmtMessage,
			Level: log.Level,
		}
		if err := authlog.CreateLog(newLog); err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

        c.JSON(http.StatusTooManyRequests, gin.H{
            "error": fmt.Sprintf("Too many login attempts. Please try again in %d minutes", int(ttl.Minutes())),
        })
        return
    }

    isMatch, err := CheckPasswordMatch(loginObj.Password, vendor.Password)
    if err != nil {
        c.JSON(500, gin.H{"error": "error validating password"})
        return
    }

    if !isMatch {
        // Increment failed attempts and set a 20-minute expiry on the first failed attempt
        db.RedisClient.Incr(ctx, loginKey)
        if attempts == 0 {
            db.RedisClient.Expire(ctx, loginKey, 20*time.Minute)
        }
        c.JSON(401, gin.H{"error": "invalid password"})
        return
    }

    // If password matches, clear the login attempts counter
    db.RedisClient.Del(ctx, loginKey)

    accessToken, refreshToken, err := token.GenerateTokens(vendor.ID, vendor.Email)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "access_token": accessToken,
        "refresh_token": refreshToken,
    })
}
// <---------------------> End Login <---------------------->

// <---------------------> Begin Resend OTP <---------------------->
func ResendOTPHandler(c *gin.Context) {
	var otpRequest ResendOTP
	if err := c.ShouldBindJSON(&otpRequest); err != nil {
		c.JSON(500, gin.H{"error": InvalidRequest})
		return
	}

	// check if vendor is already created and verified
	createdvendor, err := FindCreatedvendor(otpRequest.Email)
	if err != nil && errors.Is(err, ErrorGettingvendor) {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	if createdvendor != nil  {
		c.JSON(400, gin.H{"error": "vendor already created, please login"})
		return		
	}

	// check if the vendor exists as a pending vendor
	pendingvendor, err := FindPendingVendor(otpRequest.Email)
	if err != nil && errors.Is(err, ErrorGettingPendingVendor) {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	if errors.Is(err, ErrorPendingVendorNotFound) {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	otp, err := token.GenerateOTP()
	if err != nil {
		c.JSON(500, gin.H{"error": "failed to generate otp"})
		return
	}

	data := map[string]interface{}{
		"otp": otp,
		"expire_at": time.Now().Add(15 * time.Minute),
	}

	// update the pending data with the new otp
	if err := UpdatePendingVendor(pendingvendor.Email, data); err != nil {
		c.JSON(500, err.Error())
		return
	}

	// send the new otp
	if err := token.SendOTP(pendingvendor.Email, otp); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
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
		c.JSON(400, gin.H{"error": "refresh token header not provided"})
		return		
	}

	accesstoken = strings.TrimPrefix(accesstoken, "Bearer ")
	refreshtoken = strings.TrimPrefix(refreshtoken, "Refresh ")

	accessclaims, err := token.ValidateToken(accesstoken)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	refreshclaims, err := token.ValidateToken(refreshtoken)
	if err != nil {
		vendor, _ := auth.GetUser(c)

		log := authlog.Logs["4"]
		fmtMessage := fmt.Sprint(log.Message, refreshtoken)
		newLog := db.SecurityLog {
			vendorID: vendor.VendorID,
			Log: fmtMessage,
			Level: log.Level,
		}
		if err := authlog.CreateLog(newLog); err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	refreshjti := refreshclaims.ID

	isblacklisted, err := token.IsTokenBlacklisted(c.Request.Context(), refreshjti)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	if isblacklisted {
		// create a log
		log  := authlog.Logs["1"]
		fmtMessage := fmt.Sprintf(log.Message, refreshtoken)
		newLog := db.SecurityLog{
			vendorID: refreshclaims.ValendorID,
			Log: fmtMessage,
			Level: log.Level,
		}

		if err := authlog.CreateLog(newLog); err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		c.JSON(401, gin.H{"error": "token already used"})
		return
	}

	accessjti := accessclaims.ID
	accessexp := accessclaims.ExpiresAt.Time
	accessduration := time.Until(accessexp)
	
	refreshexp := refreshclaims.ExpiresAt.Time
	refreshduration := time.Until(refreshexp)

	if err := token.RevokeTokens(c.Request.Context(), accessjti, refreshjti, accessduration, refreshduration); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
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
		c.JSON(400, gin.H{"error": "refresh token header not provided"})
		return		
	}

	refreshToken = strings.TrimPrefix(refreshToken, "Refresh ")
	refreshclaims, err := token.ValidateToken(refreshToken)
	if err != nil {
		log := authlog.Logs["4"]
		fmtMessage := fmt.Sprint(log.Message, refreshToken)
		newLog := db.SecurityLog {
			Log: fmtMessage,
			Level: log.Level,
		}
		if err := authlog.CreateLog(newLog); err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	refreshjti := refreshclaims.ID
	// check if token has been used and blacklisted
	isblacklisted, err := token.IsTokenBlacklisted(c.Request.Context(), refreshjti)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	if isblacklisted {
		// create a log
		log  := authlog.Logs["1"]
		fmtMessage := fmt.Sprintf(log.Message, refreshToken)
		newLog := db.SecurityLog{
			vendorID: refreshclaims.VendorID,
			Log: fmtMessage,
			Level: log.Level,
		}

		if err := authlog.CreateLog(newLog); err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}

		c.JSON(401, gin.H{"error": "token already used"})
		return
	}

	// first generate token
	access_token, refresh_token, err := token.RefreshToken(refreshclaims.vendorID, refreshclaims.Email)
	if err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	// then revoke token
	refreshexp := refreshclaims.ExpiresAt.Time
	refreshduration := time.Until(refreshexp)
	if err := token.RevokeTokens(c.Request.Context(), "", refreshjti, 0, refreshduration); err != nil {
		c.JSON(500, gin.H{"error": err.Error()})
		return
	}

	c.JSON(200, gin.H{
		"access_token": access_token,
		"refresh_token": refresh_token,
	})

}
// <---------------------> End Refresh Token <---------------------->
