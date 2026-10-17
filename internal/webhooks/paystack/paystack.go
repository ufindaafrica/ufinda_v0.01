package paystackwebhook

import (
	"crypto/hmac"
	"crypto/sha512"
	"encoding/hex"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/oladev/ufinda_v0.01/internal/db/auth"
	"github.com/oladev/ufinda_v0.01/internal/db"
)

type PaystackWebhookPayload struct {
	Event string `json:"event"`
	Data struct {
		Reference string `json:"reference"`
		Amount int `json:"amount"`
		Status string `json:"status"`
		Customer struct {
			Email string `json:"email"`
		}`json:"customer"`
	}`json:"data"`
}

func PaystackWebhookHandler(c *gin.Context) {
	paystackSecret := os.Getenv("PAYSTACK_SECRET_KEY")
	if paystackSecret == "" {
		log.Println("Security Error: PAYSTACK_SECRET_KEY is not set")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Server misconfiguration"})
		return
	}

	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.Printf("[Paystack Webhook Error]: Failed to read body: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read request body"})
		return
	}
	
	paystackSignature := c.GetHeader("x-paystack-signature")
	if paystackSignature == "" {
		log.Println("Security Check (HMAC) Failed: Missing x-paystack-signature header.")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: Missing Signature"})
		return
	}

	mac := hmac.New(sha512.New, []byte(paystackSecret))
	mac.Write(body)
	expectedSignature := hex.EncodeToString(mac.Sum(nil))

	log.Printf("[DEBUG] Header Signature: %s", paystackSignature)
	log.Printf("[DEBUG] Computed Signature: %s", expectedSignature)
	log.Printf("[DEBUG] Secret Key Used: %s (Length: %d)", paystackSecret[:10], len(paystackSecret))
	log.Printf("[DEBUG] Raw Body String: %s", string(body))
	if !hmac.Equal([]byte(paystackSignature), []byte(expectedSignature)) {
		log.Println("Security Error: Invalid webhook signature attempt")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid signature"})
		return
	}

	var payload PaystackWebhookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		log.Printf("Parsing Error: Failed to unmarshal payload: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload format"})
		return
	}

	// Process only successful charges
	if payload.Event == "charge.success" && payload.Data.Status == "success" {
		email := strings.ToLower(strings.TrimSpace(payload.Data.Customer.Email))
		ref := payload.Data.Reference

		isPaidVal := true
		data := db.BookingFee{
			Email:  email,
			Amount: int64(payload.Data.Amount),
			Ref:    ref,
			IsPaid: &isPaidVal,
		}

		if email != "" && ref != "" {
			if err := authdb.ActivateBookingFee(data); err != nil {
				log.Printf("[Paystack Webhook Error]: Failed to activate booking fee for %s: %v", email, err)
				c.JSON(http.StatusOK, gin.H{"status": "received with db processing warning"})
				return
			}
		}

		log.Printf("[Paystack Webhook Success]: Successfully activated booking fee for email: %s\n", email)
	}

	c.JSON(http.StatusOK, gin.H{"status": "success"})
}