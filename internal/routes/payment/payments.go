package payment
import (
	"github.com/gin-gonic/gin"
	"net/http"
	"github.com/oladev/ufinda_v0.01/internal/response"
	"github.com/oladev/ufinda_v0.01/internal/db/auth"
	"github.com/oladev/ufinda_v0.01/internal/db"
	"github.com/oladev/ufinda_v0.01/internal/db/payment"
	"errors"
	"log"
	"os"
	"time"
	"fmt"
	"encoding/json"
	"github.com/oladev/ufinda_v0.01/internal/token"
)

type ConfirmBookingRequest struct {
	Reference string `json:"reference" binding:"required"`
	UserID    string `json:"user_id" binding:"required"`
}

type PaystackVerifyResponse struct {
	Status  bool   `json:"status"`
	Message string `json:"message"`
	Data    struct {
		Status    string `json:"status"` // "success", "failed", etc.
		Reference string `json:"reference"`
		Amount    int64  `json:"amount"`
	} `json:"data"`
}

func ConfirmUserBookingFee(c *gin.Context) {
	var req ConfirmBookingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, response.ErrCodeBadRequest)
		return
	}

	// 1. Retrieve user to get their email and role
	user, err := authdb.FindCreatedUserByID(req.UserID)
	if err != nil {
		if errors.Is(err, authdb.ErrUserNotFound) {
			response.Error(c, http.StatusNotFound, response.ErrCodeUserNotFound)
		} else {
			log.Printf("[ERROR_FINDING_USER] failed to find user %s: %v", req.UserID, err)
			response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		}
		return
	}

	// 2. Perform Server-Side Verification with Paystack
	paystackKey := os.Getenv("PAYSTACK_SECRET_KEY")
	verifyURL := fmt.Sprintf("https://api.paystack.co/transaction/verify/%s", req.Reference)

	httpReq, err := http.NewRequest("GET", verifyURL, nil)
	if err != nil {
		log.Printf("[CRITICAL_PAYSTACK_REQ_BUILD] failed to create request: %v", err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}
	httpReq.Header.Set("Authorization", "Bearer "+paystackKey)
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		log.Printf("[CRITICAL_PAYSTACK_NETWORK_ERR] failed to verify transaction with paystack: %v", err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}
	defer resp.Body.Close()

	var paystackResp PaystackVerifyResponse
	if err := json.NewDecoder(resp.Body).Decode(&paystackResp); err != nil {
		log.Printf("[CRITICAL_PAYSTACK_DECODE_ERR] failed to decode paystack response: %v", err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	// 3. Confirm Transaction Status is genuinely successful
	if !paystackResp.Status || paystackResp.Data.Status != "success" {
		log.Printf("[WARNING_PAYSTACK_DECLINED] transaction verification failed or declined for ref: %s", req.Reference)
		response.Error(c, http.StatusBadRequest, response.ErrCodeBadRequest, "Transaction verification failed or payment was not successful.")
		return
	}

	// 4. Construct booking fee record and call ActivateBookingFee
	isPaidVal := true
	bookingFeeData := db.BookingFee{
		Email:   user.Email,
		UserID: user.ID,
		Amount:  int64(paystackResp.Data.Amount), // Amount verified from Paystack response (in kobo)
		IsPaid:  &isPaidVal,
		Ref:     req.Reference,
	}

	if err := paymentdb.ActivateBookingFee(bookingFeeData); err != nil {
		log.Printf("[CRITICAL_ACTIVATE_BOOKING_FEE] failed to activate booking fee for %s: %v", user.Email, err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	// 5. Generate Access and Refresh JWT Tokens
	accessToken, refreshToken, err := token.GenerateTokens(user.ID, user.Email, user.Role)
	if err != nil {
		log.Printf("[CRITICAL_TOKEN_GEN_FAILED] failed to generate tokens for user %s: %v", user.ID, err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	// 6. Return successful response with tokens and updated status
	response.Success(c, http.StatusOK, "Booking fee confirmed successfully", gin.H{
		"is_paid":       true,
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"id":            user.ID,
		"role":          user.Role,
	})
}


// ConfirmAgentListingEligibility checks if an agent can create a new listing
func ConfirmAgentListingEligibility(c *gin.Context) {
	// 1. Extract agent ID from context (assuming set by your auth middleware)
	user, exists := c.Get("user")
	if !exists {
		response.Error(c, http.StatusUnauthorized, response.ErrCodeUnauthorized)
		return
	}

	getUser := user.(*db.User)
	// 2. Check free quota left using the helper function (Max free quota is 10)
	freeQuotaLeft, err := paymentdb.GetAgentFreeQuotaLeft(*getUser)
	if err != nil {
		log.Printf("[ERROR_GET_AGENT_QUOTA] error getting agent remaining free quota for user %s: %v", getUser.ID, err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	// 3. Check if the agent has any unused listing fees in the database
	hasUnusedFee, err := paymentdb.AgentHasUnusedListingFee(getUser.ID)
	if err != nil {
		log.Printf("[ERROR_GET_AGENT_UNUSED_FEE] error getting agent unused fee record for user %s: %v", getUser.ID, err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	// 4. Determine eligibility: true if quota > 0 OR has unused listing fee
	canList := freeQuotaLeft > 0 || hasUnusedFee

	// 5. Respond with the result and the free quota left
	response.Success(c, http.StatusOK, "Listing eligibility checked successfully", gin.H{
		"can_list":        canList,
		"free_quota_left": freeQuotaLeft,
	})
}

type AgentListingFee struct {
	Reference  string `json:"reference"`
}
func ConfirmAgentListingFee(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		response.Error(c, http.StatusUnauthorized, response.ErrCodeUnauthorized)
		return
	}

	getUser := user.(*db.User)

	var req AgentListingFee
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, response.ErrCodeBadRequest)
		return
	}

	// 2. Perform Server-Side Verification with Paystack
	paystackKey := os.Getenv("PAYSTACK_SECRET_KEY")
	verifyURL := fmt.Sprintf("https://api.paystack.co/transaction/verify/%s", req.Reference)

	httpReq, err := http.NewRequest("GET", verifyURL, nil)
	if err != nil {
		log.Printf("[CRITICAL_PAYSTACK_REQ_BUILD] failed to create request: %v", err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}
	httpReq.Header.Set("Authorization", "Bearer "+paystackKey)
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		log.Printf("[CRITICAL_PAYSTACK_NETWORK_ERR] failed to verify transaction with paystack: %v", err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}
	defer resp.Body.Close()

	var paystackResp PaystackVerifyResponse
	if err := json.NewDecoder(resp.Body).Decode(&paystackResp); err != nil {
		log.Printf("[CRITICAL_PAYSTACK_DECODE_ERR] failed to decode paystack response: %v", err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	// 3. Confirm Transaction Status is genuinely successful
	if !paystackResp.Status || paystackResp.Data.Status != "success" {
		log.Printf("[WARNING_PAYSTACK_DECLINED] transaction verification failed or declined for ref: %s", req.Reference)
		response.Error(c, http.StatusBadRequest, response.ErrCodeBadRequest, "Transaction verification failed or payment was not successful.")
		return
	}

	listingData := db.ListingFee{
		VendorID: getUser.ID,
		Email:  getUser.Email,
		Amount: paystackResp.Data.Amount,
		Ref:    paystackResp.Data.Reference, 
	}

	if err := paymentdb.CreateListingFeeRecord(listingData); err != nil {
		log.Printf("[ERROR_CREATE_LISTING_FEE]: Failed to save listing fee record for user %s: %v", getUser.ID, err)
		response.Error(c, http.StatusInternalServerError, response.ErrCodeServerError)
		return
	}

	log.Printf("[SUCCESS_CONFIRM_LISTING_FEE]: Listing fee verified and saved for agent %s (Ref: %s)", getUser.ID, req.Reference)
	response.Success(c, http.StatusOK, "Listing fee confirmed successfully")
}