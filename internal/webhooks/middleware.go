package webhook

import (
	// "net"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
	"os"
)

func IPFilterMiddleware(webhookIp string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract the IP address. For Ngrok setups, this is typically the direct connection IP.
		clientIP := c.ClientIP()
		if os.Getenv("APP_ENV") == "backend-devt" && (clientIP == "127.0.0.1" || clientIP == "::1") {
			c.Next()
			return
		}

		if clientIP != webhookIp {
			log.Printf("SECURITY REJECTED: Request from unwhitelisted IP: %s (Expected: %s).", clientIP , webhookIp)
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Forbidden: IP not whitelisted"})
			return
		}
		log.Printf("Security Check 1 (IP Whitelist) passed for %s", clientIP )

		c.Next()
	}
}