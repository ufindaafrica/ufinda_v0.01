package vendorhostel

import (
	"github.com/gin-gonic/gin"
	"github.com/hibiken/asynq"
	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/oladev/ufinda_v0.01/internal/routes/auth"
	"github.com/oladev/ufinda_v0.01/internal/routes/hostel"
)

func RegisterHostel(r *gin.Engine, asynqClient *asynq.Client, cld *cloudinary.Cloudinary) {
	hostelApis := r.Group("/hostels")
	hostelApis.Use(auth.VendorAuthMiddleware())
	{
		// create hostel api
		hostelApis.POST("/create", hostel.MaxBytesMiddleware(25<<20), CreateHostelHandler(asynqClient))
		
		// update hostel api
		hostelApis.PATCH("/:id", UpdateHostelHandler())

		//delere hostel api
		hostelApis.DELETE("/:id", DeleteHostelHandler(cld))
	}
}