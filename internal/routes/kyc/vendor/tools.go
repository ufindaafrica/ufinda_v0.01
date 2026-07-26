package vendorkyc

import (
	"github.com/oladev/ufinda_v0.01/internal/db"
	"github.com/oladev/ufinda_v0.01/internal/sockets/kyc"
	"github.com/oladev/ufinda_v0.01/internal/db/auth"
	"github.com/oladev/ufinda_v0.01/internal/db/kyc/vendor"
    "github.com/oladev/ufinda_v0.01/internal/db/notification"
    "github.com/oladev/ufinda_v0.01/internal/token"
	"log"
    "strings"
	"errors"
    "fmt"
)


const MsgServerError = "An unexpected error occurred. Please try again."

type updateVendorRequest struct {
    UserName *string   `json:"username"`
    Address *string     `json:"residence_address"`
    ProfileImg *db.UploadedFile   `json:"profile_img"`
}

type VendorKYCRequest struct {
    Address    *string          `json:"residence_address"`
    AboutMe    *string          `json:"about_me"`
    ProfileImg *db.UploadedFile `json:"profile_img"`
}

type VerificationResult struct {
	UserID             string    `json:"user_id"`
	NIN         string    `json:"nin_from_db"`  
    Message            string          `json:"message"`
	Status             string    `json:"verification_status"`
	VerificationMode   string    `json:"verification_mode"`
	VerificationLink   string    `json:"verification_url"`
	FirstName          string    `json:"first_name"`
	LastName           string    `json:"last_name"`
    ResidenceAddress   string  `json:"residence_AddressLine1"`
    ResidenceLGA       string     `json:"residence_lga"`
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
		UserID: payload.ReferenceID,
		NIN: entity.NIN,
        Message: payload.Message,
		Status: payload.VerificationStatus,
		VerificationMode: payload.VerificationMode,
		VerificationLink: payload.VerificationURL,
		FirstName: entity.FirstName,
		LastName: entity.LastName,
        ResidenceLGA: entity.ResidenceLGA,
		Gender: entity.Gender,
		DateOfBirth: entity.DateOfBirth,
		BirthState: entity.BirthState,
		BirthCountry: entity.BirthCountry,
        ResidenceAddress: entity.ResidenceAddress,
		ResidenceState: entity.ResidenceState,
		StateOfCall: payload.Metadata.IpInfo.StateOfCall,
		CountryOfCall: payload.Metadata.IpInfo.CountryOfCall,
	}
}

