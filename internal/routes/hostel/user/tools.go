package userhostel

import (
	"github.com/oladev/ufinda_v0.01/internal/db"
    "encoding/json"
    "net/url"
    "fmt"
    "net/http"
    "io"
    "github.com/oladev/ufinda_v0.01/internal/db/hostel"
)

const DefaultPageSize = 10
const MsgServerError = "An unexpected error occurred. Please try again."
// db/models.go (or similar)

// Function to make an enriched request that returns []EnrichedHostel
func makeEnrichedHostelRequest(method, baseURL, params string) ([]db.EnrichedHostel, error) {
    fullParams, err := url.ParseQuery(params)
    if err != nil {
        return nil, fmt.Errorf("invalid query params: %w", err)
    }
    
    fullParams.Set("select", hosteldb.GetEnrichedSelectQuery())

    // 2. Execute Request
    finalURL := fmt.Sprintf("%s?%s", baseURL, fullParams.Encode())
    resp, err := db.MakeDBRequest(method, finalURL, nil, nil)
    if err != nil {
        return nil, fmt.Errorf("failed to connect to database API: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        bodyBytes, _ := io.ReadAll(resp.Body)
        return nil, fmt.Errorf("database retrieval failed (status %d): %s", resp.StatusCode, string(bodyBytes))
    }

    var enrichedHostels []db.EnrichedHostel
    if err := json.NewDecoder(resp.Body).Decode(&enrichedHostels); err != nil {
        return nil, fmt.Errorf("failed to decode response: %w", err)
    }

    return enrichedHostels, nil
}