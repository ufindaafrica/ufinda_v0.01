package vendorhostel

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"strconv"
	"fmt"
	"net/url"
	"errors"
	"context"
	"time"
	"log"
	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api"
	"github.com/oladev/ufinda_v0.01/internal/db"
	"github.com/oladev/ufinda_v0.01/internal/db/hostel"
	"github.com/oladev/ufinda_v0.01/internal/logs/auth"
	"github.com/oladev/ufinda_v0.01/internal/token"
	"github.com/oladev/ufinda_v0.01/internal/logs/hostel"
)


func CreateHostelHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 1. Auth & Verification
		user, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
			return
		}

		getUser := user.(*db.User)
		if !getUser.IsVerified {
			hostellog.LogHostel(getUser.ID, fmt.Errorf("vendor not verified"))
			c.JSON(http.StatusUnauthorized, gin.H{"error": "vendor not verified"})
			return
		}

		// 2. Bind JSON Payload
		var req CreateHostelRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// 3. Generate Unique Hostel ID
		checkUniquenessFunc := func(id string) (bool, error) {
			return token.IsIDUnique(id, "/rest/v1/hostels")
		}

		hostelID, err := token.GenerateRandomID("hostel", checkUniquenessFunc)
		if err != nil {
			hostellog.LogHostel(getUser.ID, fmt.Errorf("failed to generate hostel id: %w", err))
			c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
			return
		}

		// 4. Map DTO to Database Model
		newHostel := db.Hostel{
			ID:               hostelID,
			VendorID:         getUser.ID,
			Title:            req.Title,
			TotalPrice:       req.TotalPrice,
			Location:         req.Location,
			Description:      req.Description,
			RentPerYear:      req.RentPerYear,
			TotalHostelRooms: req.TotalHostelRooms,
			LandlordResides:  req.LandlordResides,
			RoomType:         req.RoomType,
			RoommatesAllowed: req.RoommatesAllowed,
			KitchenAccess:    req.KitchenAccess,
			ToiletAccess:     req.ToiletAccess,
			HostelImages:     req.Images, 
			HostelVideos:     req.Videos,
			GeoLocation:	  req.GeoLocation, 		
		}

		// 5. Save to Database
		if err := hosteldb.CreateHostel(newHostel); err != nil {
			hostellog.LogHostel(getUser.ID, err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
			return
		}

		c.JSON(http.StatusCreated, gin.H{
			"message": "Hostel created successfully",
			"id":      hostelID,
		})
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
			hostellog.LogHostel(getUser.ID, fmt.Errorf("vendor not verified"))
			c.JSON(http.StatusUnauthorized, gin.H{"error": "vendor not verified"})
			return
		}

		// 2. Bind JSON Input
		var req UpdateHostelRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body", "details": err.Error()})
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
			authlog.SecurityLog(db.SecurityLog{
				Log:   fmt.Sprintf("Unauthorized update attempt on hostel %s by user %s", hostelID, getUser.ID),
				Level: "CRITICAL",
			})
			c.JSON(http.StatusForbidden, gin.H{"error": "no access"})
			return
		}

		// 4. Build the Update Map
		updateFields := make(map[string]interface{})

		if req.TotalPrice != nil {
			updateFields["total_price"] = *req.TotalPrice
		}
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
        }

        getUser, ok := user.(*db.User)
        if !ok {
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user"})
            return
        }

		if !getUser.IsVerified {
			hostellog.LogHostel(getUser.ID, fmt.Errorf("vendor not verified"))
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
		c.JSON(http.StatusUnauthorized, gin.H{"error": "vendor not authenticated"})
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

func GetCloudinarySignatureHandler(cld *cloudinary.Cloudinary) gin.HandlerFunc {
	return func(c *gin.Context) {
		timestamp := time.Now().Unix()

		// 2. Use url.Values instead of a map
		params := url.Values{}
		params.Add("timestamp", strconv.FormatInt(timestamp, 10))
		params.Add("folder", "hostels")

		// 3. Pass the url.Values to SignParameters
		// This matches the signature: func SignParameters(params url.Values, secret string)
		signature, err := api.SignParameters(params, cld.Config.Cloud.APISecret)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"signature":  signature,
			"timestamp":  timestamp,
			"api_key":    cld.Config.Cloud.APIKey,
			"cloud_name": cld.Config.Cloud.CloudName,
			"folder":     "hostels",
		})
	}
}