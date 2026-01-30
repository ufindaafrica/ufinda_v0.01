package metrics
import (
	"github.com/gin-gonic/gin"
	"github.com/oladev/ufinda_v0.01/internal/routes/auth"
)

func RegisterMetrics(r *gin.Engine) {
	metricsRoutes := r.Group("/metrics")
	{
		metricsRoutes.POST("/rating", auth.UserAuthMiddleware(), RatingHandler)
		metricsRoutes.PUT("/profile_view/:vendor_id", auth.UserAuthMiddleware(), SetProfileViewHandler)
		metricsRoutes.GET("/profile_views", auth.VendorAuthMiddleware(), GetProfileViewsHandler)
		metricsRoutes.GET("/rating/:vendor_id", GetVendorRatingHandler)
	}
}
