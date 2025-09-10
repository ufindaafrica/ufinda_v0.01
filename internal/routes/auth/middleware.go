package authmiddleware

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"strings"
	"log"
	"github.com/oladev/ufinda_v0.01/internal/token/client"
	"github.com/oladev/ufinda_v0.01/internal/logs/auth"
	"github.com/oladev/ufinda_v0.01/internal/db"
)

func handleAuthError(c *gin.Context, status int, message string, logEntry db.SecurityLog) {
    if err := authlog.CreateLog(logEntry); err != nil {
		log.Printf("%v", err)
    }

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
