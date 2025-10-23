package main

import (
	"log"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/go-redis/redis/v8"
	"github.com/cloudinary/cloudinary-go/v2"
	"os"
	"context"
	"github.com/hibiken/asynq"
	"github.com/oladev/ufinda_v0.01/internal/db"
	"github.com/oladev/ufinda_v0.01/internal/routes/auth/client"
	"github.com/oladev/ufinda_v0.01/internal/routes/kyc/client"
	"github.com/oladev/ufinda_v0.01/internal/routes/hostel"
	// "uFinda/internal/sockets"
)


func main() {
	if _, err := os.Stat(".env"); err == nil {
        if err := godotenv.Load(); err != nil {
            log.Println("Warning: Could not load .env file")
        }
    }

	port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }

	redisURL := os.Getenv("REDIS_URL")
    if redisURL == "" {
        redisURL = "localhost:6379"
    }

	db.InitDB()

	ctx := context.Background()

	// Connect to Redis for both the API and the Asynq client
	redisOpt := &redis.Options{
		Addr:     redisURL, // Use your Redis server address
		Password: "",               // No password set
		DB:       0,                // Use the default DB
	}

	db.RedisClient = redis.NewClient(redisOpt)

	// Ping the Redis server to ensure connection
	_, err := db.RedisClient.Ping(ctx).Result()
	if err != nil {
		log.Fatalf("Could not connect to Redis: %v", err)
	}

	// Create an Asynq client
	asynqClient := asynq.NewClient(asynq.RedisClientOpt{Addr: redisOpt.Addr})
	defer asynqClient.Close()

	cld, err := cloudinary.NewFromParams(
		os.Getenv("CLOUDINARY_CLOUD_NAME"),
		os.Getenv("CLOUDINARY_API_KEY"),
		os.Getenv("CLOUDINARY_API_SECRET"),
	)
	if err != nil {
		log.Fatalf("Failed to initialize Cloudinary client: %v", err)
	}

	r := gin.Default()

	// Public endpoints
	auth.RegisterAuth(r, cld)
	userkyc.RegisterKYC(r, cld)
	
	// Pass the Cloudinary client and the Asynq client to the hostel registration
	hostel.RegisterHostel(r, asynqClient, cld)

	// Start the Gin router
	// r.Run(":8080")

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
	r.Run(":" + port)
}
