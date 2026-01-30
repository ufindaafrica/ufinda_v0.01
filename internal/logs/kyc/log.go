package kyclog

import (
    "log"
	"github.com/oladev/ufinda_v0.01/internal/db"
	doLog"github.com/oladev/ufinda_v0.01/internal/logs"
)


// Helper function to log KYC failures, ensuring the log creation itself doesn't cause a fatal error.
func LogKYC(userID string, reason error) {
    newLog := db.KycLog {
        UserID: userID,
        Reason: reason.Error(),
    }
    // Attempt to create the log, but don't halt the main handler if this fails
    if err := doLog.CreateLog(newLog, "/rest/v1/kyc_log"); err != nil {
        // In a real application, you'd log this logging failure to a different system (e.g., stdout/stderr, an external log aggregator)
        log.Printf("[CRITICAL]: Failed to create KYC log for user %s: %v. Original reason: %s\n", userID, err, reason.Error())
    }
}