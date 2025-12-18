package authlog

import (
	"fmt"
	"os"
	"github.com/oladev/ufinda_v0.01/internal/db"
	"github.com/oladev/ufinda_v0.01/internal/logs"
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

func SecurityLog(securitylog db.SecurityLog) {
	url := fmt.Sprintf("/rest/v1/security_log")

	if err := log.CreateLog(securitylog, url); err != nil {
		fmt.Fprintf(os.Stderr, "CRITICAL: Failed to create Security failure log: %v.", err)
	}
}

func LogAuth(userID string, reason error) {
	url := fmt.Sprintf("/rest/v1/auth_log")
	newLog := db.AuthLog{
		UserID: userID,
		Reason: reason.Error(),
	}

	
	if err := log.CreateLog(newLog, url); err != nil {
		fmt.Fprintf(os.Stderr, "CRITICAL: Failed to create Auth failure log for user %s: %v. Original reason: %s\n", userID, err, reason.Error())
	}
}