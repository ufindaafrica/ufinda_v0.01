package dojahwebhook

import (
	"github.com/gin-gonic/gin"
	"os"
	"strings"
	"github.com/oladev/ufinda_v0.01/internal/sockets/kyc"
	"github.com/oladev/ufinda_v0.01/internal/webhooks"
)

func RegisterDojahWebhooks(r *gin.Engine, wsHub *hub.Hub) {
	// Define a group for webhook endpoints
	webhookGroup := r.Group("/dojah")
	DojahWebhookIP := os.Getenv("DOJAH_WEBHOOK_IP")
	if DojahWebhookIP == "" {
		DojahWebhookIP = "20.112.64.208"
	}

	rawIPs := strings.Split(DojahWebhookIP, ",")
	var allowedIPs []string
	for _, ip := range rawIPs {
		if trimmed := strings.TrimSpace(ip); trimmed != "" {
			allowedIPs = append(allowedIPs, trimmed)
		}
	}
	// Apply the IP filter middleware only to the webhook handler
	webhookGroup.POST("/webhook", webhook.IPFilterMiddleware(allowedIPs), DojahWebhookHandler(wsHub))
}
