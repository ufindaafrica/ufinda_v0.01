package clientauth

import (
	"github.com/gin-gonic/gin"
	"uFinda/internal/routes/auth"
)

func RegisterAuth(r *gin.Engine) {
	authRoutes := r.Group("/auth")
	{
		authRoutes.POST("/email/signup", EmailSignUpHandler)
		authRoutes.POST("/verify-otp", VerifyOtpHandler)
		authRoutes.POST("email/login", EmailLoginHandler)
		authRoutes.POST("/otp/resend", ResendOTPHandler)
		authRoutes.GET("/logout", auth.AuthMiddleware(), LogoutHandler)
		authRoutes.GET("/token/refresh", RefreshTokenHandler)
	}
}