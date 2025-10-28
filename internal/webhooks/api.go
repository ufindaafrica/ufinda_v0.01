package webhook

import (
	"github.com/gin-gonic/gin"
	"os"
	"log"
	"fmt"
)

func RegisterWebhooks(r *gin.Engine) {
	// Define a group for webhook endpoints
	webhookGroup := r.Group("/dojah")
	DojahWebhookIP := os.Getenv("DOJAH_WEBHOOK_IP")
	if DojahWebhookIP == "" {
		log.Fatalf("IP not set")
	}

	// Apply the IP filter middleware only to the webhook handler
	webhookGroup.POST("/webhook", IPFilterMiddleware(DojahWebhookIP), DojahWebhookHandler)

	log.Println(fmt.Sprintf("Dojah Webhook Registered at /dojah/webhook with IP Whitelist: %s", DojahWebhookIP))
}
