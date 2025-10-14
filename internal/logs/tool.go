package log

import (
	"github.com/oladev/ufinda_v0.01/internal/db"
	"io"
	"net/http"
	"fmt"
)

func CreateLog(log interface{}, endpoint string) error {
	resp, err := db.MakeDBRequest("POST", endpoint, log, nil)
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