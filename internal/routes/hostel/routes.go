package hostel

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"strconv"
	"fmt"
	"errors"
	"context"
	"log"
	"github.com/cloudinary/cloudinary-go/v2"
	"encoding/json"
	"github.com/hibiken/asynq"
	"github.com/oladev/ufinda_v0.01/internal/db"
	"github.com/oladev/ufinda_v0.01/internal/db/hostel"
	"github.com/oladev/ufinda_v0.01/internal/db/auth"
	"github.com/oladev/ufinda_v0.01/internal/token"
	"github.com/oladev/ufinda_v0.01/internal/tasks/hostel"
	"github.com/oladev/ufinda_v0.01/internal/logs/hostel"
)


func CreateHostelHandler(asynqClient *asynq.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, ok := c.Get("id")
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
			return
		}

		userID, ok := id.(string)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid id type"})
			return
		}

		user, err := authdb.FindCreatedUserByID(userID)
		if err != nil {
			if errors.Is(err, authdb.ErrorUserNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "error getting user"})
			}
			return
		}

		if user.Role != "vendor" || !user.IsVerified {
			hostellog.LogHostel(user.ID, nil, fmt.Errorf("user not verified"))
			c.JSON(http.StatusUnauthorized, gin.H{"error": "not verified"})
			return
		}

		// Parse the multipart form to access fields and files
		if err := c.Request.ParseMultipartForm(50 << 20); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "file size exceed limit"})
			return
		}

		// Extract form data
		totalPrice, err := strconv.ParseInt(c.PostForm("total_price"), 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid total_price"})
			return
		}
		totalRooms, err := strconv.Atoi(c.PostForm("total_hostel_rooms"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid total_hostel_rooms"})
			return
		}

		// Convert the string to int64
		rentPerYear, err := strconv.ParseInt(c.PostForm("rent_per_year"), 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid rent_per_year"})
			return
		}

		// Create the hostel object with basic data only
		checkUniquenessFunc := func(id string) (bool, error) {
			return (token.IsIDUnique(id, "/rest/v1/hostels"))
		}

		hostelID, err := token.GetUniqueID("H", checkUniquenessFunc)
		if err != nil {
			hostellog.LogHostel(user.ID, nil, fmt.Errorf("failed to generate hostel id: %w", err))
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate id"})
			return
		}

		newHostel := db.Hostel{
			ID: hostelID,
			VendorID:         user.ID,
			TotalPrice:       totalPrice,
			Location:         c.PostForm("location"),
			LandlordResides:  c.PostForm("landlord_resides"),
			RoomType:         c.PostForm("room_type"),
			RentPerYear:      rentPerYear,
			TotalHostelRooms: totalRooms,
			RoommatesAllowed: c.PostForm("roommates_allowed"),
			KitchenAccess:    c.PostForm("kitchen_access"),
			ToiletAccess:     c.PostForm("toilet_access"),
			Description:      c.PostForm("description"),
			HostelImages:     nil,
			HostelVideos:     nil,
		}

		// Save the record to the database immediately
		if err := hosteldb.CreateHostel(newHostel); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Get files to send to the worker
		imageHeaders := c.Request.MultipartForm.File["hostel_images"]
		videoHeaders := c.Request.MultipartForm.File["hostel_videos"]

		// Prepare payload for background task
		payload, err := json.Marshal(tasks.HostelMediaUploadPayload{
			HostelID:       hostelID,
			VendorID: 		user.ID,
			ImageFilesData: tasks.FilesToBytes(imageHeaders),
			VideoFilesData: tasks.FilesToBytes(videoHeaders),
		})
		if err != nil {
			log.Printf("Failed to marshal task payload: %v", err)
			// Still return success to the user as the hostel record was created
		}

		// Enqueue the task
		task := asynq.NewTask(tasks.TypeHostelMediaUpload, payload)
		if _, err := asynqClient.Enqueue(task, asynq.MaxRetry(3)); err != nil {
			log.Printf("Could not enqueue task: %v", err)
		}

		// Return a quick response to the user
		c.JSON(http.StatusAccepted, gin.H{"message": "Hostel listing created. Media is being processed in the background."})
	}
}


func UpdateHostelHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        // Get the hostel ID from the URL parameter
        hostelID := c.Param("id")

        // 1. Verify that the user is a vendor and KYC verified
        id, ok := c.Get("id")
        if !ok {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
            return
        }

		userID, ok := id.(string)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid id type"})
			return
		}

        user, err := authdb.FindCreatedUserByID(userID)
        if err != nil {
            if errors.Is(err, authdb.ErrorUserNotFound) {
                c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
            } else {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "error getting user"})
            }
            return
        }
        
        if user.Role != "vendor" || !user.IsVerified {
            hostellog.LogHostel(userID, &hostelID, fmt.Errorf("vendor not verified"))
			c.JSON(http.StatusUnauthorized, gin.H{"error": "not authorized or kyc not verified"})
            return
        }

        // 2. Retrieve the existing hostel record
        existingHostel, err := hosteldb.FindHostelByID(hostelID)
        if err != nil {
            if errors.Is(err, hosteldb.ErrorHostelNotFound) {
                c.JSON(http.StatusNotFound, gin.H{"error": "hostel not found"})
            } else {
                c.JSON(http.StatusInternalServerError, gin.H{"error": "error getting hostel record"})
            }
            return
        }

        // 3. Verify the logged-in user owns the hostel
        if existingHostel.VendorID != userID {
            hostellog.LogHostel(userID, &existingHostel.ID, fmt.Errorf("user not owner of hostel"))
			c.JSON(http.StatusForbidden, gin.H{"error": "unauthorized"})
            return
        }

        if totalPriceStr := c.PostForm("total_price"); totalPriceStr != "" {
            totalPrice, err := strconv.ParseInt(totalPriceStr, 10, 64)
            if err != nil {
                c.JSON(http.StatusBadRequest, gin.H{"error": "invalid total_price"})
                return
            }
            existingHostel.TotalPrice = totalPrice
        }

        if rentPerYearStr := c.PostForm("rent_per_year"); rentPerYearStr != "" {
            rentPerYear, err := strconv.ParseInt(rentPerYearStr, 10, 64)
            if err != nil {
                c.JSON(http.StatusBadRequest, gin.H{"error": "invalid rent_per_year"})
                return
            }
            existingHostel.RentPerYear = rentPerYear
        }
        
        if totalRoomsStr := c.PostForm("total_hostel_rooms"); totalRoomsStr != "" {
            totalRooms, err := strconv.Atoi(totalRoomsStr)
            if err != nil {
                c.JSON(http.StatusBadRequest, gin.H{"error": "invalid total_hostel_rooms"})
                return
            }
            existingHostel.TotalHostelRooms = totalRooms
        }
        
        if c.PostForm("landlord_resides") != "" {
            existingHostel.LandlordResides = c.PostForm("landlord_resides")
        }
        
        if c.PostForm("roommates_allowed") != "" {
            existingHostel.RoommatesAllowed = c.PostForm("roommates_allowed")
        }
        
        if description := c.PostForm("description"); description != "" {
            existingHostel.Description = description
        }

        // 6. Save the updated hostel record
        if err := hosteldb.UpdateHostel(existingHostel.ID, existingHostel); err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update hostel record"})
            return
        }
        
        c.JSON(http.StatusOK, gin.H{"message": "Hostel updated successfully."})
    }
}

func DeleteHostelHandler(cld *cloudinary.Cloudinary) gin.HandlerFunc {
	return func(c *gin.Context) {
		hostelID := c.Param("id")
		// 1. Verify that the user is a vendor and KYC verified
		id, ok := c.Get("id")
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
			return
		}

		userID, ok := id.(string)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid id type"})
			return
		}

		user, err := authdb.FindCreatedUserByID(userID)
		if err != nil {
			if errors.Is(err, authdb.ErrorUserNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "error getting user"})
			}
			return
		}
			
		if user.Role != "vendor" || !user.IsVerified {
			hostellog.LogHostel(userID, &hostelID, fmt.Errorf("vendor not verified"))
			c.JSON(http.StatusInternalServerError, gin.H{"error": "not authorized or kyc not verified"})
			return
		}

		// 2. Retrieve the existing hostel record
		existingHostel, err := hosteldb.FindHostelByID(hostelID)
		if err != nil {
			if errors.Is(err, hosteldb.ErrorHostelNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "hostel not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "error getting hostel record"})
			}
			return
		}

		// 3. Verify the logged-in user owns the hostel
		if existingHostel.VendorID != userID {
			hostellog.LogHostel(userID, &hostelID, fmt.Errorf("user not owner of hostel"))
			c.JSON(http.StatusForbidden, gin.H{"error": "unauthorized"})
			return
		}

		// first retrieve the images and videos for delete
		images, err := hosteldb.GetHostelImagesPublicIDAndUrl(existingHostel.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get images"})
		}
		
		ctx := context.Background()
		// loop through and delete
		for _, img := range images {
			if err := db.DeleteCloudinaryAsset(ctx, cld, img.PublicID, "image"); err != nil {
				log.Printf("failed to delete image %s with err: %w", img.URL, err)
			}
		}

		videos, err := hosteldb.GetHostelVideosPublicIDAndUrl(existingHostel.ID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get videos"})
		}

		// loop through and delete
		for _, vid := range videos {
			if err := db.DeleteCloudinaryAsset(ctx, cld, vid.PublicID, "video"); err != nil {
				log.Printf("failed to delete video %s with err: %w", vid.URL, err)
			}
		}

		// delete the hostel
		if err := hosteldb.DeleteHostel(existingHostel.ID); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to delete listing"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "listing deleted successfully"})
	}
}