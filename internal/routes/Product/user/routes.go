
package userproduct
import(
	"github.com/gin-gonic/gin"
	"github.com/oladev/ufinda_v0.01/internal/routes/auth"
	"github.com/oladev/ufinda_v0.01/internal/db"
	"github.com/cloudinary/cloudinary-go/v2"
)

func Product(cld *cloudinary.Cloudinary) gin.HandlerFunc {
	return(c *gin.Context) {
		// get user id from authentication (use user side)
		// as vendor are not allowed
		user, exists := c.Get("user")
		if !exists {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
            return
        }

		//type assert it
		getUser, ok := user.(*db.User)
		if !ok {
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user type"})
            return
        }

		// get the form

	}
}