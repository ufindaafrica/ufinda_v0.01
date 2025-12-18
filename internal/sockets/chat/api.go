package chat

import (
	"github.com/gin-gonic/gin"
	"github.com/oladev/ufinda_v0.01/internal/routes/auth"
)

func RegisterChat(r *gin.Engine, chatService *SupabaseChatService) {
    wsGroup := r.Group("/ws", auth.AuthMiddleware()) 
    {
        wsGroup.GET("/chat", chatService.HandleWebSocket) 
    }

    // Chat REST API Group
    chatAPI := r.Group("/chat", auth.AuthMiddleware())
    {
        chatAPI.POST("/rooms", chatService.CreateChatRoomHandler)
        chatAPI.GET("/rooms", chatService.GetUserChatRoomsHandler)
        chatAPI.GET("/rooms/with-last-message", chatService.GetUserChatRoomsWithLastMessageHandler)
        chatAPI.POST("/messages", chatService.SendMessageHandler)
        chatAPI.GET("/messages", chatService.GetChatHistoryHandler)
        chatAPI.POST("/messages/mark-read", chatService.MarkMessagesAsReadHandler)
        chatAPI.GET("/unread-count", chatService.GetUnreadCountHandler)
        chatAPI.POST("/upload-img", chatService.HandleImageUpload)
    }
}
