package webhook

import (
	// "net"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
)

func IPFilterMiddleware(dojahIp string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract the IP address. For Ngrok setups, this is typically the direct connection IP.
		clientIP := c.ClientIP()

		if clientIP != dojahIp {
			log.Printf("SECURITY REJECTED: Request from unwhitelisted IP: %s (Expected: %s).", clientIP , dojahIp)
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Forbidden: IP not whitelisted"})
			return
		}
		log.Printf("Security Check 1 (IP Whitelist) passed for %s", clientIP )

		c.Next()
	}
}