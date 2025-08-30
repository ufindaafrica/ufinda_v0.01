package authlog

import (
	"fmt"
	"uFinda/internal/db"
	"net/http"
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
		Level: "high",
	},
	"4": {
		Message: "invalid token: %s",
		Level: "high",
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
		return fmt.Errorf("failed to create log")
	}
	return nil
}