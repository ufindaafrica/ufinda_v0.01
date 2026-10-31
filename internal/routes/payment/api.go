package payment
import (
	"github.com/gin-gonic/gin"
)

func RegisterPayment(r *gin.Engine) {
	paymentRoutes := r.Group("/payment")
	{
		paymentRoutes.POST("/onboarding-fee", ConfirmUserBookingFee)
	}
}