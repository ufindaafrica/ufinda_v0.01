package userkyc

import (
	"github.com/gin-gonic/gin"
	"github.com/oladev/ufinda_v0.01/internal/routes/kyc"
	"github.com/oladev/ufinda_v0.01/internal/routes/auth"
	"github.com/cloudinary/cloudinary-go/v2"
)

func RegisterKYC(r *gin.Engine, cld *cloudinary.Cloudinary) {
	kycRoutes := r.Group("/kyc/user")
	kycRoutes.Use(auth.UserAuthMiddleware())
	{
		kycRoutes.POST("", kyc.MaxBytesMiddleware(5<<20), UserKYCHandler())
		kycRoutes.GET("/signature", GetCloudinarySignatureHandler(cld))
		kycRoutes.GET("/profile", GetUserProfileHandler)
	}
}