package vendorkyc

import (
	"github.com/gin-gonic/gin"
	"github.com/oladev/ufinda_v0.01/internal/routes/kyc"
	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/oladev/ufinda_v0.01/internal/routes/auth"
)

func RegisterKYC(r *gin.Engine, cld *cloudinary.Cloudinary) {
	kycRoutes := r.Group("/kyc")
	kycRoutes.Use(auth.VendorAuthMiddleware())
	{
		kycRoutes.GET("/vendor", GetWidgetUrl)
		kycRoutes.POST("/vendor", kyc.MaxBytesMiddleware(5<<20), CreateOnboardVendorKycHandler(cld))
	}
}