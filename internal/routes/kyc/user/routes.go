
package userkyc

import (
	"github.com/gin-gonic/gin"
	"errors"
	"net/http"
	"github.com/oladev/ufinda_v0.01/internal/db"
    "github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api"
    "time"
    "strconv"
    "net/url"
    "github.com/oladev/ufinda_v0.01/internal/db/auth"
    "github.com/oladev/ufinda_v0.01/internal/logs/kyc"
    "github.com/oladev/ufinda_v0.01/internal/db/kyc/user"
)

func UserKYCHandler() gin.HandlerFunc {
    return func(c *gin.Context) {
        // 1. Get the trusted user from context
        user, exists := c.Get("user")
        if !exists {
            c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
            return
        }
        getUser, ok := user.(*db.User)
        if !ok {
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user"})
            return
        }

        var req UserKYCRequest
        if err := c.ShouldBindJSON(&req); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request format"})
            return
        }

        // 4. Check if KYC already exists
        _, err := userkycdb.FindUserKYC(getUser.ID)
        isKYCFound := err == nil
        
        if err != nil && !errors.Is(err, userkycdb.ErrorKYCNotFound) {
            kyclog.LogKYC(getUser.ID, err)
            c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
            return
        }

        // 5. Prepare Data Map (for Update/PATCH)
        updateData := make(map[string]interface{})
        if req.Level != nil   { updateData["level"] = *req.Level }
        if req.Dept != nil    { updateData["dept"] = *req.Dept }
        if req.Faculty != nil { updateData["faculty"] = *req.Faculty }
        if req.Matric != nil  { updateData["matric"] = *req.Matric }
        if req.AboutMe != nil { updateData["about_me"] = *req.AboutMe }
        if req.ProfileImg != nil {
            updateData["profile_img"] = req.ProfileImg
        }
        if req.Level != nil && req.Matric != nil {
            updateData["is_student"] = true
        }

        var opErr error
        var message string

        if isKYCFound {
            // --- UPDATE (PATCH) ---
            opErr = userkycdb.UpdateUserKYC(getUser.ID, updateData) 
            message = "KYC updated successfully"
        } else {
            // --- CREATE (POST) ---
            newKYC := db.UserKYC{
                UserID:     getUser.ID,
                ProfileImg: req.ProfileImg,
                IsStudent:  req.Level != nil && req.Matric != nil,
            }

            // Safely assign values only if they were provided in the JSON
            if req.Level != nil   { newKYC.Level = *req.Level }
            if req.Dept != nil    { newKYC.Dept = *req.Dept }
            if req.Faculty != nil { newKYC.Faculty = *req.Faculty }
            if req.Matric != nil  { newKYC.Matric = *req.Matric }
            if req.AboutMe != nil { newKYC.AboutMe = *req.AboutMe }

            opErr = userkycdb.CreateUserKYC(newKYC)
            message = "KYC created successfully"
        }
        // 6. Handle Final Response
        if opErr != nil {
            kyclog.LogKYC(getUser.ID, opErr)
            c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
            return
        }

        // Mark User as verified
        authdb.UpdateCreatedUser(getUser.ID, map[string]interface{}{"is_verified": true})

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