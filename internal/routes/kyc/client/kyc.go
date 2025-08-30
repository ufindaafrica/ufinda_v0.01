package userkyc

import (
	"github.com/gin-gonic/gin"
	"uFinda/internal/routes/auth/client"
	"errors"
	"net/http"
	"uFinda/internal/db"
	"fmt"
	"uFinda/internal/routes/auth"
	"uFinda/internal/logs/auth"
)

var InvalidRequest = "invalid request"

func UserKYCHandler(c *gin.Context) {
	email := c.Query("email")
	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email is required"})
		return
	}

	user, ok := auth.GetUser(c) 
	if !ok {
		// create log
		log := authlog.Logs["2"]
		newLog := db.SecurityLog{
			Log: log.Message,
			Level: log.Level,
		}

		if err := authlog.CreateLog(newLog); err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		return
	}

	getEmail := user.Email
	if getEmail != email {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized access"})

		// create Log
		log := authlog.Logs["3"]
		user, _ := auth.GetUser(c)
		fmtMessage := fmt.Sprintf(log.Message, fmt.Sprintf("expected %s got %s", getEmail, email))
		newLog := db.SecurityLog{
			UserID: user.UserID,
			Log: fmtMessage,
			Level: log.Level,
		}
		if err := authlog.CreateLog(newLog); err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return			
		}

		c.JSON(401, gin.H{"error": "unauthorized"})
		return
	}

	createduser, err := clientauth.FindCreatedUser(email)
	if err != nil {
		if errors.Is(err, ErrorGettingUser) {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "error checking for created user"})
			return
		}
	}

	if createduser == nil || errors.Is(err, ErrorUserNotFound) {
		c.JSON(http.StatusBadRequest, gin.H{"error": ErrorUserNotFound.Error()})
		return		
	}
	userKyc, err := FindUserKYC(createduser.ID)
	if err != nil && !errors.Is(err, ErrorKYCNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if userKyc != nil {
		if userKyc.Status == "pending" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "kyc already uploaded, wait for it to be confirmed"})
			return
		}
		if userKyc.Status == "verified" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "kyc already uploaded and verified"})
			return
		}
		if userKyc.Status == "failed" {
			reason, err := checkUserKYCFailReason(userKyc.ID)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		
			c.JSON(http.StatusBadRequest, gin.H{"error": reason})
			return
		}
	}
	
	// create the kyc for the user
	level := c.PostForm("level")
	dept := c.PostForm("dept")
	nin := c.PostForm("nin")
	faculty := c.PostForm("faculty")
	matric := c.PostForm("matric")

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to get file from form data"})
		return
	}

	ninURL, err := UploadUserNIN(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	newKYC := db.UserKYC{
		Level:   level,
		Dept:    dept,
		NIN:     nin,
		Faculty: faculty,
		Matric:  matric,
		NINImg:  ninURL,
		UserID: createduser.ID,
	}

	if err := CreateUserKYC(newKYC); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Kyc uploaded successfully"})
}