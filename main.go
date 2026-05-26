package main

import (
	"log"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/go-redis/redis/v8"
	"github.com/cloudinary/cloudinary-go/v2"
	"os"
	"github.com/gin-contrib/cors"
	"context"
	"github.com/hibiken/asynq"
	"github.com/oladev/ufinda_v0.01/internal/db"
	"github.com/oladev/ufinda_v0.01/internal/routes/auth"
	"github.com/oladev/ufinda_v0.01/internal/routes/kyc/user"
	"github.com/oladev/ufinda_v0.01/internal/routes/kyc/vendor"
	"github.com/oladev/ufinda_v0.01/internal/routes/hostel/vendor"
	"github.com/oladev/ufinda_v0.01/internal/routes/hostel/user"
	"github.com/oladev/ufinda_v0.01/internal/webhooks"
	"github.com/oladev/ufinda_v0.01/internal/sockets/kyc"
	"github.com/oladev/ufinda_v0.01/internal/sockets/chat"
	"github.com/oladev/ufinda_v0.01/internal/routes/metrics"
	"github.com/oladev/ufinda_v0.01/internal/routes/product/vendor"
	"github.com/oladev/ufinda_v0.01/internal/routes/notification"
)

var wsHub = hub.NewHub()

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
	go wsHub.Run()

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
	r.SetTrustedProxies([]string{"10.0.0.0/8"})

	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"https://ufinda.org","http://localhost:3000","http://127.0.0.1:3000"}
	config.AllowMethods = []string{"GET", "POST", "DELETE", "PATCH", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	r.Use(cors.New(config))
	// Public endpoints
	auth.RegisterAuth(r, cld)
	userkyc.RegisterKYC(r, cld)
	vendorkyc.RegisterKYC(r, cld)
	vendorproduct.RegisterVendorProduct(r, asynqClient, cld)
	metrics.RegisterMetrics(r)
	webhook.RegisterWebhooks(r, wsHub)
	notif.RegisterNotif(r)
	
	// Pass the Cloudinary client and the Asynq client to the hostel registration
	vendorhostel.RegisterHostel(r, cld)
	userhostel.RegisterApi(r)

	// hub connection
	r.GET("/ws", func(c *gin.Context) {
		hub.WSHandler(wsHub, c)
	})

	// Initialize chat service
	chatService := chat.NewSupabaseChatService(cld, db.RedisClient)
	hub := chat.NewHub(chatService)

	chatService.SetHub(hub)

	go hub.Run()

	// Chat endpoints
	chat.RegisterChat(r, chatService)
	
	// Start the Gin router
	r.Run(":" + port)
}
