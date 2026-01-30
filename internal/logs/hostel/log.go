package hostellog

import (
	"log"
	"github.com/oladev/ufinda_v0.01/internal/db"
	doLog"github.com/oladev/ufinda_v0.01/internal/logs"
)


func LogHostel(userID string, reason error) {
	newLog := db.HostelLog{
		VendorID: userID,
		Reason: reason.Error(),
	}
	if err := doLog.CreateLog(newLog, "/rest/v1/hostel_log"); err != nil {
        // In a real application, you'd log this logging failure to a different system (e.g., stdout/stderr, an external log aggregator)
        log.Printf("[CRITICAL]: Failed to create hostel log for user %s: %v. Original reason: %s\n", userID, err, reason.Error())
    }
	return
}

