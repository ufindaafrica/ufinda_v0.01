package metricsdb
import (
	"github.com/oladev/ufinda_v0.01/internal/db"
	"fmt"
	"net/http"
	"io"
	"net/url"
	"strconv"
	"encoding/json"
	"strings"
	"errors"
	"log"
)
var ErrDuplicateRating = errors.New("You have already submitted a rating for this vendor.")
var ErrDuplicateProfileView = errors.New("View already set for user.")

type GetRating struct {
	CurrentRating float64 `json:"current_rating"`
	TotalRating int `json:"total_ratings"`
}


func SetRating (rating db.Rating) error {
	resp, err := db.MakeDBRequest("POST", "/rest/v1/vendor_ratings", rating, nil)
	if err != nil {
		return fmt.Errorf("failed to make request")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
        bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("DB API Error: Status %d. Response: %s", resp.StatusCode, string(bodyBytes))
        
        if strings.Contains(string(bodyBytes), "unique constraint") {
            return ErrDuplicateRating
        }

		return fmt.Errorf("Database failed to save rating.")
	}

	return nil
}

func SetProfileView(userID string, vendorID string) error {
	if userID == "" || vendorID == "" {
		return fmt.Errorf("vendor_id or user_id must not be empty")
	}
	data := db.ProfileView{
		UserID: userID,
		VendorID: vendorID,
	}

	resp, err := db.MakeDBRequest("POST", "/rest/v1/profile_views", data, nil)
	if err != nil {
		return fmt.Errorf("failed to make request")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
        bodyBytes, _ := io.ReadAll(resp.Body)

        if strings.Contains(string(bodyBytes), "unique constraint") {
            return ErrDuplicateProfileView
        }

		return fmt.Errorf("Database failed to save view.")
	}

	return nil
}

func GetProfileViews(userID string) (int, error) {
    if userID == "" {
        return 0, fmt.Errorf("user_id not parsed")
    }

    endpoint := fmt.Sprintf("/rest/v1/profile_views?vendor_id=eq.%s&select=id", url.QueryEscape(userID))

    headers := map[string]string{
        "Prefer": "count=exact",
    }

    resp, err := db.MakeDBRequest("GET", endpoint, nil, headers)
    if err != nil {
        return 0, fmt.Errorf("failed to get profile views: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        bodyBytes, _ := io.ReadAll(resp.Body)
        return 0, fmt.Errorf("failed to get profile views: status %d, response: %s", resp.StatusCode, string(bodyBytes))
    }

    contentRange := resp.Header.Get("Content-Range")
    if contentRange != "" {
        parts := strings.Split(contentRange, "/")
        if len(parts) > 1 {
            count, err := strconv.Atoi(parts[1])
            if err == nil {
                return count, nil
            }
        }
    }

    var results []interface{}
    if err := json.NewDecoder(resp.Body).Decode(&results); err != nil {
        return 0, fmt.Errorf("failed to decode profile views: %w", err)
    }

    return len(results), nil
}

func GetVendorRating(vendorID string) (*GetRating, error) {
    if vendorID == "" {
        return nil, fmt.Errorf("vendor_id not parsed")
    }

    endpoint := fmt.Sprintf("/rest/v1/vendor_metrics?user_id=eq.%s&select=current_rating,total_ratings", url.QueryEscape(vendorID))
    
    resp, err := db.MakeDBRequest("GET", endpoint, nil, nil)
    if err != nil {
        return nil, fmt.Errorf("failed to get rating: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        bodyBytes, _ := io.ReadAll(resp.Body)
        return nil, fmt.Errorf("failed to get rating: status %d, response: %s", resp.StatusCode, string(bodyBytes))
    }

    var result []GetRating
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, fmt.Errorf("failed to decode rating: %w", err)
    }

    if len(result) == 0 {
        return &GetRating{CurrentRating: 0.0, TotalRating: 0}, nil
    }

    return &result[0], nil
}
