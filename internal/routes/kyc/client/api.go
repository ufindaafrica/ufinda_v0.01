package userkyc

import (
	"github.com/gin-gonic/gin"
	"github.com/oladev/ufinda_v0.01/internal/routes/kyc"
	"github.com/oladev/ufinda_v0.01/internal/routes/auth"
	"github.com/cloudinary/cloudinary-go/v2"
)

func RegisterKYC(r *gin.Engine, cld *cloudinary.Cloudinary) {
	kycRoutes := r.Group("/kyc")
	kycRoutes.Use(authmiddleware.AuthMiddleware())
	{
		kycRoutes.POST("/user", kyc.MaxBytesMiddleware(2<<20), UserKYCHandler(cld))
	}
}