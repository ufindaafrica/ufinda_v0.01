package paystackwebhook

import (
	"github.com/gin-gonic/gin"
	"os"
	"github.com/oladev/ufinda_v0.01/internal/webhooks"
)

func RegisterPaystackWebhook(r *gin.Engine) {
	payStackWebhookIP := os.Getenv("PAYSTACK_WEBHOOK_IP")
	if payStackWebhookIP == "" {
		payStackWebhookIP = "52.31.139.75"
	}

	webhookGroup := r.Group("/paystack")
	{
		webhookGroup.POST("/webhook", webhook.IPFilterMiddleware(payStackWebhookIP), PaystackWebhookHandler)
	}
}