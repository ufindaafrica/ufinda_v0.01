package webhook

import (
	"github.com/gin-gonic/gin"
	"os"
	"log"
	// "fmt"
	"github.com/oladev/ufinda_v0.01/internal/sockets/kyc"
)

func RegisterWebhooks(r *gin.Engine, wsHub *hub.Hub) {
	webhookGroup := r.Group("/dojah")

	// Read IP from env, fallback to defaults
	dojahWebhookIP := os.Getenv("DOJAH_WEBHOOK_IP")
	if dojahWebhookIP == "" {
		dojahWebhookIP = "20.112.64.208"
	}

	// Include local loopback addresses so Ngrok works during development
	allowedIPs := []string{dojahWebhookIP, "::1", "127.0.0.1"}

	webhookGroup.POST("/webhook", IPFilterMiddleware(allowedIPs...), DojahWebhookHandler(wsHub))

	log.Printf("Dojah Webhook registered at /dojah/webhook with allowed IPs: %v", allowedIPs)
}
