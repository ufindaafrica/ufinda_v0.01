package auth

import (
	"github.com/gin-gonic/gin"
	"github.com/cloudinary/cloudinary-go/v2"
)

func RegisterAuth(r *gin.Engine, cld *cloudinary.Cloudinary) {
	authRoutes := r.Group("/auth")
	{
		authRoutes.POST("/email/signup", EmailSignUpHandler)
		authRoutes.POST("/verify-otp", VerifyOtpHandler)
		authRoutes.POST("email/login", EmailLoginHandler)
		authRoutes.POST("/otp/resend", ResendOTPHandler)
		authRoutes.GET("/logout", LogoutHandler)
		authRoutes.GET("/token/refresh", RefreshTokenHandler)
		authRoutes.DELETE("/account/delete", AuthMiddleware(), DeleteCreatedUser(cld))
		authRoutes.POST("/forget-pwd", ForgetPwd)
		authRoutes.POST("/reset-pwd", ResetPwd)
		authRoutes.PATCH("/change-pwd", AuthMiddleware(), ChangePassword)
	}
}