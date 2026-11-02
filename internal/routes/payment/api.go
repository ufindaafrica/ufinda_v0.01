package payment
import (
	"github.com/gin-gonic/gin"
	"github.com/oladev/ufinda_v0.01/internal/routes/auth"
)

func RegisterPayment(r *gin.Engine) {
	paymentRoutes := r.Group("/payment")
	{
		paymentRoutes.POST("/booking-fee", ConfirmUserBookingFee)
		paymentRoutes.GET("/agent-listing-status", auth.VendorAuthMiddleware(), ConfirmAgentListingEligibility)
	}
}