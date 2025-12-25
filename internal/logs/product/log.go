package productlog

import (
	"fmt"
	"os"
	"github.com/oladev/ufinda_v0.01/internal/db"
	"github.com/oladev/ufinda_v0.01/internal/logs"
)


func LogProduct(userID string, productID *string, reason error) {
	newLog := db.ProductLog{
		VendorID: userID,
		ProductID: productID,
		Reason: reason.Error(),
	}
	if err := log.CreateLog(newLog, "/rest/v1/product_log"); err != nil {
        // In a real application, you'd log this logging failure to a different system (e.g., stdout/stderr, an external log aggregator)
        fmt.Fprintf(os.Stderr, "CRITICAL: Failed to create product log for user %s: %v. Original reason: %s\n", userID, err, reason.Error())
    }
	return
}

