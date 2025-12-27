package vendorhostel

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"strconv"
	"fmt"
	"errors"
	"strings"
	"context"
	"mime/multipart"
	"log"
	"github.com/cloudinary/cloudinary-go/v2"
	"encoding/json"
	"github.com/hibiken/asynq"
	"github.com/oladev/ufinda_v0.01/internal/db"
	"github.com/oladev/ufinda_v0.01/internal/db/hostel"
	"github.com/oladev/ufinda_v0.01/internal/logs/auth"
	"github.com/oladev/ufinda_v0.01/internal/token"
	"github.com/oladev/ufinda_v0.01/internal/tasks/hostel"
	"github.com/oladev/ufinda_v0.01/internal/tasks"
	"github.com/oladev/ufinda_v0.01/internal/logs/hostel"
)


func CreateHostelHandler(asynqClient *asynq.Client) gin.HandlerFunc {
	return func(c *gin.Context) {
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

		if !getUser.IsVerified {
			hostellog.LogHostel(getUser.ID, fmt.Errorf("vendor not verified"))
			c.JSON(http.StatusUnauthorized, gin.H{"error": "vendor not verified"})
			return
		}

		// Parse the multipart form to access fields and files
		form, err := c.MultipartForm()
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "error getting request"})
			return
		}

		// Get files to send to the worker
		imageHeaders := form.File["hostel_images"]
		if len(imageHeaders) < 1 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "no image provided"})
			return
		}

		if len(imageHeaders) > 3 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "max of 3 images allowed"})
			return
		}

		videoHeader,_ := c.FormFile("hostel_video")
		var videoSlice []*multipart.FileHeader
		if videoHeader != nil {
			videoSlice = append(videoSlice, videoHeader)
		}

		getFormVal := func(key string) string {
			return strings.TrimSpace((c.PostForm(key)))
		}

		totalPrice, err := strconv.ParseInt(getFormVal("total_price"), 10, 64)
		if err != nil || totalPrice <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid total price."})
			return
		}

		totalRooms, err := strconv.Atoi(getFormVal("total_hostel_rooms"))
		if err != nil || totalRooms <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid total hostel rooms."})
			return
		}

		rentPerYear, err := strconv.ParseInt(getFormVal("rent_per_year"), 10, 64)
		if err != nil || rentPerYear <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid rent per year."})
			return
		}

		// 2. Extract and Validate Text Data
		title := getFormVal("title")
		location := getFormVal("location")
		description := getFormVal("description")

		// Essential field checks
		if title == "" || len(title) < 5 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Title is too short or empty."})
			return
		}
		if location == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Location is required."})
			return
		}

		checkUniquenessFunc := func(id string) (bool, error) {
			return token.IsIDUnique(id, "/rest/v1/hostels")
		}

		hostelID, err := token.GenerateRandomID("hostel", checkUniquenessFunc)
		if err != nil {
			hostellog.LogHostel(getUser.ID, fmt.Errorf("failed to generate hostel id: %w", err))
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
			return
		}

		newHostel := db.Hostel{
			ID:               hostelID,
			VendorID:         getUser.ID,
			Title:            title,
			TotalPrice:       totalPrice,
			Location:         location,
			Description:      description,
			RentPerYear:      rentPerYear,
			TotalHostelRooms: totalRooms,
			LandlordResides:  getFormVal("landlord_resides"),
			RoomType:         getFormVal("room_type"),
			RoommatesAllowed: getFormVal("roommates_allowed"),
			KitchenAccess:    getFormVal("kitchen_access"),
			ToiletAccess:     getFormVal("toilet_access"),
			HostelImages:     nil,
			HostelVideos:     nil,
		}

		if err := hosteldb.CreateHostel(newHostel); err != nil {
			hostellog.LogHostel(getUser.ID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
			return
		}

		payload, err := json.Marshal(hosteltasks.HostelMediaUploadPayload{
			HostelID:       hostelID,
			VendorID: 		getUser.ID,
			ImageFilesData: tasks.FilesToBytes(imageHeaders),
			VideoFilesData: tasks.FilesToBytes(videoSlice),
		})

		if err == nil {
			// Enqueue the task
			task := asynq.NewTask(hosteltasks.TypeHostelMediaUpload, payload)

			if _, err := asynqClient.Enqueue(task, asynq.MaxRetry(3)); err != nil {
				hostellog.LogHostel(getUser.ID, err)
				log.Printf("Could not enqueue task: %v", err)
			}
		}

		// Return a quick response to the user
		c.JSON(http.StatusAccepted, gin.H{"message": "Hostel listed. Media is being processed in the background."})
	}
}


func UpdateHostelHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        hostelID := c.Param("id")

        // 1. Auth & Verification
        user, exists := c.Get("user")
        if !exists {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "vendor not authenticated"})
            return
        }

        getUser := user.(*db.User)
        if !getUser.IsVerified {
            hostellog.LogHostel(getUser.ID, fmt.Errorf("unverified vendor access"))
            c.JSON(http.StatusUnauthorized, gin.H{"error": "vendor not verified"})
            return
        }

        // 2. Bind and Validate Input
        var req UpdateHostelRequest
        if err := c.ShouldBind(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
            return
        }

        // 3. Ownership Check
        existingHostel, err := hosteldb.FindHostelByID(hostelID)
        if err != nil {
            if errors.Is(err, hosteldb.ErrorHostelNotFound) {
                c.JSON(http.StatusNotFound, gin.H{"error": "hostel not found"})
            } else {
				hostellog.LogHostel(getUser.ID, err)
                c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
            }
            return
        }

        if existingHostel.VendorID != getUser.ID {
            // Security Logging
            authlog.SecurityLog(db.SecurityLog{
                Log:   fmt.Sprintf("Unauthorized update attempt on hostel %s by user %s", hostelID, getUser.ID),
                Level: "CRITICAL",
            })
            c.JSON(http.StatusForbidden, gin.H{"error": "no access"})
            return
        }

        // 4. Build the Update Map
        // We use a map to ensure we ONLY update fields that were actually sent in the request
        updateFields := make(map[string]interface{})

        if req.TotalPrice != nil { updateFields["total_price"] = *req.TotalPrice }
        if req.RentPerYear != nil { updateFields["rent_per_year"] = *req.RentPerYear }
        if req.TotalHostelRooms != nil { updateFields["total_hostel_rooms"] = *req.TotalHostelRooms }
        if req.LandlordResides != nil { updateFields["landlord_resides"] = *req.LandlordResides }
        if req.RoommatesAllowed != nil { updateFields["roommates_allowed"] = *req.RoommatesAllowed }
        if req.Description != nil { updateFields["description"] = *req.Description }
        if req.RoomType != nil { updateFields["room_type"] = *req.RoomType }

        // 5. Perform Atomic Update
        if len(updateFields) == 0 {
            c.JSON(http.StatusOK, gin.H{"message": "no changes detected"})
            return
        }

        if err := hosteldb.UpdateHostel(hostelID, updateFields); err != nil {
            hostellog.LogHostel(getUser.ID, err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
            return
        }

        c.JSON(http.StatusOK, gin.H{"message": "Hostel updated successfully."})
    }
}

func DeleteHostelHandler(cld *cloudinary.Cloudinary) gin.HandlerFunc {
	return func(c *gin.Context) {
		hostelID := c.Param("id")
		// 1. Verify that the user is a vendor and KYC verified
		user, exists := c.Get("user")
        if !exists {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "vendor not authenticated"})
            return
        }ser type

        getUser, ok := user.(*db.User)
        if !ok {
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user"})
            return
        }

		if !getUser.IsVerified {
			hostellog.LogHostel(getUser.ID, fmt.Errorf("unverified vendor access"))
			c.JSON(http.StatusUnauthorized, gin.H{"error": "vendor not verified"})
			return
		}

		// 2. Retrieve the existing hostel record
		existingHostel, err := hosteldb.FindHostelByID(hostelID)
		if err != nil {
			if errors.Is(err, hosteldb.ErrorHostelNotFound) {
				c.JSON(http.StatusNotFound, gin.H{"error": "hostel not found"})
			} else {
				hostellog.LogHostel(getUser.ID, err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
			}
			return
		}

		// 3. Verify the logged-in user owns the hostel
		if existingHostel.VendorID != getUser.ID {
			logData := authlog.Logs["3"]
			formattedMessage := fmt.Sprintf(logData.Message, "user tries to delete hostel")
            logEntry := db.SecurityLog{
                Log:   formattedMessage,
                Level: logData.Level,
            }
            authlog.SecurityLog(logEntry)
			c.JSON(http.StatusForbidden, gin.H{"error": "unauthorized"})
			return
		}

		// first retrieve the images and videos for delete
		images, err := hosteldb.GetHostelImagesPublicIDAndUrl(existingHostel.ID)
		if err != nil {
			hostellog.LogHostel(getUser.ID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
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
			hostellog.LogHostel(getUser.ID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		}

		// loop through and delete
		for _, vid := range videos {
			if err := db.DeleteCloudinaryAsset(ctx, cld, vid.PublicID, "video"); err != nil {
				log.Printf("failed to delete video %s with err: %w", vid.URL, err)
			}
		}

		// delete the hostel
		if err := hosteldb.DeleteHostel(existingHostel.ID); err != nil {
			hostellog.LogHostel(getUser.ID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "listing deleted successfully"})
	}
}

func GetAllAgentsHostelHandler(c *gin.Context) {
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
	
	hostels, err := hosteldb.FindVendorHostels(getUser.ID)
	if err != nil {
		if errors.Is(err, hosteldb.ErrorHostelNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "no listed hostel found for vendor"})
		}else {
			hostellog.LogHostel(getUser.ID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError}) }
		return
	}

	c.JSON(http.StatusOK, hostels)
}