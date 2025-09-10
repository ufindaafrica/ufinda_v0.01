package hostellog

import (
	"fmt"
	"net/http"
	// "github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"log"
	"io"
	"github.com/oladev/ufinda_v0.01/internal/db"
)


func createLog(log db.HostelLogs) error {
	url := fmt.Sprintf("/rest/v1/hostel_logs")

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

func LogAndRespond(userID uuid.UUID, status int, logMsg string, err error) {
	logLevel := "high" // default to high
	if status == http.StatusBadRequest {
		logLevel = "low"
	}
	
	newLog := db.HostelLogs{
		UserID: userID,
		Log:    fmt.Sprintf("%s: %v", logMsg, err),
		Level:  logLevel,
	}

	newLog.ID = uuid.New()
	if err := createLog(newLog); err != nil {
		log.Printf("Failed to create log: %v", err)
	}
	return
}

func LogWorkerProcess(userID uuid.UUID, status string, logMsg string, err error) {
	newLog := db.HostelLogs{
		UserID: userID,
		Log:    fmt.Sprintf("%s: %v", logMsg, err),
		Level:  status,
	}

	newLog.ID = uuid.New()
	if err := createLog(newLog); err != nil {
		log.Printf("Failed to create log: %v", err)
	}
	return
}
