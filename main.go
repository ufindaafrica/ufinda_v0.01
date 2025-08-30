package main

import (
	"log"
	"uFinda/internal/db"
	"uFinda/internal/routes/auth/client"
	"uFinda/internal/routes/kyc/client"
	// "uFinda/internal/sockets"
	
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/go-redis/redis/v8"
	"context"
)


func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("error loading .env")
	}

	db.InitDB()

	ctx := context.Background()
	// connect to redis
	db.RedisClient = redis.NewClient(&redis.Options{
        Addr:     "localhost:6379", // Use your Redis server address
        Password: "",               // No password set
        DB:       0,                // Use the default DB
    })

    // Ping the Redis server to ensure connection
    _, err := db.RedisClient.Ping(ctx).Result()
    if err != nil {
        panic("Could not connect to Redis: " + err.Error())
    }

	r := gin.Default()

	// Public endpoints
	clientauth.RegisterAuth(r)
	userkyc.RegisterKYC(r)

	// // Initialize chat service
	// hub := chat.NewHub()
	// go hub.Run()
	// chatService := chat.NewSupabaseChatService(hub)
	// hub.ChatService = chatService

	// // Chat WebSocket endpoint
	// r.GET("/ws/chat", gin.WrapH(http.HandlerFunc(chatService.HandleWebSocket)))

	// // Chat API endpoints
	// chatAPI := r.Group("/api/chat")
	// {
	// 	chatAPI.POST("/rooms", gin.WrapH(http.HandlerFunc(chatService.CreateChatRoomHandler)))
	// 	chatAPI.GET("/rooms", gin.WrapH(http.HandlerFunc(chatService.GetUserChatRoomsHandler)))
	// 	chatAPI.GET("/rooms/with-last-message", gin.WrapH(http.HandlerFunc(chatService.GetUserChatRoomsWithLastMessageHandler)))
	// 	chatAPI.POST("/messages", gin.WrapH(http.HandlerFunc(chatService.SendMessageHandler)))
	// 	chatAPI.GET("/messages", gin.WrapH(http.HandlerFunc(chatService.GetChatHistoryHandler)))
	// 	chatAPI.POST("/messages/mark-read", gin.WrapH(http.HandlerFunc(chatService.MarkMessagesAsReadHandler)))
	// 	chatAPI.GET("/unread-count", gin.WrapH(http.HandlerFunc(chatService.GetUnreadCountHandler)))
	// }

	// // Protected endpoints (require authentication)
	// // protected := r.Group("/api")
	// // protected.Use(routes.AuthMiddleware())

	// // Example protected route
	// // protected.GET("/profile", routes.GetProfile)

	// log.Println("Chat service initialized and routes registered")
	// log.Println("Server starting on :8080")
	
	// // Start server
	r.Run(":8080")
}
