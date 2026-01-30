package metricslog

import (
	"github.com/oladev/ufinda_v0.01/internal/db"
	"log"
	doLog"github.com/oladev/ufinda_v0.01/internal/logs"
)


func LogMetric(userID string, reason error) {
	newLog := db.MetricLog{
		UserID: userID,
		Reason: reason.Error(),
	}
	if err := doLog.CreateLog(newLog, "/rest/v1/metrics_log"); err != nil {
        log.Printf("[CRITICAL]: Failed to create metric log for user %s: %v. Original reason: %s\n", userID, err, reason.Error())
    }
	return
}

