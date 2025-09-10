package userkyc

import (
	"github.com/gin-gonic/gin"
	"github.com/oladev/ufinda_v0.01/internal/routes/auth/client"
	"errors"
	"net/http"
    "github.com/google/uuid"
	"github.com/oladev/ufinda_v0.01/internal/db"
    "log"
	// "github.com/oladev/ufinda_v0.01/internal/logs/auth"
    "github.com/oladev/ufinda_v0.01/internal/db/auth"
    "github.com/oladev/ufinda_v0.01/internal/db/kyc"
)

var InvalidRequest = "invalid request"

func UserKYCHandler(c *gin.Context) {
    // 1. Get the trusted user ID from the context
    id, exists := c.Get("id")
    if !exists {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "user ID not found in context"})
        return
    }
    userID, ok := id.(uuid.UUID)
    if !ok {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user ID type in context"})
        return
    }

    // 2. Find the user based on the trusted ID
    createdUser, err := authdb.FindCreatedUserByID(userID)
    if err != nil {
        if errors.Is(err, auth.ErrorUserNotFound) {
            c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "error getting user"})
        }
        return
    }

    // 3. Check for existing KYC
    userKyc, err := kycdb.FindUserKYC(createdUser.ID)
    if err == nil {
        // KYC already exists, check status
        if userKyc.Status == "pending" {
            c.JSON(http.StatusBadRequest, gin.H{"error": "kyc already uploaded, wait for it to be confirmed"})
            return
        }
        if userKyc.Status == "verified" {
            c.JSON(http.StatusBadRequest, gin.H{"error": "kyc already uploaded and verified"})
            return
        }
        if userKyc.Status == "failed" {
            reason, err := kycdb.CheckUserKYCFailReason(userKyc.ID)
            if err != nil {
                c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
                return
            }
            c.JSON(http.StatusBadRequest, gin.H{"error": reason})
            return
        }
    } else if !errors.Is(err, kycdb.ErrorKYCNotFound) {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // 4. Get form data and upload file
    level := c.PostForm("level")
    dept := c.PostForm("dept")
    nin := c.PostForm("nin")
    faculty := c.PostForm("faculty")
    matric := c.PostForm("matric")

    // 5. Create the new KYC entry
    newKYC := db.UserKYC{
        Level:   level,
        Dept:    dept,
        NIN:     nin,
        Faculty: faculty,
        Matric:  matric,
        UserID:  createdUser.ID,
        Status:  "verified", // set status to pending by default
    }

    if err := kycdb.CreateUserKYC(newKYC); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // 6. Update user's KYC status
    if err := authdb.UpdateCreatedUser(createdUser.ID, map[string]interface{}{"is_user_kyc_verified": true}); err != nil {
        log.Println("error updating user kyc status:", err)
    }
	if err := kycdb.DeleteKycFailReason(createdUser.ID); err != nil {
		log.Println("error deleting user kyc status:", err)
	}

    c.JSON(http.StatusOK, gin.H{"message": "KYC uploaded successfully"})
}