package vendorkyc

import (
	"github.com/oladev/ufinda_v0.01/internal/db"
	"github.com/oladev/ufinda_v0.01/internal/sockets/kyc"
	"github.com/oladev/ufinda_v0.01/internal/db/auth"
	// "github.com/oladev/ufinda_v0.01/internal/logs/auth"
	"github.com/oladev/ufinda_v0.01/internal/db/kyc/vendor"
	"log"
	"errors"
	// "strings"
	"github.com/google/uuid"
	// "net/http"
)






// top level


type VerificationResult struct {
	UserID             string    `json:"user_id"`
	NIN         string    `json:"nin_from_db"`   // The NIN from the government record (from entity)
	Status             string    `json:"verification_status"`
	VerificationMode   string    `json:"verification_mode"`
	VerificationLink   string    `json:"verification_url"`
	FirstName          string    `json:"first_name"`
	LastName           string    `json:"last_name"`
	Gender             string    `json:"gender"`
	DateOfBirth        string    `json:"date_of_birth"`
	BirthState         string    `json:"birth_state"`
	BirthCountry       string    `json:"birth_country"`
	ResidenceState     string    `json:"residence_state"`
	StateOfCall string
	CountryOfCall string
}

func handleVerificationUpdate(payload db.DojahWebhookPayload) VerificationResult {
	entity := payload.Data.GovernmentData.Data.NIN.Entity

	// return the needed payload
	return VerificationResult {
		UserID: payload.Metadata.UserID,
		NIN: entity.NIN,
		Status: payload.VerificationStatus,
		VerificationMode: payload.VerificationMode,
		VerificationLink: payload.VerificationURL,
		FirstName: entity.FirstName,
		LastName: entity.LastName,
		Gender: entity.Gender,
		DateOfBirth: entity.DateOfBirth,
		BirthState: entity.BirthState,
		BirthCountry: entity.BirthCountry,
		ResidenceState: entity.ResidenceState,
		StateOfCall: payload.Metadata.IpInfo.StateOfCall,
		CountryOfCall: payload.Metadata.IpInfo.CountryOfCall,
	}
}

func HandleVerificationPayload(payload db.DojahWebhookPayload, h *hub.Hub) {
    // 1. Process and extract data
    result := handleVerificationUpdate(payload) 

    // Use consistent, uppercase status names for clarity
    finalStatus := "FAILED"
    message := "Verification incomplete or failed internal checks."

    userLookupErr := false
	var getUser *db.User
	var err error
    // Assume result.UserID holds the ID used to register the user initially
    getUser, err = authdb.FindCreatedUserByID(result.UserID) 
    if err != nil {
        if errors.Is(err, authdb.ErrorUserNotFound) {
            log.Printf("KYC_WARNING: User %s not found in internal DB. Cannot perform name match.", result.UserID)
            // Cannot confirm identity, so fail or pend. We default to FAILED_USER_ID.
            finalStatus = "FAILED_USER_ID"
            message = "Verification failed: User account ID not found or linked incorrectly."
            userLookupErr = true
        } else {
            // CRITICAL: Any other DB error during user retrieval is a system failure
            log.Printf("FATAL_SYSTEM_ERROR: Failed to retrieve user %s for KYC validation: %v", result.UserID, err)
            finalStatus = "SYSTEM_ERROR"
            message = "Internal error during user validation. Please contact support."
            userLookupErr = true
        }
    }


    // --- 2. Custom Business Checks (Only if webhook completed and user retrieved) ---
    if !userLookupErr && result.Status == "Completed" {
        isNameValid := getUser.FirstName == result.FirstName && getUser.LastName == result.LastName
        // Note: Use StateOfResidence for consistent checking unless you specifically need StateOfCall
        // IsVerifiedResidence := strings.ToLower(result.ResidenceState) == "osun" || strings.ToLower(result.CountryOfCall) == "nigeria" || strings.ToLower(result.StateOfCall) == "osun"
        
        if isNameValid {
            finalStatus = "SUCCESS"
            message = "User KYC successfully verified."
        } else {
            // Set to PENDING if business logic determines manual review is required
            finalStatus = "PENDING_MANUAL_REVIEW"
            message = "Verification requires manual review. Please contact support to complete your KYC."
        }
    }


    // --- 3. Prepare and Save Final Status to Database ---
    
    // Prepare the final data structure (MUST include the determined finalStatus)
    kycdata := db.VendorKYC {
        ID:               uuid.New(),
        UserID:           result.UserID,
        Status:           finalStatus,
        NIN:              result.NIN,
        VerificationMode: result.VerificationMode,
        VerificationLink: result.VerificationLink,
        Gender:           result.Gender,
        DOB:              result.DateOfBirth,
        StateOfOrigin:    result.BirthState,
        Nationality:      result.BirthCountry,
        StateOfResidence: result.ResidenceState,
    }

    log.Printf("DB ACTION: Saving final status for User %s: %s", result.UserID, finalStatus)
    
    // Try to find the existing KYC record
    _, findErr := vendorkycdb.FindVendorKYC(result.UserID)

    if findErr != nil && errors.Is(findErr, vendorkycdb.ErrorKYCNotFound) {
        // Record does NOT exist -> CREATE new one
        if createErr := vendorkycdb.CreateVendorKyc(kycdata); createErr != nil {
            log.Printf("FATAL_DB_ERROR: Failed to CREATE new KYC record for User %s: %v", result.UserID, createErr)
            // Override status for push: System failure during DB write
            finalStatus = "SYSTEM_ERROR" 
            message = "KYC result determined but failed to save to database. Contact support."
        }
    } else if findErr == nil {
        // Record EXISTS -> UPDATE existing one
        // You must call a dedicated update function that uses the UserID to find and replace data
        if updateErr := vendorkycdb.UpdateVendorKyc(result.UserID, kycdata); updateErr != nil {
            log.Printf("FATAL_DB_ERROR: Failed to UPDATE existing KYC record for User %s: %v", result.UserID, updateErr)
            // Override status for push: System failure during DB write
            finalStatus = "SYSTEM_ERROR"
            message = "KYC result determined but failed to update database record. Contact support."
        }
    } else {
        // Critical DB error on lookup (not just 'Not Found')
        log.Printf("FATAL_DB_ERROR: Failed critical KYC lookup for User %s: %v", result.UserID, findErr)
        finalStatus = "SYSTEM_ERROR"
        message = "KYC result determined but failed due to critical database error. Contact support."
    }

    // 4. PUSH FINAL STATUS VIA WEBSOCKET (Guaranteed delivery to un-stick the client)
    update := hub.KYCStatusUpdate{
        UserID:      result.UserID,
        FinalStatus: finalStatus, // Will contain SUCCESS, PENDING_MANUAL_REVIEW, or SYSTEM_ERROR
        Message:     message,
    }
    
    h.SendUpdateToUser(result.UserID, update)
}