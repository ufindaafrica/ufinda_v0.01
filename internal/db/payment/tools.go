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
	url := fmt.Sprintf("/rest/v1/booking_fee?on_conflict=email")

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