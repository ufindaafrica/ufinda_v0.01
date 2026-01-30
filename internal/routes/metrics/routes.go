package metrics
import (
	"github.com/oladev/ufinda_v0.01/internal/db"
	"github.com/oladev/ufinda_v0.01/internal/db/metrics"
	"github.com/gin-gonic/gin"
	"github.com/oladev/ufinda_v0.01/internal/logs/metrics"
	"net/http"
	"log"
	"errors"
)

func RatingHandler(c * gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	getUser, ok := user.(*db.User)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user type"})
		return
	}

	var req RatingInfo
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	if req.VendorID == getUser.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "action not allowed"})
		return
	}

	rating := db.Rating{
		VendorID: req.VendorID,
		ReviewerID: getUser.ID,
		Score: req.Score,
		Review: req.Review,
	}

	if err := metricsdb.SetRating(rating); err != nil {
		if errors.Is(err, metricsdb.ErrDuplicateRating) {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		}else { c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError}) }
		metricslog.LogMetric(getUser.ID, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "rating submitted successfully"})
}

func SetProfileViewHandler(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	getUser, ok := user.(*db.User)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user type"})
		return
	}

	vendorID := c.Param("vendor_id")

	if err := metricsdb.SetProfileView(getUser.ID, vendorID); err != nil {
		if errors.Is(err, metricsdb.ErrDuplicateProfileView) {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		}else { c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError}) }
		metricslog.LogMetric(getUser.ID, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "view set for user"})
}

func GetProfileViewsHandler(c *gin.Context) {
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	getUser, ok := user.(*db.User)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user type"})
		return
	}

	count, err := metricsdb.GetProfileViews(getUser.ID)
	if err != nil {
		metricslog.LogMetric(getUser.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	c.JSON(http.StatusOK, gin.H{"profile_views": count})
}

func GetVendorRatingHandler(c *gin.Context) {
	vendorID := c.Param("vendor_id")

	rating, err := metricsdb.GetVendorRating(vendorID)
	if err != nil {
		log.Printf("[ERROR] failed to get vendor [%s] rating: %v", vendorID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	c.JSON(http.StatusOK, rating)
}