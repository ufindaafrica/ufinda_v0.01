package vendorkyc

import (
	"github.com/oladev/ufinda_v0.01/internal/db"
	"net/http"
	"net/url"
	"os"
	"strings"
	"fmt"
	"log"
	"github.com/cloudinary/cloudinary-go/v2"
    "github.com/oladev/ufinda_v0.01/internal/db/kyc/vendor"
	"errors"
	"github.com/gin-gonic/gin"
	"github.com/oladev/ufinda_v0.01/internal/db/kyc/user"
	"github.com/oladev/ufinda_v0.01/internal/logs/kyc"
)

func GetWidgetUrl(c *gin.Context) {
	// get the id
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

	baseUrl := os.Getenv("DOJAH_WIDGET_URL")
	if baseUrl == "" {
		log.Printf("[CRITICAL] DOJAH_WIDGET_URL not set in env")
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	widgetID := os.Getenv("DOJAH_WIDGET_ID")
	if widgetID == "" {
		log.Printf("[CRITICAL] DOJAH_WIDGET_ID not set in env")
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	trimmedBaseUrl := strings.TrimSuffix(baseUrl, "/")
	
	u, err := url.Parse(trimmedBaseUrl)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	query := u.Query()
	query.Set("widget_id", widgetID)

	query.Set("metadata[user_id]", getUser.ID)
	query.Set("metadata[role]", getUser.Role)

	// Apply the query parameters to the URL
	u.RawQuery = query.Encode()

	finalWidgetURL := u.String()

	c.JSON(http.StatusOK, gin.H{"message": finalWidgetURL})
}

func CreateOnboardVendorKycHandler(cld *cloudinary.Cloudinary) gin.HandlerFunc{
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

		address := c.PostForm("address")
		aboutMe := c.PostForm("about_me")
		profilePic, err := c.FormFile("profile_img")

		// Initialized to an empty struct (zero value), representing no uploaded file yet.
		var uploadedFile db.UploadedFile 
		
		// Variable to track file upload status
		var imageUploadError error 
		
		// --- File Upload Logic (Modified to track error instead of returning) ---
		if err == nil {
			// A file was present, attempt to open and upload it
			file, openErr := profilePic.Open()
			if openErr != nil {
				imageUploadError = fmt.Errorf("failed to open profile image: %w", openErr)
			} else {
				defer file.Close() // Ensure the file is closed

				url, publicID, uploadErr := userkycdb.UploadProfileImage(cld, file, profilePic.Filename)
				if uploadErr != nil {
					imageUploadError = fmt.Errorf("failed to save profile image to cloud: %w", uploadErr)
				} else {
					// Only populate the struct if the upload was successful
					uploadedFile = db.UploadedFile{
						URL: url,
						PublicID: publicID,
					}
				}
			}
		} else if err != http.ErrMissingFile {
			// This handles cases where file upload *failed* for reasons other than 
			// the user just not providing a file (e.g., parsing errors).
			imageUploadError = fmt.Errorf("error parsing profile image from form: %w", err)
		}
		
		if imageUploadError != nil {
			// Log the image upload error
			kyclog.LogKYC(getUser.ID, imageUploadError)
		}

		_, err = vendorkycdb.FindVendorKYC(getUser.ID)
		isKYCFound := err == nil
		
		var opErr error
		var message string

		if err != nil {
			if !errors.Is(err, vendorkycdb.ErrorKYCNotFound) {
				// Log database/fetching issue
				log.Printf("error getting kyc: %w", err)
				kyclog.LogKYC(getUser.ID, fmt.Errorf("database error fetching existing KYC: %w", err))
				c.JSON(http.StatusInternalServerError, gin.H{"error": "database error fetching kyc"})
				return
			}
		}

		if isKYCFound {
			updateData := make(map[string]interface{})
			
			if address != "" {
				updateData["address"] = address
			}

			if uploadedFile.URL != "" {
				updateData["profile_img"] = uploadedFile
			}

			// update the db
			opErr = vendorkycdb.UpdateVendorKyc(getUser.ID, updateData)
			message = "kyc updated sucessfully"
		}else {
			kycData := db.VendorKYC {
				UserID: getUser.ID,
			}
			if address != "" {
				kycData.Address = address
			}
			if aboutMe != "" {
				kycData.AboutMe = aboutMe
			}
			if uploadedFile.URL != "" {
				kycData.ProfileImg = &uploadedFile
			}

			// create the kyc
			opErr = vendorkycdb.CreateVendorKyc(kycData)
			message = "kyc created sucessfully"
		}
		if opErr != nil {
			log.Printf("error creating or updating kyc: %w", opErr)
			kyclog.LogKYC(getUser.ID, opErr)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "database request failed"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": message})
	}
}

