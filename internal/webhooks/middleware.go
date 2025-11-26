package webhook

import (
	"net"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
)

func IPFilterMiddleware(dojahIp string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract the IP address. For Ngrok setups, this is typically the direct connection IP.
		host, _, err := net.SplitHostPort(c.Request.RemoteAddr)
		if err!= nil {
			host = c.Request.RemoteAddr
		}

		if host!= dojahIp {
			log.Printf("SECURITY REJECTED: Request from unwhitelisted IP: %s (Expected: %s)", host, dojahIp)
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Forbidden: IP not whitelisted"})
			return
		}
		log.Printf("Security Check 1 (IP Whitelist) passed for %s", host)

		c.Next()
	}
}