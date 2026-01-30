package authlog

import (
	"log"
	"fmt"
	"github.com/oladev/ufinda_v0.01/internal/db"
	doLog"github.com/oladev/ufinda_v0.01/internal/logs"
)

type LogEntry struct {
	Message string
	Level   string
}

var Logs = map[string]LogEntry{
	"1": {
		Message: "refresh token reused: %s",
		Level:   "warn",
	},
	"2": {
		Message: "user not set in context (possible middleware bypass)",
		Level:   "warn",
	},
	"3": {
		Message: "unauthorized access attempt: %s",
		Level:   "critical",
	},
	"4": {
		Message: "token expired or invalid",
		Level:   "critical",
	},
}

func SecurityLog(securitylog db.SecurityLog) {
	url := fmt.Sprintf("/rest/v1/security_log")

	if err := doLog.CreateLog(securitylog, url); err != nil {
		log.Printf("[CRITICAL]: Failed to create Security failure log: %v.", err)
	}
}

func LogAuth(userID string, reason error) {
	url := fmt.Sprintf("/rest/v1/auth_log")
	newLog := db.AuthLog{
		UserID: userID,
		Reason: reason.Error(),
	}

	
	if err := doLog.CreateLog(newLog, url); err != nil {
		log.Printf("[CRITICAL] Failed to create Auth failure log for user %s: %v. Original reason: %s\n", userID, err, reason.Error())
	}
}