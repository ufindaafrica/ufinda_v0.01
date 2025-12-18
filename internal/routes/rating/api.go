package rating
import (
	"github.com/gin-gonic/gin"
	"github.com/oladev/ufinda_v0.01/internal/routes/auth"
)

func RegisterRating(r *gin.Engine) {
	ratingRoutes := r.Group("/rating")
	ratingRoutes.Use(auth.UserAuthMiddleware())
	{
		ratingRoutes.POST("", RatingHandler)
	}
}