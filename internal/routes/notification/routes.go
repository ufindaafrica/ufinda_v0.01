package notif
import (
	"github.com/oladev/ufinda_v0.01/internal/db"
	"github.com/gin-gonic/gin"
	"log"
	"net/http"
	"github.com/oladev/ufinda_v0.01/internal/db/notification"
)

func RegisterDeviceTokenHandler(c *gin.Context) {
	id := c.GetString("id")

	var req pushTokenReq
	if err := c.ShouldBindJSON(&req); err != nil {
		log.Printf("[ERROR] failed to save device push token for %s: %v", id, err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	pushReq := db.PushNotificationToken {
		UserID: id,
		DeviceToken: req.DeviceToken,
		DeviceOS: req.DeviceOS,
	}

	if err := notifdb.CreatePushToken(pushReq); err != nil {
		log.Printf("[ERROR] failed to create push token for user %s: %v", id, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "device token saved successfully"})
}