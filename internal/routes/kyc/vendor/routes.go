package vendorkyc

import (
	"github.com/oladev/ufinda_v0.01/internal/db"
	"net/http"
	"net/url"
	"os"
	"time"
	"strconv"
	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api"
	"strings"
	"log"
    "github.com/oladev/ufinda_v0.01/internal/db/kyc/vendor"
	"errors"
	"github.com/gin-gonic/gin"
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

func CreateOnboardVendorKycHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        // 1. Authenticate user
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

        // 2. Bind JSON payload
        var req VendorKYCRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
            return
        }

        // 3. Check for existing KYC
        _, err := vendorkycdb.FindVendorKYC(getUser.ID)
        isKYCFound := err == nil

        if err != nil && !errors.Is(err, vendorkycdb.ErrorKYCNotFound) {
            kyclog.LogKYC(getUser.ID, err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
            return
        }

        var opErr error
        var message string

        if isKYCFound {
            updateData := make(map[string]interface{})
            
            if req.Address != nil {
                updateData["address"] = *req.Address
            }
            if req.AboutMe != nil {
                updateData["about_me"] = *req.AboutMe
            }
            if req.ProfileImg != nil {
                updateData["profile_img"] = req.ProfileImg
            }

            opErr = vendorkycdb.UpdateVendorKyc(getUser.ID, updateData)
            message = "KYC updated successfully"
        } else {
            // --- CREATE (POST) ---
            kycData := db.VendorKYC{
                UserID: getUser.ID,
            }
            
            // Dereference pointers if they exist
            if req.Address != nil {
                kycData.Address = *req.Address
            }
            if req.AboutMe != nil {
                kycData.AboutMe = *req.AboutMe
            }
            if req.ProfileImg != nil {
                kycData.ProfileImg = req.ProfileImg
            }

            opErr = vendorkycdb.CreateVendorKyc(kycData)
            message = "KYC created successfully"
        }

        // 4. Final Error Handling
        if opErr != nil {
            log.Printf("error saving kyc: %v", opErr)
            kyclog.LogKYC(getUser.ID, opErr)
            c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
            return
        }

        c.JSON(http.StatusOK, gin.H{"message": message})
    }
}


func GetCloudinarySignatureHandler(cld *cloudinary.Cloudinary) gin.HandlerFunc {
	return func(c *gin.Context) {
		timestamp := time.Now().Unix()

		// 2. Use url.Values instead of a map
		params := url.Values{}
		params.Add("timestamp", strconv.FormatInt(timestamp, 10))
		params.Add("folder", "kyc")

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
			"folder":     "kyc",
		})
	}
}