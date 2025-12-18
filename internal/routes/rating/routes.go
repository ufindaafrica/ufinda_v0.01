package rating
import (
	"github.com/oladev/ufinda_v0.01/internal/db"
	"github.com/gin-gonic/gin"
	"net/http"
	"io"
	"log"
	"strings"
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

	resp, err := db.MakeDBRequest("POST", "/rest/v1/vendor_ratings", rating, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to make request"})
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated { // Supabase returns 201 on successful INSERT
        // Read DB response body for detailed error logging (e.g., if the user already rated this vendor)
        bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("DB API Error: Status %d. Response: %s", resp.StatusCode, string(bodyBytes))
        
        // Check for specific error (e.g., UNIQUE constraint violation)
        if strings.Contains(string(bodyBytes), "unique constraint") {
            c.JSON(http.StatusConflict, gin.H{"error": "You have already submitted a rating for this vendor."})
            return
        }

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database failed to save rating."})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "rating submitted successfully"})
}
