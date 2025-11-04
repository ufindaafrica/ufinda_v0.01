package webhook

import (
	"github.com/gin-gonic/gin"
	"os"
	"log"
	"fmt"
	"github.com/oladev/ufinda_v0.01/internal/sockets/kyc"
)

func RegisterWebhooks(r *gin.Engine, wsHub *hub.Hub) {
	// Define a group for webhook endpoints
	webhookGroup := r.Group("/dojah")
	DojahWebhookIP := os.Getenv("DOJAH_WEBHOOK_IP")
	if DojahWebhookIP == "" {
		log.Fatalf("IP not set")
	}

	// Apply the IP filter middleware only to the webhook handler
	webhookGroup.POST("/webhook", IPFilterMiddleware(DojahWebhookIP), DojahWebhookHandler(wsHub))

	log.Println(fmt.Sprintf("Dojah Webhook Registered at /dojah/webhook with IP Whitelist: %s", DojahWebhookIP))
}
