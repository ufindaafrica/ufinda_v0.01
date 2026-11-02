package paymentdb
import (
	"fmt"
	"log"
	"github.com/oladev/ufinda_v0.01/internal/db"
	"net/http"
	"io"
	"encoding/json"
	"net/url"
)

type BookingFeeRecord struct {
    IsPaid bool `json:"is_paid"`
}

func ActivateBookingFee(data db.BookingFee) error {
	url := fmt.Sprintf("/rest/v1/booking_fee?on_conflict=reference")

	// Set Supabase header to handle upsert (merge duplicates based on unique/primary constraint like email)
	headers := map[string]string{
		"Prefer": "resolution=merge-duplicates",
	}

	resp, err := db.MakeDBRequest("POST", url, data, headers)
	if err != nil {
		log.Printf("[CRITICAL] DB Error [BOOKING_FEE]: %v", err)
		return fmt.Errorf("error connecting to db")
	}
	defer resp.Body.Close()

	// Supabase returns 201 Created on insert, or 200 OK / 204 No Content on update/merge
	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		bodyBytes, _ := io.ReadAll(resp.Body)
		bodyString := string(bodyBytes)
		log.Printf("[CRITICAL_BOOKING_FEE_CREATE_ERR] failed to create/update booking fee. Status: %d, Response Body: %s", resp.StatusCode, bodyString)
		return fmt.Errorf("failed to process booking fee")
	}

	return nil
}


func IsPaidBookingFee(email string) (bool, error) {
    url := fmt.Sprintf("/rest/v1/booking_fee?select=is_paid&email=eq.%s", url.QueryEscape(email))

    resp, err := db.MakeDBRequest("GET", url, nil, nil)
    if err != nil {
        return false, fmt.Errorf("error making DB request to find booking fee status: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
		return false, fmt.Errorf("unexpected database response status: %d", resp.StatusCode)
	}

    var records []BookingFeeRecord
    if err:= json.NewDecoder(resp.Body).Decode(&records); err != nil {
		return false, fmt.Errorf("error decoding booking fee response: %w", err)
	}

    if len(records) == 0 {
        return false, nil
    }

    return records[0].IsPaid, nil
}

// GetAgentFreeQuotaLeft calculates remaining free quota (Max: 10) using the passed user object
func GetAgentFreeQuotaLeft(user db.User) (int, error) {
	const maxFreeQuota = 10

	var hostelEndpoint string
	if user.IsBetaUser {
		// Beta user: count only hostels created from the hardcoded date of today onwards
		const todayStart = "2026-11-01T00:00:00Z"
		hostelEndpoint = fmt.Sprintf("/rest/v1/hostels?vendor_id=eq.%s&created_at=gte.%s&select=id", user.ID, todayStart)
	} else {
		// Non-beta user: count total hostels for that user
		hostelEndpoint = fmt.Sprintf("/rest/v1/hostels?vendor_id=eq.%s&select=id", user.ID)
	}

	// Make request to the hostels table
	resp, err := db.MakeDBRequest("GET", hostelEndpoint, nil, nil)
	if err != nil {
		return 0, fmt.Errorf("failed to fetch hostels: %v", err)
	}
	defer resp.Body.Close()

	// Check if PostgREST returned an error status code and read the error body
	if resp.StatusCode != http.StatusOK {
		errorBytes, _ := io.ReadAll(resp.Body)
		return 0, fmt.Errorf("database returned error status %d: %s", resp.StatusCode, string(errorBytes))
	}

	// Decode into a slice of maps to safely handle any valid JSON array response
	var hostels []db.Hostel
	if err := json.NewDecoder(resp.Body).Decode(&hostels); err != nil {
		return 0, fmt.Errorf("failed to parse hostels response: %v", err)
	}
	log.Printf("this is for me: %v", hostels)

	currentCount := len(hostels)

	// Calculate quota left
	quotaLeft := maxFreeQuota - currentCount
	if quotaLeft < 0 {
		quotaLeft = 0
	}

	return quotaLeft, nil
}

// AgentHasUnusedListingFee checks if the agent has any unused listing fees
func AgentHasUnusedListingFee(userID string) (bool, error) {
	endpoint := fmt.Sprintf("/rest/v1/listing_fee?vendor_id=eq.%s&is_used=eq.false&select=id", url.QueryEscape(userID))

	resp, err := db.MakeDBRequest("GET", endpoint, nil, nil)
	if err != nil {
		return false, fmt.Errorf("failed to check listing fees: %v", err)
	}
	defer resp.Body.Close()

	// Check if PostgREST returned an error status code
	if resp.StatusCode != http.StatusOK  {
		errorBytes, _ := io.ReadAll(resp.Body)
		return false, fmt.Errorf("database returned error status %d: %s", resp.StatusCode, string(errorBytes))
	}

	var fees []db.ListingFee
	if err := json.NewDecoder(resp.Body).Decode(&fees); err != nil {
		return false, fmt.Errorf("failed to parse listing fees response: %v", err)
	}

	return len(fees) > 0, nil
}

func CreateListingFeeRecord(data db.ListingFee) error {
	url := fmt.Sprintf("/rest/v1/listing_fee?on_conflict=reference")
	header := map[string]string{
		"Prefer": "resolution=merge-duplicates",
	}
	resp, err := db.MakeDBRequest("POST", url, data, header)
	if err != nil {
		log.Printf("[ERROR_POST_REQ_DB_LISTING_FEE] error connecting to db to create listing fee: %v", err)
		return fmt.Errorf("error connecting to db")	
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		bodyBytes, _ := io.ReadAll(resp.Body)
		bodyString := string(bodyBytes)
		log.Printf("[CRITICAL_LISTING_FEE_CREATE_ERR] failed to create/update listing fee. Status: %d, Response Body: %s", resp.StatusCode, bodyString)
		return fmt.Errorf("failed to process booking fee")
	}

	return nil
}