package paystackwebhook

import (
	"github.com/gin-gonic/gin"
	"os"
	"github.com/oladev/ufinda_v0.01/internal/webhooks"
	"strings"
)

func RegisterPaystackWebhook(r *gin.Engine) {
	payStackWebhookIPs := os.Getenv("PAYSTACK_WEBHOOK_IPS")
	if payStackWebhookIPs == "" {
		payStackWebhookIPs = "52.31.139.75,52.49.173.169,52.214.14.220"
	}

	// Split by comma and clean up any extra spaces
	rawIPs := strings.Split(payStackWebhookIPs, ",")
	var allowedIPs []string
	for _, ip := range rawIPs {
		if trimmed := strings.TrimSpace(ip); trimmed != "" {
			allowedIPs = append(allowedIPs, trimmed)
		}
	}

	webhookGroup := r.Group("/paystack")
	{
		webhookGroup.POST("/webhook", webhook.IPFilterMiddleware(allowedIPs), PaystackWebhookHandler)
	}
}