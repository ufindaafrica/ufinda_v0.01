package authlog

import (
	"fmt"
	"net/http"
	"io"
	"github.com/oladev/ufinda_v0.01/internal/db"
)

type LogEntry struct {
	Message string
	Level   string
}

var Logs = map[string]LogEntry{
	"1": {
		Message: "refresh token reused: %s",
		Level:   "critical",
	},
	"2": {
		Message: "user not set in context (possible middleware bypass)",
		Level:   "critical",
	},
	"3": {
		Message: "unauthorized access attempt: %s",
		Level:   "high",
	},
	"4": {
		Message: "invalid token",
		Level:   "high",
	},
}

func CreateLog(log db.SecurityLog) error {
	url := fmt.Sprintf("/rest/v1/security_logs")

	resp, err := db.MakeDBRequest("POST", url, log, nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		// Read the body to get the server's specific error
		bodyBytes, readErr := io.ReadAll(resp.Body)
		if readErr != nil {
			// If we can't even read the body, return a more informative error
			return fmt.Errorf("failed to create log with status %d, and couldn't read response body: %w", resp.StatusCode, readErr)
		}

		// Convert the body to a string for the error message
		bodyString := string(bodyBytes)
		
		// Return a comprehensive error that includes the status code and the server's message
		return fmt.Errorf("failed to create log: server responded with status %d and body: %s", resp.StatusCode, bodyString)
	}

	return nil
}
