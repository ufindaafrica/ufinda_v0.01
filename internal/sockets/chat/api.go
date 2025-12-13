package chat

import (
	"github.com/gin-gonic/gin"
	"github.com/oladev/ufinda_v0.01/internal/routes/auth"
	"net/http"
)

func RegisterChat(r *gin.Engine, chatService *SupabaseChatService) {
	wsGroup := r.Group("/ws", auth.AuthMiddleware()) 
    {
        wsGroup.GET("/chat", chatService.HandleWebSocket) // <--- FIX IS HERE
    }

	chatAPI := r.Group("/chat")
	{
		chatAPI.POST("/rooms", auth.AuthMiddleware(), gin.WrapH(http.HandlerFunc(chatService.CreateChatRoomHandler)))
		chatAPI.GET("/rooms", auth.AuthMiddleware(), gin.WrapH(http.HandlerFunc(chatService.GetUserChatRoomsHandler)))
		chatAPI.GET("/rooms/with-last-message", auth.AuthMiddleware(), gin.WrapH(http.HandlerFunc(chatService.GetUserChatRoomsWithLastMessageHandler)))
		chatAPI.POST("/messages", auth.AuthMiddleware(), gin.WrapH(http.HandlerFunc(chatService.SendMessageHandler)))
		chatAPI.GET("/messages", auth.AuthMiddleware(), gin.WrapH(http.HandlerFunc(chatService.GetChatHistoryHandler)))
		chatAPI.POST("/messages/mark-read", auth.AuthMiddleware(), gin.WrapH(http.HandlerFunc(chatService.MarkMessagesAsReadHandler)))
		chatAPI.GET("/unread-count", auth.AuthMiddleware(), gin.WrapH(http.HandlerFunc(chatService.GetUnreadCountHandler)))
		chatAPI.POST("/upload-img", auth.AuthMiddleware(), gin.WrapH(http.HandlerFunc(chatService.HandleImageUpload)))
	}
}
