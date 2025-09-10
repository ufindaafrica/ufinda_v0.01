package auth

import (
	"github.com/gin-gonic/gin"
	"github.com/oladev/ufinda_v0.01/internal/routes/auth"
)

func RegisterAuth(r *gin.Engine) {
	authRoutes := r.Group("/auth")
	{
		authRoutes.POST("/email/signup", EmailSignUpHandler)
		authRoutes.POST("/verify-otp", VerifyOtpHandler)
		authRoutes.POST("email/login", EmailLoginHandler)
		authRoutes.POST("/otp/resend", ResendOTPHandler)
		authRoutes.GET("/logout", authmiddleware.AuthMiddleware(), LogoutHandler)
		authRoutes.GET("/token/refresh", RefreshTokenHandler)
	}
}