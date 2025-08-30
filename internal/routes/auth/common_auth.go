package auth

import (
	"github.com/gin-gonic/gin"
	"net/http"
	"strings"
	"uFinda/internal/token/client"
	"uFinda/internal/logs/auth"
	"fmt"
	"uFinda/internal/db"
)

type setMiddleware struct {
	UserID string
	Email string
}

type UserContext struct {
	UserID string
	Email string
}
// Middleware to verify JWT token
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := token.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			log := authlog.Logs["4"]
			fmtMessage := fmt.Sprint(log.Message, tokenString)
			newLog := db.SecurityLog {
				Log: fmtMessage,
				Level: log.Level,
			}

			if err := authlog.CreateLog(newLog); err != nil {
				c.JSON(500, gin.H{"error": err.Error()})
				return
			}
			c.Abort()
			return
		}
		
		isblacklisted, err := token.IsTokenBlacklisted(c.Request.Context(), claims.ID)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			c.Abort()
			return
		}
		if isblacklisted {
			c.JSON(400, gin.H{"error": "unauthorized"})
			c.Abort()
			return
		}

		// Set user
		c.Set("user", setMiddleware{
			UserID: claims.UserID,
			Email: claims.Email,
		})

		c.Next()
	}
}

func GetUser(c *gin.Context) (UserContext, bool) {
	if value, exists := c.Get("user"); exists {
		// Type-assert to the struct you are setting in the middleware
		if user, ok := value.(setMiddleware); ok {
			// Return a UserContext struct and true for success
			return UserContext{
				UserID: user.UserID,
				Email:  user.Email,
			}, true
		}
	}
	// Return an empty UserContext and false for failure
	return UserContext{}, false
}