func HandleVerificationPayload(payload db.DojahWebhookPayload, h *hub.Hub) {
	// 1. Process and extract data
	result := handleVerificationUpdate(payload)

	finalStatus := "FAILED"
	message := "Verification incomplete or failed internal checks."

	userLookupErr := false
	var getUser *db.User
	var err error

	log.Printf("Processing KYC webhook for user_id: %s", result.UserID)

	getUser, err = authdb.FindCreatedUserByID(result.UserID)
	if err != nil {
		if errors.Is(err, authdb.ErrUserNotFound) {
			log.Printf("KYC_WARNING: User %s not found in internal DB.", result.UserID)
			finalStatus = "FAILED_USER_ID"
			message = "Verification failed: User account ID not found"
			userLookupErr = true
		} else {
			log.Printf("FATAL_SYSTEM_ERROR: Failed to retrieve user %s: %v", result.UserID, err)
			finalStatus = "SYSTEM_ERROR"
			message = "Internal error during user validation. Please contact support."
			userLookupErr = true
		}
	}

	// Normalize status checks using strings.EqualFold (Case-insensitive)
	isDojahCompleted := strings.EqualFold(result.Status, "Completed")
	isDojahPending := strings.EqualFold(result.Status, "Pending")

	// --- 2. Custom Business Checks ---
	if !userLookupErr && isDojahCompleted {
		// Clean and normalize strings for name matching
		dbFirstName := strings.ToUpper(strings.TrimSpace(getUser.FirstName))
		dbLastName := strings.ToUpper(strings.TrimSpace(getUser.LastName))
		dojahFirstName := strings.ToUpper(strings.TrimSpace(result.FirstName))
		dojahLastName := strings.ToUpper(strings.TrimSpace(result.LastName))

		// Check standard order or swapped order
		isNameValid := (dbFirstName == dojahFirstName && dbLastName == dojahLastName) ||
			(dbFirstName == dojahLastName && dbLastName == dojahFirstName)

		if isNameValid {
			finalStatus = "SUCCESS"
			message = "User KYC successfully verified."
		} else {
			log.Printf("KYC_MISMATCH: Name mismatch for User %s. DB: [%s %s] vs Dojah: [%s %s]",
				result.UserID, dbFirstName, dbLastName, dojahFirstName, dojahLastName)
			finalStatus = "PENDING_MANUAL_REVIEW"
			message = "Verification is currently pending review due to name mismatch."
		}
	} else if isDojahPending {
		// Catches "pending", "Pending", or "PENDING" status directly from Dojah
		finalStatus = "PENDING_MANUAL_REVIEW"
		message = fmt.Sprintf("Verification is currently pending review due to %s.", result.Message)
	}

	// --- 3. Prepare and Save Final Status to Database ---
	kycdata := db.VendorKYC{
		UserID:            result.UserID,
		Status:            finalStatus,
		NIN:               result.NIN,
		VerificationMode:  result.VerificationMode,
		VerificationLink:  result.VerificationLink,
		Gender:            result.Gender,
		DOB:               result.DateOfBirth,
		StateOfOrigin:     result.BirthState,
		ResidenceLGA:      result.ResidenceLGA,
		ResidenceAddress2: result.ResidenceAddress,
		Nationality:       result.BirthCountry,
		StateOfResidence:  result.ResidenceState,
	}

    kycdata.IsVerified = (finalStatus == "SUCCESS")

	log.Printf("DB ACTION: Saving final status for User %s: %s", result.UserID, finalStatus)

	_, findErr := vendorkycdb.FindVendorKYC(result.UserID)

	if findErr != nil && errors.Is(findErr, vendorkycdb.ErrKYCNotFound) {
		if createErr := vendorkycdb.CreateVendorKyc(kycdata); createErr != nil {
			log.Printf("FATAL_DB_ERROR: Failed to CREATE new KYC record for User %s: %v", result.UserID, createErr)
			finalStatus = "SYSTEM_ERROR"
			message = "An unexpected issue occurred while processing your verification. Our support team has been notified and is looking into it."
		}
	} else if findErr == nil {
		if updateErr := vendorkycdb.UpdateVendorKyc(result.UserID, kycdata); updateErr != nil {
			log.Printf("FATAL_DB_ERROR: Failed to UPDATE existing KYC record for User %s: %v", result.UserID, updateErr)
			finalStatus = "SYSTEM_ERROR"
			message = "An unexpected issue occurred while processing your verification. Our support team has been notified and is looking into it."
		}
	} else {
		log.Printf("FATAL_DB_ERROR: Failed critical KYC lookup for User %s: %v", result.UserID, findErr)
		finalStatus = "SYSTEM_ERROR"
		message = "An unexpected issue occurred while processing your verification. Our support team has been notified and is looking into it."
	}

    // --- Trigger Support Email for Manual Review or System Errors ---
	if finalStatus == "PENDING_MANUAL_REVIEW" || finalStatus == "SYSTEM_ERROR" {
		go func(uid string, u *db.User, status string, msg string) {
			userEmail := "N/A"
			fullName := "Unknown User"

			if u != nil {
				userEmail = u.Email
				fullName = fmt.Sprintf("%s %s", u.LastName, u.FirstName)
			}

			if err := token.SendKYCSupportAlertEmail(uid, userEmail, fullName, status, msg); err != nil {
				log.Printf("EMAIL_ERROR: Failed to alert support for %s on user %s: %v", status, uid, err)
			} else {
				log.Printf("EMAIL_SUCCESS: Support team alerted via email for %s on user %s", status, uid)
			}
		}(result.UserID, getUser, finalStatus, message)
	}

	// --- 4. Push via WebSocket ---
	update := hub.KYCStatusUpdate{
		UserID:      result.UserID,
		FinalStatus: finalStatus,
		Message:     message,
	}

	h.SendUpdateToUser(result.UserID, update)

   // --- 5. Push Notifications ---
	// Fetch device push tokens for the user
	deviceTokens, err := notifdb.GetPushTokens(result.UserID)
	if err != nil {
		log.Printf("NOTIF_ERROR: Failed to retrieve push tokens for user %s: %v", result.UserID, err)
		return
	}

	if len(deviceTokens) == 0 {
		log.Printf("NOTIF_INFO: No registered push tokens for user %s", result.UserID)
		return
	}

	// Prepare notification content based on the final status
	var title, body string

	switch finalStatus {
	case "SUCCESS":
		title = "Verification Approved 🎉"
		body = "Your identity verification is complete. You can now publish listings!"

	case "PENDING_MANUAL_REVIEW":
		title = "Verification Under Review ⏳"
		body = "Your details require a quick manual check. We'll notify you as soon as the review is complete."

	case "FAILED", "FAILED_USER_ID":
		title = "Verification Unsuccessful ❌"
		body = "We couldn't verify your details. Please check your submitted information or try again."

	case "DUPLICATE_ID":
		title = "Verification Issue ⚠️"
		body = "This identity document is already linked to another account. Contact support if you need assistance."

	default:
		// Skip pushing alerts for internal system/database errors
		log.Printf("NOTIF_SKIP: Skipping push notification for status: %s", finalStatus)
		return
	}

	// Send to all registered devices for this user
	for _, token := range deviceTokens {
		// Pass "" for chatID since this is a platform status notification
		if err := notifdb.SendPushNotification(token.DeviceToken, title, body, ""); err != nil {
			log.Printf("NOTIF_ERROR: Failed to dispatch push notification to token %s: %v", token, err)
		}
	}
}