package userkyc

import (
	"github.com/gin-gonic/gin"
	"github.com/oladev/ufinda_v0.01/internal/routes/kyc"
	"github.com/oladev/ufinda_v0.01/internal/routes/auth"
)

func RegisterKYC(r *gin.Engine) {
	kycRoutes := r.Group("/kyc")
	kycRoutes.Use(authmiddleware.AuthMiddleware())
	{
		kycRoutes.POST("/user", kyc.MaxBytesMiddleware(5<<20), UserKYCHandler)
	}
}