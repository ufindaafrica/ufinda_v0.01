package vendorproduct
import (
	"github.com/gin-gonic/gin"
	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/oladev/ufinda_v0.01/internal/routes/auth"
)

func RegisterVendorProduct(r *gin.Engine, cld *cloudinary.Cloudinary) {
	productRoutes := r.Group("product")
	productRoutes.Use(auth.VendorAuthMiddleware())
	{
		productRoutes.POST("/list", CreateProductHandler())
		productRoutes.DELETE("/del/:id", DeleteProductHandler(cld))
	}
}