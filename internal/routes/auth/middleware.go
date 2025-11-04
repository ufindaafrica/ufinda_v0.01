package auth

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"strings"
	"github.com/oladev/ufinda_v0.01/internal/token"
    "fmt"
    "errors"
	"github.com/oladev/ufinda_v0.01/internal/logs/auth"
	"github.com/oladev/ufinda_v0.01/internal/db"
    "github.com/oladev/ufinda_v0.01/internal/db/auth"
    "github.com/google/uuid"
)

func handleAuthError(c *gin.Context, status int, message string, logEntry db.SecurityLog) {
    authlog.SecurityLog(logEntry)

    c.JSON(status, gin.H{"error": message})
    c.Abort()
}


func AuthMiddleware() gin.HandlerFunc {
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
                ID: uuid.New(),
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
            logData := authlog.Logs["4"]
            logEntry := db.SecurityLog{
                ID: uuid.New(),
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
            if errors.Is(err, authdb.ErrorUserNotFound) {
                c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
            } else {
                // Log the user retrieval failure
                authlog.LogAuth(claims.UserID, fmt.Errorf("error getting user: %w", err))
                c.JSON(http.StatusInternalServerError, gin.H{"error": "error getting user"})
            }
            return
        }

        if createdUser.Role != "user" {
            c.JSON(http.StatusForbidden, gin.H{"error": "access not granted"})
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
                ID: uuid.New(),
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
            if errors.Is(err, authdb.ErrorUserNotFound) {
                c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
            } else {
                // Log the user retrieval failure
                authlog.LogAuth(claims.UserID, fmt.Errorf("error getting user: %w", err))
                c.JSON(http.StatusInternalServerError, gin.H{"error": "error getting user"})
            }
            return
        }
        
        if createdUser.Role != "vendor" {
            c.JSON(http.StatusForbidden, gin.H{"error": "access not granted"})
            return
        }

        // Set the user ID from the token payload, this is the trusted source
        c.Set("user", createdUser)
        c.Next()
    }
}
