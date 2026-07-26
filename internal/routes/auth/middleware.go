package auth

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"strings"
	"github.com/oladev/ufinda_v0.01/internal/token"
    "fmt"
    "errors"
    // "log"
	"github.com/oladev/ufinda_v0.01/internal/logs/auth"
	"github.com/oladev/ufinda_v0.01/internal/db"
    "github.com/oladev/ufinda_v0.01/internal/db/auth"
    "github.com/oladev/ufinda_v0.01/internal/db/kyc/vendor"
    "github.com/oladev/ufinda_v0.01/internal/logs/hostel"
)

func handleAuthError(c *gin.Context, status int, message string, logEntry db.SecurityLog) {
    authlog.SecurityLog(logEntry)

    c.JSON(status, gin.H{"error": message})
    c.Abort()
}


func AuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        tokenString := ""
        authHeader := c.GetHeader("Authorization")
        // --- FIX FOR AUTH HEADER ---
        if authHeader != "" {
            tokenString = strings.TrimPrefix(authHeader, "Bearer ")
        } else if tokenString == "" {
            // If authHeader was empty, check query parameter.
            // This is the clean way to merge the logic.
            tokenString = c.Query("token")
        }

        if tokenString == "" || tokenString == "Bearer " { // Check if token is still empty/invalid prefix
            c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or missing authentication token"})
            return
        }
        // ---------------------------
        claims, err := token.ValidateToken(tokenString)
        if err != nil {
            logData := authlog.Logs["4"]
            logEntry := db.SecurityLog{
                Log:   logData.Message,
                Level: logData.Level,
            }
            handleAuthError(c, http.StatusUnauthorized, "Invalid token", logEntry)
            return
        }

        // Check token blacklist status
        isBlacklisted, err := token.IsTokenBlacklisted(c.Request.Context(), claims.ID)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            c.Abort()
            return
        }
        if isBlacklisted {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            c.Abort()
            return
        }

        // Set the user ID from the token payload, this is the trusted source
        c.Set("id", claims.UserID)
        c.Next()
    }
}

func UserAuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
            c.Abort()
            return
        }


        // Validate token
        tokenString := strings.TrimPrefix(authHeader, "Bearer ")
        claims, err := token.ValidateToken(tokenString)
        if err != nil {
            errorMessage := "Invalid token"
            
            if err.Error() == "expired token" {
                errorMessage = "expired token"
            }

            logData := authlog.Logs["4"]
            logEntry := db.SecurityLog{
                Log:   fmt.Sprintf("%s: %v", logData.Message, err),
                Level: logData.Level,
            }

            handleAuthError(c, http.StatusUnauthorized, errorMessage, logEntry)
            return
        }

        // Check token blacklist status
        isBlacklisted, err := token.IsTokenBlacklisted(c.Request.Context(), claims.ID)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            c.Abort()
            return
        }
        if isBlacklisted {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            c.Abort()
            return
        }

        // 2. Find the user based on the trusted ID
        createdUser, err := authdb.FindCreatedUserByID(claims.UserID)
        if err != nil {
            if errors.Is(err, authdb.ErrUserNotFound) {
                c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
            } else {
                // Log the user retrieval failure
                authlog.LogAuth(claims.UserID, fmt.Errorf("error getting user: %w", err))
                c.JSON(http.StatusInternalServerError, gin.H{"error": "error getting user"})
            }
            c.Abort()
            return
        }

        if createdUser.Role != "user" {
            c.JSON(http.StatusForbidden, gin.H{"error": "access not granted"})
            c.Abort()
            return
        }

        // Set the user ID from the token payload, this is the trusted source
        c.Set("user", createdUser)
        c.Next()
    }
}

func VendorAuthMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
            c.Abort()
            return
        }

        // Validate token
        tokenString := strings.TrimPrefix(authHeader, "Bearer ")
        claims, err := token.ValidateToken(tokenString)
        if err != nil {
            logData := authlog.Logs["4"]
            logEntry := db.SecurityLog{
                Log:   logData.Message,
                Level: logData.Level,
            }
            handleAuthError(c, http.StatusUnauthorized, "Invalid token", logEntry)
            return
        }

        // Check token blacklist status
        isBlacklisted, err := token.IsTokenBlacklisted(c.Request.Context(), claims.ID)
        if err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
            c.Abort()
            return
        }
        if isBlacklisted {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
            c.Abort()
            return
        }

        // 2. Find the user based on the trusted ID
        createdUser, err := authdb.FindCreatedUserByID(claims.UserID)
        if err != nil {
            if errors.Is(err, authdb.ErrUserNotFound) {
                c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
            } else {
                // Log the user retrieval failure
                authlog.LogAuth(claims.UserID, fmt.Errorf("error getting user: %w", err))
                c.JSON(http.StatusInternalServerError, gin.H{"error": "error getting user"})
            }
            c.Abort()
            return
        }
        
        if createdUser.Role != "vendor" {
            c.JSON(http.StatusForbidden, gin.H{"error": "access not granted"})
            c.Abort()
            return
        }

        // Set the user ID from the token payload, this is the trusted source
        c.Set("user", createdUser)
        c.Next()
    }
}

// CheckVendorVerified fetches the user from Gin context and verifies their VendorKYC status.
// Returns the *db.User and *db.VendorKYC if verified, otherwise writes HTTP response and returns false.
func CheckVendorVerified(c *gin.Context) (*db.User, *db.VendorKYC, bool) {
	userVal, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		c.Abort()
		return nil, nil, false
	}

	getUser, ok := userVal.(*db.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user session data"})
		c.Abort()
		return nil, nil, false
	}

	// Fetch vendor KYC record using user ID
	kycRecord, err := vendorkycdb.FindVendorKYC(getUser.ID)
	if err != nil {
		if errors.Is(err, vendorkycdb.ErrKYCNotFound) {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "vendor not verified",
			})
		} else {
			hostellog.LogHostel(getUser.ID, fmt.Errorf("failed to fetch vendor kyc: %w", err))
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal verification check error"})
		}
		c.Abort()
		return getUser, nil, false
	}

	// Verify boolean status flag
	if !kycRecord.IsVerified {
		hostellog.LogHostel(getUser.ID, fmt.Errorf("vendor not verified (status: %s)", kycRecord.Status))
		c.JSON(http.StatusForbidden, gin.H{
			"error":  "vendor not verified",
		})
		c.Abort()
		return getUser, kycRecord, false
	}

	return getUser, kycRecord, true
}