package main

import (
	"log"
	"os"
	"context"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/hibiken/asynq"
	"github.com/joho/godotenv"
	"github.com/oladev/ufinda_v0.01/internal/db"
	"github.com/oladev/ufinda_v0.01/internal/tasks/hostel"
)

func main() {
	if _, err := os.Stat(".env"); err == nil {
        if err := godotenv.Load(); err != nil {
            log.Println("Warning: Could not load .env file")
        }
    }

	db.BaseURL = os.Getenv("SUPABASE_URL")
	db.ServiceRoleKey = os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	cld, err := cloudinary.NewFromParams(
		os.Getenv("CLOUDINARY_CLOUD_NAME"),
		os.Getenv("CLOUDINARY_API_KEY"),
		os.Getenv("CLOUDINARY_API_SECRET"),
	)
	if err != nil {
		log.Fatalf("Failed to initialize Cloudinary client: %v", err)
	}

	RedisUrl := os.Getenv("REDIS_URL")
	if RedisUrl == "" {
		RedisUrl = "localhost:6379"
	}

	
	redisOpt := asynq.RedisClientOpt{
		Addr: RedisUrl,
		Password: "",
		DB: 0,
	}
	
	server := asynq.NewServer(
		redisOpt,
		asynq.Config{
			Concurrency: 10,
		},
	)

	mux := asynq.NewServeMux()
	
	// Register the task handler function using a closure
	mux.HandleFunc(tasks.TypeHostelMediaUpload, func(ctx context.Context, t *asynq.Task) error {
		return tasks.HandleHostelMediaUpload(cld, ctx, t)
	})

	if err := server.Run(mux); err != nil {
		log.Fatalf("Could not run asynq server: %v", err)
	}
}
