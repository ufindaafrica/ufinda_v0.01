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
	"github.com/keighl/postmark"
	"github.com/gin-gonic/gin"
	"fmt"
	"github.com/oladev/ufinda_v0.01/internal/db/payment"
	"github.com/oladev/ufinda_v0.01/internal/db"
	"github.com/oladev/ufinda_v0.01/internal/db/auth"
	"github.com/oladev/ufinda_v0.01/internal/response"
)

type PaystackWebhookPayload struct {
	Event string `json:"event"`
	Data struct {
		Reference string `json:"reference"`
		Amount int64 `json:"amount"`
		Status string `json:"status"`
		Customer struct {
			Email string `json:"email"`
		}`json:"customer"`
		Metadata struct {
			UserID string `json:"user_id"`
		}`json:"metadata"`
	}`json:"data"`
}

func PaystackWebhookHandler(c *gin.Context) {
	paystackSecret := os.Getenv("PAYSTACK_SECRET_KEY")
	if paystackSecret == "" {
		log.Println("[ERROR_PAYSTACK_SECRET_KEY_NOT_SET]: PAYSTACK_SECRET_KEY is not set")
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.Printf("[ERROR_PAYSTACK_REQ_BODY_ERR]: Failed to read body: %v\n", err)
		response.Error(c, http.StatusBadRequest, "Failed to read paystack request body")
		return
	}
	
	paystackSignature := c.GetHeader("x-paystack-signature")
	if paystackSignature == "" {
		log.Println("[ERROR_PAYSTACK_HMAC_CHECK_ERR]Security Check (HMAC) Failed: Missing x-paystack-signature header.")
		response.Error(c, http.StatusUnauthorized, "missing paystack signature")
		return
	}

	mac := hmac.New(sha512.New, []byte(paystackSecret))
	mac.Write(body)
	expectedSignature := hex.EncodeToString(mac.Sum(nil))

	if !hmac.Equal([]byte(paystackSignature), []byte(expectedSignature)) {
		log.Println("[ERROR_WEBHOOK_SIG_ERR]: Invalid webhook signature attempt")
		response.Error(c, http.StatusUnauthorized, "Invalid signature")
		return
	}

	var payload PaystackWebhookPayload
	if err := json.Unmarshal(body, &payload); err != nil {
		log.Printf("[ERROR_PAYSTACK_MARSHAL_ERR]: Failed to unmarshal payload: %v\n", err)
		response.Error(c, http.StatusBadRequest, response.ErrCodeBadRequest)
		return
	}

	// Process only successful charges
	if payload.Event == "charge.success" && payload.Data.Status == "success" {
		email := strings.ToLower(strings.TrimSpace(payload.Data.Customer.Email))
		ref := payload.Data.Reference
		amount := payload.Data.Amount
		userID := payload.Data.Metadata.UserID

		user, err := authdb.FindCreatedUserByID(userID)
		if err != nil {
			log.Printf("[ERROR_GET_USR_BY_ID_IN_PAYSTACK] failed to get user by user id for user %s: %v", userID, err)
			response.Success(c, http.StatusOK, "webhook received but user not found")
			return
		}

		userRole := "user"
		if user.Role != "" {
			userRole = user.Role
		}

		if userRole == "user" {
			isPaidVal := true
			data := db.BookingFee{
				Email:  email,
				UserID: userID,
				Amount: int64(amount),
				Ref:    ref,
				IsPaid: &isPaidVal,
			}

			if email != "" && ref != "" && userID != "" {
				if err := paymentdb.ActivateBookingFee(data); err != nil {
					log.Printf("[ERROR_PAYSTACK_ACTIVATE_BOOKING_FEE]: Failed to activate booking fee for %s: %v", email, err)
					response.Success(c, http.StatusOK, "received with db processing warning")
					return
				}
			}

			log.Printf("[Paystack Webhook Success]: Successfully activated booking fee for email: %s\n", email)

		} else if userRole == "vendor" {
			data := db.ListingFee{
				UserID: userID,
				Email:  email,
				Amount: amount,
				Ref:    ref,
			}

			if email != "" && ref != "" && userID != "" {
				if err := paymentdb.CreateListingFeeRecord(data); err != nil {
					log.Printf("[ERROR_PAYSTACK_ACTIVATE_LISTING_FEE]: Failed to activate listing fee for %s: %v", email, err)
					response.Success(c, http.StatusOK, "received with db processing warning")
					return
				}
			}

			log.Printf("[Paystack Webhook Success]: Successfully activated listing fee for email: %s\n", email)
		}

		// Trigger team email notification asynchronously with dynamic content based on user role
		go func() {
			apiKey := os.Getenv("POSTMARK_SERVER_KEY")
			if apiKey == "" {
				log.Printf("[ERROR_POSTMARK_KEY_NOT_SET]: POSTMARK_SERVER_KEY environment variable not set")
				return
			}

			client := postmark.NewClient(apiKey, "")
			
			teamEmails := []string{
				"ella.appdev@gmail.com",
				"sarobaridoo@gmail.com",
			}

			amountNaira := float64(amount) / 100

			var subject, roleLabel, feeType string
			if userRole == "vendor" {
				subject = "🔔 New Vendor Listing Fee Paid on uFinda!"
				roleLabel = "Agent/Vendor"
				feeType = "listing"
			} else {
				subject = "🔔 New Booking Fee Paid on uFinda!"
				roleLabel = "User"
				feeType = "booking"
			}

			plainTextContent := fmt.Sprintf(
				"A %s has successfully paid their %s fee.\n\nEmail: %s\nAmount: ₦%.2f\nReference: %s", 
				strings.ToLower(roleLabel), strings.ToLower(feeType), email, amountNaira, ref,
			)

			htmlContent := fmt.Sprintf(
				"<h3>New Payment Received!</h3><p>A <strong>%s</strong> has successfully paid their %s fee.</p><ul><li><strong>Email:</strong> %s</li><li><strong>Amount:</strong> ₦%.2f</li><li><strong>Reference:</strong> %s</li></ul>", 
				roleLabel, feeType, email, amountNaira, ref,
			)

			for _, teamEmail := range teamEmails {
				emailMessage := postmark.Email{
					From:     "uFinda <no-reply@ufinda.org>",
					ReplyTo:  "no-reply@ufinda.org",
					To:       teamEmail,
					Subject:  subject,
					TextBody: plainTextContent,
					HtmlBody: htmlContent,
					Tag:      "team-payment-notification",
				}

				_, err := client.SendEmail(emailMessage)
				if err != nil {
					log.Printf("[ERROR_PAYSTACK_SEND_EMAIL]: Failed to send notification email to %s: %v", teamEmail, err)
				}
			}
		}()
	}

	response.Success(c, http.StatusOK, "success")
}