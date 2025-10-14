package hostellog

import (
	"fmt"
	"os"
	"github.com/google/uuid"
	"github.com/oladev/ufinda_v0.01/internal/db"
	"github.com/oladev/ufinda_v0.01/internal/logs"
)


func LogHostel(userID string, hostelID *string, reason error) {
	newLog := db.HostelLog{
		ID: uuid.New(),
		UserID: userID,
		HostelID: hostelID,
		Reason: reason.Error(),
	}
	if err := log.CreateLog(newLog, "/rest/v1/hostel_log"); err != nil {
        // In a real application, you'd log this logging failure to a different system (e.g., stdout/stderr, an external log aggregator)
        fmt.Fprintf(os.Stderr, "CRITICAL: Failed to create hostel log for user %s: %v. Original reason: %s\n", userID, err, reason.Error())
    }
	return
}

