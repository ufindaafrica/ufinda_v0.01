package notif

import (
	"github.com/gin-gonic/gin"
	"github.com/oladev/ufinda_v0.01/internal/routes/auth"
)

func RegisterNotif(r *gin.Engine) {
	notifRoutes := r.Group("/notif")
	notifRoutes.Use(auth.AuthMiddleware())
	{
		notifRoutes.POST("/token", RegisterDeviceTokenHandler)
	}
}