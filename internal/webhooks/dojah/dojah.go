package dojahwebhook

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"github.com/oladev/ufinda_v0.01/internal/db"
	"github.com/oladev/ufinda_v0.01/internal/routes/kyc/vendor"
	"os"
	"github.com/gin-gonic/gin"
	"github.com/oladev/ufinda_v0.01/internal/sockets/kyc"
	"github.com/oladev/ufinda_v0.01/internal/response"
)

func VerifyDojahSignature(receivedSignature string) bool {
	secretKey := os.Getenv("DOJAH_SECRET_KEY")

	if secretKey == "" {
		log.Println("Security Error: DOJAH_SECRET_KEY is not set.")
		return false
	}

	hashBytes := sha256.Sum256([]byte(secretKey))

	computedHash := hex.EncodeToString(hashBytes[:])

	if computedHash == receivedSignature {
		return true
	}

	log.Println("SIMPLE HASH MISMATCH: Computed hash does not match received signature.")
	return false
}

func DojahWebhookHandler(wsHub *hub.Hub) gin.HandlerFunc {
	return func(c *gin.Context) {
		rawBody, err := ioutil.ReadAll(c.Request.Body)
		if err != nil {
			response.Error(c, http.StatusInternalServerError, "Failed to read request body")
			return
		}
		c.Request.Body = ioutil.NopCloser(bytes.NewBuffer(rawBody))

		receivedSignature := c.GetHeader("x-dojah-signature-v2")
		if receivedSignature == "" {
			log.Println("[ERROR_DOJAH_SIG_HEADER_MISSING]Security Check 2 (HMAC) Failed: Missing x-dojah-signature header.")
			response.Error(c, http.StatusUnauthorized, response.ErrCodeUnauthorized, "Missing Signature")
			return
		}

		if !VerifyDojahSignature(receivedSignature) { 
			log.Println("[ERROR_DOJAH_INVALID_HMAC_SIG]Security Check 2 (HMAC) Failed: Invalid HMAC signature computed for dojah.")
			response.Error(c, http.StatusUnauthorized, response.ErrCodeUnauthorized, "Invalid Signature")
			return
		}
		log.Println("Security Check 2 (HMAC Signature) verification successful.")

		var payload db.DojahWebhookPayload
		if err := json.Unmarshal(rawBody, &payload); err != nil {
			log.Printf("[ERROR_DOJAH_REQ_PARSING_ERR]Parsing Error: Failed to unmarshal payload: %v", err)
			response.Error(c, http.StatusBadRequest, response.ErrCodeBadRequest)
			return
		}

		vendorkyc.HandleVerificationPayload(payload, wsHub)
		
		// Returns a standardized success JSON payload
		response.Success(c, http.StatusOK, "Webhook processed successfully")
	}
}