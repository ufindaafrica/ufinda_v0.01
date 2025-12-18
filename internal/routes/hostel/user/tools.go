package userhostel

import (
	"github.com/oladev/ufinda_v0.01/internal/db"
    "log"
    "encoding/json"
    "net/url"
    "fmt"
    "net/http"
    "bytes"
    "io"
    "github.com/oladev/ufinda_v0.01/internal/db/hostel"
)

const DefaultPageSize = 20

// db/models.go (or similar)

// Function to make an enriched request that returns []EnrichedHostel
func makeEnrichedHostelRequest(method, baseURL, params string) ([]db.EnrichedHostel, error) {
    // 1. Add the enriched SELECT query to the parameters
    fullParams := url.Values{}
    if params != "" {
        fullParams, _ = url.ParseQuery(params) // Start with existing parameters
    }
    fullParams.Set("select", hosteldb.GetEnrichedSelectQuery())

    finalURL := fmt.Sprintf("%s?%s", baseURL, fullParams.Encode())

    resp, err := db.MakeDBRequest(method, finalURL, nil, nil)
    if err != nil {
        return nil, fmt.Errorf("failed to connect to database API: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        bodyBytes, _ := io.ReadAll(resp.Body)
        log.Printf("DB API Error: Status %d for URL %s. Response: %s", resp.StatusCode, finalURL, string(bodyBytes))
        return nil, fmt.Errorf("database retrieval failed with status %d", resp.StatusCode)
    }

    // Add this inside makeEnrichedHostelRequest
    bodyBytes, _ := io.ReadAll(resp.Body)
    log.Printf("RAW RESPONSE: %s", string(bodyBytes)) // CHECK THIS LOG

    // After logging, you have to create a new reader because Body is drained
    resp.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

    var enrichedHostels []db.EnrichedHostel
    if err := json.NewDecoder(resp.Body).Decode(&enrichedHostels); err != nil {
        log.Printf("DECODE ERROR: %v", err)
        return nil, err
    }
    return enrichedHostels, nil
}