package webhook

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"github.com/gin-gonic/gin"
)

type DojahWebhookPayload struct {
	ReferenceID        string          `json:"reference_id"`
	VerificationStatus string          `json:"verification_status"` // e.g., "Completed", "Failed"
	AppID              string          `json:"app_id"`
	Datetime           string          `json:"datetime"`
	Entity             json.RawMessage `json:"entity"`
}

/*--------------------------------------*/

func handleVerificationUpdate(payload DojahWebhookPayload) error {
	log.Printf("Processing verification result for ReferenceID: %s", payload.ReferenceID)
	log.Printf("Final Verification Status: %s", payload.VerificationStatus)

	if payload.VerificationStatus == "Completed" {
		// Real action: Lookup vendor file by ReferenceID and mark as verified.
		log.Printf("SUCCESS: Vendor file corresponding to ReferenceID %s marked as VERIFIED.", payload.ReferenceID)
		return nil
	}
	
	log.Printf("INFO: ReferenceID %s has status %s. Requires further action.", payload.ReferenceID, payload.VerificationStatus)
	return nil
}

func VerifyDojahSignature(rawBody []byte, receivedSignature string) bool {
	secretKey := os.Getenv("DOJAH_SECRET_KEY")
	
	// CRITICAL DEBUG STEP 1: Check the key being used (including length, which reveals whitespace issues)
	// Make sure this value perfectly matches your Dojah sandbox Secret Key (the one starting with 'test_').
	log.Printf("DEBUG: Using Secret Key (Length: %d): %s", len(secretKey), secretKey)

	if secretKey == "" {
		log.Println("Security Error: DOJAH_SECRET_KEY is not set.")
		return false
	}
	
	// CRITICAL FIX: Trim potential leading/trailing whitespace/newlines from the raw body.
	// This ensures that the only data being hashed is the JSON payload.
	bodyToHash := bytes.TrimSpace(rawBody)
	
	// Step 1: Initialize HMAC using SHA256 and the secret key
	hash := hmac.New(sha256.New, []byte(secretKey))

	// Step 2: Write the (potentially trimmed) body to the hash
	hash.Write(bodyToHash)

	// Step 3: Compute the hash and encode it as a hex string
	computedHash := hex.EncodeToString(hash.Sum(nil))

	// CRITICAL DEBUG STEP 2 & 3: Log both hashes for a side-by-side comparison.
	log.Printf("DEBUG: Computed Hash: %s", computedHash)
	log.Printf("DEBUG: Received Hash: %s", receivedSignature)

	// Step 4: Securely compare the computed hash and the received signature
	// We convert the hex-encoded string hashes back to byte slices for constant-time comparison.
	if hmac.Equal([]byte(computedHash), []byte(receivedSignature)) {
		return true
	}

	log.Println("HMAC MISMATCH: Computed hash does not match received signature.")
	return false
}

// --- Gin Middleware and Handlers ---

// DojahWebhookHandler processes the incoming event payload after security checks.
func DojahWebhookHandler(c *gin.Context) {
	// Step 1: Read the entire raw request body immediately (CRITICAL for HMAC)
	// rawBody isbyte here.
	rawBody, err := ioutil.ReadAll(c.Request.Body)
	if err!= nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read request body"})
		return
	}
	// Restore the body for potential subsequent reads by Gin if needed
	c.Request.Body = ioutil.NopCloser(bytes.NewBuffer(rawBody))

	// Step 2: Retrieve signature from the header
	receivedSignature := c.GetHeader("x-dojah-signature")
	log.Printf("Raw Body Received (Length: %d): %s", len(rawBody), string(rawBody))
	log.Printf("this is the received signature: %s", receivedSignature)
	if receivedSignature == "" {
		log.Println("Security Check 2 (HMAC) Failed: Missing x-dojah-signature header.")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: Missing Signature"})
		return
	}

	// Step 3: Verify the signature
	// FIX 5: rawBody (typebyte) is now correctly passed to the function expectingbyte (Error 5 fixed)
	if!VerifyDojahSignature(rawBody, receivedSignature) { 
		log.Println("Security Check 2 (HMAC) Failed: Invalid HMAC signature computed.")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized: Invalid Signature"})
		return
	}
	log.Println("Security Check 2 (HMAC Signature) verification successful.")

	// Step 4: JSON Parsing and Execution
	var payload DojahWebhookPayload
	if err := json.Unmarshal(rawBody, &payload); err!= nil {
		log.Printf("Parsing Error: Failed to unmarshal payload: %v", err)
		// Return 200 OK regardless of parsing error to prevent Dojah retries
		c.Status(http.StatusOK) 
		return
	}

	// Step 5: Execute Business Logic
	if err := handleVerificationUpdate(payload); err!= nil {
		log.Printf("Internal Processing Failure for ReferenceID %s: %v", payload.ReferenceID, err)
	}

	// Acknowledge receipt to Dojah (Crucial for preventing retries)
	c.Status(http.StatusOK)
}
