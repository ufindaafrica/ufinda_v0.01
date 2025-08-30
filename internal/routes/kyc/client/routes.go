package userkyc

import (
	"github.com/gin-gonic/gin"
	"uFinda/internal/routes/kyc"
	"uFinda/internal/routes/auth"
)

func RegisterKYC(r *gin.Engine) {
	kycRoutes := r.Group("/kyc")
	kycRoutes.Use(auth.AuthMiddleware())
	{
		kycRoutes.POST("/user", kyc.MaxBytesMiddleware(5<<20), UserKYCHandler)
	}
}