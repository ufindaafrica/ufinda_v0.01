package webhook

import (
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// IPFilterMiddleware validates incoming requests against a slice of allowed IPs.
func IPFilterMiddleware(allowedIPs ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		clientIP := c.ClientIP()

		// Helper to check if clientIP matches any allowed IP
		isAllowed := false
		for _, ip := range allowedIPs {
			if strings.TrimSpace(ip) == clientIP {
				isAllowed = true
				break
			}
		}

		if !isAllowed {
			log.Printf("SECURITY REJECTED: Request from unwhitelisted IP: %s (Allowed: %v)", clientIP, allowedIPs)
			
			// Optional Debug log: inspect raw headers to see what ngrok/proxy is passing
			log.Printf("Debug Headers - X-Forwarded-For: %s, X-Real-IP: %s, RemoteAddr: %s",
				c.GetHeader("X-Forwarded-For"),
				c.GetHeader("X-Real-IP"),
				c.Request.RemoteAddr,
			)

			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Forbidden: IP not whitelisted"})
			return
		}

		log.Printf("Security Check 1 (IP Whitelist) passed for %s", clientIP)
		c.Next()
	}
}