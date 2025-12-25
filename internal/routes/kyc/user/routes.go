package userkyc

import (
	"github.com/gin-gonic/gin"
	"errors"
	"net/http"
    "fmt"
	"github.com/oladev/ufinda_v0.01/internal/db"
    "github.com/cloudinary/cloudinary-go/v2"
	// "github.com/oladev/ufinda_v0.01/internal/logs/auth"
    "github.com/oladev/ufinda_v0.01/internal/db/auth"
    "github.com/oladev/ufinda_v0.01/internal/logs/kyc"
    "github.com/oladev/ufinda_v0.01/internal/db/kyc/user"
)

func UserKYCHandler(cld *cloudinary.Cloudinary) gin.HandlerFunc {
    return func(c *gin.Context) {
        // 1. Get the trusted user ID from the context
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

        // 3. Get form data and upload file
        level := c.PostForm("level")
        dept := c.PostForm("dept")
        faculty := c.PostForm("faculty")
        matric := c.PostForm("matric")
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

        // 4. Check if KYC exists
        _, err = userkycdb.FindUserKYC(getUser.ID)
        isKYCFound := err == nil
        
        if err != nil && !errors.Is(err, userkycdb.ErrorKYCNotFound) {
            // Log database/fetching issue
            kyclog.LogKYC(getUser.ID, fmt.Errorf("database error fetching existing KYC: %w", err))
            c.JSON(http.StatusInternalServerError, gin.H{"error": "database error fetching kyc"})
            return
        }

        // 5. Prepare the data for update/create
        // Use a map to dynamically include only non-empty fields, which is ideal for a PATCH/Update.
        updateData := make(map[string]interface{})
        
        // Only include non-empty strings
        if level != "" {
            updateData["level"] = level
        }
        if dept != "" {
            updateData["dept"] = dept
        }
        if faculty != "" {
            updateData["faculty"] = faculty
        }
        if matric != "" {
            updateData["matric"] = matric
        }
        if aboutMe != "" {
            updateData["about_me"] = aboutMe
        }
        
        // Include profile picture if uploaded successfully
        // Check if the uploadedFile struct is populated (e.g., by checking the URL field)
        if uploadedFile.URL != "" {
            updateData["profile_img"] = uploadedFile
        }

        var opErr error
        var message string

        if isKYCFound {
            // --- UPDATE Existing KYC (PATCH) ---
            // Pass the map as the update data to UpdateUserKYC
            opErr = userkycdb.UpdateUserKYC(getUser.ID, updateData) 
            message = "KYC updated successfully"
        } else {
            // --- CREATE New KYC (POST) ---
            // For creation, we need the full struct, so we merge the map into a new struct
            newKYC := db.UserKYC{
                UserID: getUser.ID,
            }
            if level != "" && dept != "" && faculty != "" && matric != "" {
                newKYC.IsStudent = true
            }
            
            // Merge map data into the struct fields
            if val, ok := updateData["level"]; ok { newKYC.Level = val.(string) }
            if val, ok := updateData["dept"]; ok { newKYC.Dept = val.(string) }
            if val, ok := updateData["faculty"]; ok { newKYC.Faculty = val.(string) }
            if val, ok := updateData["matric"]; ok { newKYC.Matric = val.(string) }
            if val, ok := updateData["about_me"]; ok { newKYC.AboutMe = val.(string) }
            
            // Handle profile picture for creation
            // Check if the uploadedFile struct is populated
            if uploadedFile.URL != "" {
                newKYC.ProfileImg = &uploadedFile
            }

            // Fix 1: Corrected spelling from checkUniqunessFunc to checkUniquenessFunc

            opErr = userkycdb.CreateUserKYC(newKYC)
            message = "KYC created successfully"
        }

        // 6. Handle the result of the update/create operation
        if opErr != nil {
            kyclog.LogKYC(getUser.ID, fmt.Errorf("kyc %s operation failed: %w", ternary(isKYCFound, "update", "create"), opErr))
            c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save KYC data"})
            return
        }

        // update verification as successful
        data := make(map[string]interface{})
        data["is_verified"] = true
        if err := authdb.UpdateCreatedUser(getUser.ID, data); err != nil {
            fmt.Sprintf("CRITICAL: failed to update user data: %w", err)
        }

        c.JSON(http.StatusOK, gin.H{"message": message})
    }
}

func ternary(isKYCFound bool, update string, create string) string {
    if isKYCFound { return update }
    return create
}
