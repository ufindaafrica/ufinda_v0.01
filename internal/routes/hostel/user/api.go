package userhostel

import (
	"github.com/gin-gonic/gin"
	"github.com/oladev/ufinda_v0.01/internal/routes/auth"
)

func RegisterApi(r *gin.Engine) {
	hostelApis := r.Group("/hostels")
	hostelApis.Use(auth.UserAuthMiddleware())
	{
		hostelApis.GET("/all", GetAvailableHostelHandler)
		hostelApis.GET("/search", GetHostelBySearchQueryHandler)
		hostelApis.GET("/:id", GetHostelByIdHandler)
		hostelApis.GET("/:id/similar", GetSimilarHostelsHandler())
		hostelApis.POST("/:id", AddToFavoritesHandler)
	}
}