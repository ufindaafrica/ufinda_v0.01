package db

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"context"
	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"os"
	"time"
	"github.com/go-redis/redis/v8"
)

var BaseURL string
var APIKey string
var ServiceRoleKey string
var RedisClient *redis.Client

func InitDB() {
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_ANON_KEY")
	serviceKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	if supabaseURL == "" || supabaseKey == "" {
		panic("❌ SUPABASE_URL and SUPABASE_ANON_KEY required")
	}

	BaseURL = supabaseURL
	APIKey = supabaseKey
	ServiceRoleKey = serviceKey

	// Test database connection
	req, _ := http.NewRequest("GET", BaseURL+"/rest/v1/", nil)
	req.Header.Set("apikey", APIKey)

	client := &http.Client{Timeout: 20 * time.Second}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != 200 {
		panic("❌ Cannot connect to Supabase")
	}
	resp.Body.Close()

	fmt.Println("✅ Connected to Supabase REST API")
}

// Auth operations (uses service role key)
func MakeAuthRequest(method, endpoint string, data interface{}) (*http.Response, error) {
	if ServiceRoleKey == "" {
		return nil, fmt.Errorf("service role key not configured")
	}

	var body io.Reader
	if data != nil {
		jsonData, err := json.Marshal(data)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal JSON: %v", err)
		}
		body = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequest(method, BaseURL+endpoint, body)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("apikey", ServiceRoleKey)
	req.Header.Set("Authorization", "Bearer "+ServiceRoleKey)
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	return client.Do(req)
}

// Regular database operations (uses anon key)
func MakeDBRequest(method, endpoint string, data interface{}, headers map[string]string) (*http.Response, error) {
	var body io.Reader
	if data != nil {
		jsonData, err := json.Marshal(data)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal JSON: %v", err)
		}
		body = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequest(method, BaseURL+endpoint, body)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	// Default headers
	req.Header.Set("apikey", ServiceRoleKey)
	req.Header.Set("Authorization", "Bearer "+ServiceRoleKey)
	req.Header.Set("Content-Type", "application/json")

	// Add any additional headers passed in
	if headers != nil {
		for k, v := range headers {
			req.Header.Set(k, v)
		}
	}

	return http.DefaultClient.Do(req)
}

// DeleteCloudinaryAsset deletes an asset from Cloudinary using its Public ID and resource type.
func DeleteCloudinaryAsset(ctx context.Context, cld *cloudinary.Cloudinary, publicID string, resourceType string) error {
	if publicID == "" {
		return fmt.Errorf("public ID cannot be empty")
	}
	
	// Set deletion parameters
	params := uploader.DestroyParams{
		PublicID:     publicID,
		ResourceType: resourceType, // Should be "image" or "video"
		Invalidate: BoolPtr(true),
	}

	// Perform the deletion
	resp, err := cld.Upload.Destroy(ctx, params)
	if err != nil {
		return fmt.Errorf("failed to delete asset with public ID '%s' and resource type '%s': %w", publicID, resourceType, err)
	}

	// Cloudinary returns "ok" or "not_found" in the result field.
	// Check the result to see if the operation was successful.
	if resp.Result == "not found" {
		return fmt.Errorf("asset with public ID '%s' was not found on Cloudinary", publicID)
	}
    
    if resp.Result != "ok" {
        return fmt.Errorf("cloudinary returned status '%s' while deleting asset with public ID '%s'", resp.Result, publicID)
    }

	return nil
}

func BoolPtr(b bool) *bool {
	return &b
}