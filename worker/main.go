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
	if err := godotenv.Load(); err != nil {
		log.Fatal("error loading .env")
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

	redisOpt := asynq.RedisClientOpt{Addr: "localhost:6379"}
	
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