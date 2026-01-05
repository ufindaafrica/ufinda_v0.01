package hosteldb

import (
	"fmt"
	"github.com/cloudinary/cloudinary-go/v2"
	"time"
	"context"
	"io"
	"errors"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"net/url"
	"github.com/cloudinary/cloudinary-go/v2/api/uploader"
	"github.com/oladev/ufinda_v0.01/internal/db"
)

var ErrorGettingHostel = errors.New("failed to get hostel")
var ErrorHostelNotFound = errors.New("hostel not found")

type hostelImageResponse struct {
    HostelImages []db.UploadedFile `json:"hostel_images"`
}

type hostelVideoResponse struct {
    HostelVideos []db.UploadedFile `json:"hostel_videos"`
}


// Function to generate the consistent SELECT query parameter
func GetEnrichedSelectQuery() string {
    return "*,vendor_info:fk_hostel_agent(id,first_name,last_name,phone,vendor_metrics(current_rating,total_ratings),vendor_kyc:fk_vendor_kyc(profile_img))"
}


func UploadHostelImages(cld *cloudinary.Cloudinary, reader io.Reader, filename string) (string, string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	uploadParams := uploader.UploadParams{
		Folder:   "hostel/images", // Correct folder for images
		PublicID: filename,
	}

	resp, err := cld.Upload.Upload(ctx, reader, uploadParams)
	if err != nil {
		return "", "", fmt.Errorf("failed to upload file to cloud service: %w", err)
	}

	return resp.SecureURL, resp.PublicID, nil
}

func UploadHostelVideos(cld *cloudinary.Cloudinary, reader io.Reader, filename string) (string, string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Minute) // Increased timeout for videos
	defer cancel()

	uploadParams := uploader.UploadParams{
		Folder:   "hostel/videos", // Correct folder for videos
		PublicID: filename,
		// Add resource type as 'video' for videos
		ResourceType: "video", 
	}
	
	resp, err := cld.Upload.Upload(ctx, reader, uploadParams)
	if err != nil {
		return "", "", fmt.Errorf("failed to upload file to cloud service: %w", err)
	}

	return resp.SecureURL, resp.PublicID, nil
}

func CreateHostel(data db.Hostel) error {
	url := fmt.Sprintf("/rest/v1/hostels")

	resp, err := db.MakeDBRequest("POST", url, data, nil)
	if err != nil {
		return fmt.Errorf("failed to add hostel: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		bodyBytes, readErr := io.ReadAll(resp.Body)
		if readErr != nil {
			return fmt.Errorf("failed to create log with status %d, and couldn't read response body: %w", resp.StatusCode, readErr)
		}

		bodyString := string(bodyBytes)
		return fmt.Errorf("failed to add hostel: server responded with status %d and body: %s", resp.StatusCode, bodyString)
	}
	
	return nil
}

// update hostel
func UpdateHostel(id string, data interface{}) error {
	url := fmt.Sprintf("/rest/v1/hostels?id=eq.%s", url.QueryEscape(id))

	header := map[string]string {
		"Prefer": "return=representation",
	}

	resp, err := db.MakeDBRequest("PATCH", url, data, header)

	if err != nil {
		return err
	}

	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to update hostel")
	}

	return nil
}

func FindHostelByID(id string) (*db.EnrichedHostel, error) {
    selectQuery := GetEnrichedSelectQuery()
    urlPath := fmt.Sprintf("/rest/v1/hostels?id=eq.%s&select=%s", url.QueryEscape(id), selectQuery)

    resp, err := db.MakeDBRequest("GET", urlPath, nil, nil)
    if err != nil {
        return nil, fmt.Errorf("failed to get hostel: %w", err)
    }

    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        bodyBytes, _ := io.ReadAll(resp.Body)

        log.Printf("failed to get hostel: Status %d for URL %s. Response: %s", resp.StatusCode, urlPath, string(bodyBytes))

        return nil, fmt.Errorf("failed to get hostel")
    }

    var hostel []db.EnrichedHostel

    if err := json.NewDecoder(resp.Body).Decode(&hostel); err != nil {
        return nil, err
    }

    if len(hostel) == 0 {
        return nil, ErrorHostelNotFound
    }

    // Return the enriched hostel pointer
    return &hostel[0], nil
}

func GetHostelImagesPublicIDAndUrl(id string) ([]db.UploadedFile, error) {
	url := fmt.Sprintf("/rest/v1/hostels?id=eq.%s&select=hostel_images", url.QueryEscape(id))

	resp, err := db.MakeDBRequest("GET", url, nil, nil)

	if err != nil {
		return nil, fmt.Errorf("failed to get hostel images id: %w", err)
	}
	defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        // Read the error body for logging purposes
        bodyBytes, readErr := io.ReadAll(resp.Body)
        if readErr != nil {
            log.Printf("DB API Error: Failed to read error response body (Status: %d)", resp.StatusCode)
        } else {
            log.Printf("DB API Error: Status %d for URL %s. Response: %s", resp.StatusCode, url, string(bodyBytes))
        }
        return nil, fmt.Errorf("failed to get media")
    }

	var rows []hostelImageResponse
    if err := json.NewDecoder(resp.Body).Decode(&rows); err != nil {
        return nil, fmt.Errorf("decode failed: %w", err)
    }

	if len(rows) == 0 {
		return nil, nil
	}

	return rows[0].HostelImages, nil
}

func GetHostelVideosPublicIDAndUrl(id string) ([]db.UploadedFile, error) {
	url := fmt.Sprintf("/rest/v1/hostels?id=eq.%s&select=hostel_videos", url.QueryEscape(id))

	resp, err := db.MakeDBRequest("GET", url, nil, nil)

	if err != nil {
		return nil, fmt.Errorf("failed to get hostel videos id: %w", err)
	}
	defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        bodyBytes, readErr := io.ReadAll(resp.Body)
        if readErr != nil {
            log.Printf("DB API Error: Failed to read error response body (Status: %d)", resp.StatusCode)
        } else {
            log.Printf("DB API Error: Status %d for URL %s. Response: %s", resp.StatusCode, url, string(bodyBytes))
        }
        return nil, fmt.Errorf("failed to get media")
    }

	var rows []hostelVideoResponse
    if err := json.NewDecoder(resp.Body).Decode(&rows); err != nil {
        return nil, fmt.Errorf("decode failed: %w", err)
    }

	if len(rows) == 0 {
		return nil, nil
	}

	return rows[0].HostelVideos, nil
}

func DeleteHostel(id string) error {
	url := fmt.Sprintf("/rest/v1/hostels?id=eq.%s", url.QueryEscape(id))

	resp, err := db.MakeDBRequest("DELETE", url, nil, nil)

	if err != nil {
		return fmt.Errorf("failed to delete hostel: %w", err)
	}

	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		return fmt.Errorf("failed to delete listing")
	}
	
	return nil
}

func FindVendorHostels(vendorID string) ([]db.Hostel, error) {
	url := fmt.Sprintf("/rest/v1/hostels?vendor_id=eq.%s", url.QueryEscape(vendorID))
    
    resp, err := db.MakeDBRequest("GET", url, nil, nil)

    if err != nil {
        return nil, fmt.Errorf("failed to get hostels: %w", err)
    }

    defer resp.Body.Close() 

    if resp.StatusCode != http.StatusOK {
        bodyBytes, readErr := io.ReadAll(resp.Body)
        if readErr != nil {
            log.Printf("DB API Error: Failed to read error response body (Status: %d)", resp.StatusCode)
        } else {
            log.Printf("DB API Error: Status %d for URL %s. Response: %s", resp.StatusCode, url, string(bodyBytes))
        }
        return nil, fmt.Errorf("failed to get hostels")
    }

	var hostel []db.Hostel
	if err := json.NewDecoder(resp.Body).Decode(&hostel); err != nil {
		return nil, fmt.Errorf("failed to get hostels: %w", err)
	}

	if len(hostel) == 0 {
		return nil, ErrorHostelNotFound
	}

	return hostel, nil
}

func FindSimilarHostels(baseHostel *db.EnrichedHostel, limit int, offset int) ([]db.EnrichedHostel, error) {
    // --- 1. Calculate Rent Range (in Naira) ---
    const NairaTolerance int64 = 50000 
    const TableName = "hostels"
    
    minRent := baseHostel.TotalPrice - NairaTolerance
    if minRent < 0 {
        minRent = 0
    }
    maxRent := baseHostel.TotalPrice + NairaTolerance

    query := url.Values{}
    
    query.Set("select", GetEnrichedSelectQuery()) 
    
    query.Set("limit", strconv.Itoa(limit))
    query.Set("offset", strconv.Itoa(offset))
    query.Set("id", fmt.Sprintf("neq.%s", baseHostel.ID))
    query.Set("location", fmt.Sprintf("ilike.%s", baseHostel.Location))
    query.Set("room_type", fmt.Sprintf("ilike.%s", baseHostel.RoomType))
    query.Set("landlord_resides", fmt.Sprintf("eq.%s", url.QueryEscape(baseHostel.LandlordResides)))
    query.Set("roommates_allowed", fmt.Sprintf("eq.%s", url.QueryEscape(baseHostel.RoommatesAllowed)))
    query.Set("kitchen_access", fmt.Sprintf("eq.%s", url.QueryEscape(baseHostel.KitchenAccess)))
    query.Set("toilet_access", fmt.Sprintf("eq.%s", url.QueryEscape(baseHostel.ToiletAccess)))
    query.Set("total_price", fmt.Sprintf("gte.%d", minRent))
    query.Add("total_price", fmt.Sprintf("lte.%d", maxRent))
    query.Set("order", "created_at.desc")

    urlPath := fmt.Sprintf("/rest/v1/%s?%s", TableName, query.Encode())

    resp, err := db.MakeDBRequest("GET", urlPath, nil, nil) 
    if err != nil {
        return nil, fmt.Errorf("failed to get similar hostels: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        bodyBytes, _ := io.ReadAll(resp.Body)
        return nil, fmt.Errorf("failed to get similar hostels from API (Status: %d). Response: %s", resp.StatusCode, string(bodyBytes))
    }

    var similarHostels []db.EnrichedHostel
    if err := json.NewDecoder(resp.Body).Decode(&similarHostels); err != nil {
        return nil, fmt.Errorf("failed to get similar hostels: %w", err)
    }
    return similarHostels, nil
}

func AddToFavorites(fav db.Favorites) error {
	url := fmt.Sprintf("/rest/v1/favorites")

	resp, err := db.MakeDBRequest("POST", url, fav, nil)

	if err != nil {
		return fmt.Errorf("failed to add to favorites: %w", err)
	}

	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		bodyBytes, readErr := io.ReadAll(resp.Body)
		if readErr != nil {
			return fmt.Errorf("%w", readErr)
		}

		bodyString := string(bodyBytes)
		return fmt.Errorf("fsiled to add to favorites: %s", bodyString)
	}

	return nil
}

func GetFavoritesHostel(userId string) ([]db.EnrichedHostel, error) {
    selectQuery := fmt.Sprintf("hostels(%s)", GetEnrichedSelectQuery())

    params := url.Values{}
    params.Set("user_id", "eq."+userId)
    params.Set("select", selectQuery)

    baseURL := "/rest/v1/favorites"
    finalURL := fmt.Sprintf("%s?%s", baseURL, params.Encode())

    resp, err := db.MakeDBRequest("GET", finalURL, nil, nil)
    if err != nil {
        return nil, fmt.Errorf("failed to get favorites: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        bodyBytes, _ := io.ReadAll(resp.Body)
        return nil, fmt.Errorf("failed to get favorites (Status: %d). Response: %s", 
            resp.StatusCode, string(bodyBytes))
    }

    type nestedFavorite struct {
        Hostel db.EnrichedHostel `json:"hostels"`
    }

    var rawData []nestedFavorite
    if err := json.NewDecoder(resp.Body).Decode(&rawData); err != nil {
        return nil, fmt.Errorf("failed to decode favorites response: %w", err)
    }

    // 3. Flatten the results into a simple slice of EnrichedHostel
    enrichedHostels := make([]db.EnrichedHostel, 0, len(rawData))
    for _, item := range rawData {
        enrichedHostels = append(enrichedHostels, item.Hostel)
    }

    return enrichedHostels, nil
}

func DeleteFromFavorites(userId string, roomId string) error {
	url := fmt.Sprintf("/rest/v1/favorites?user_id=eq.%s&hostel_id=eq.%s", url.QueryEscape(userId), url.QueryEscape(roomId))

	resp, err := db.MakeDBRequest("DELETE", url, nil, nil)
	if err != nil {
		return fmt.Errorf("failed to delete from favorites: %w", err)
	}

	defer resp.Body.Close()

	if resp.StatusCode != http.StatusNoContent {
		bodyBytes, _ := io.ReadAll(resp.Body)
        return fmt.Errorf("failed to delete from favorites hostels (Status: %d). "+
    	"Response: %s", resp.StatusCode, string(bodyBytes))
	}

	return nil
}

func GetAllAgentHostels(vendorID string) ([]db.EnrichedHostel, error) {
	selectQuery := GetEnrichedSelectQuery()
	url := fmt.Sprintf("/rest/v1/hostels?vendor_id=eq.%s&select=%s", url.QueryEscape(vendorID), selectQuery)
    
    resp, err := db.MakeDBRequest("GET", url, nil, nil)

    if err != nil {
        return nil, fmt.Errorf("failed to get all agent's hostels: %w", err)
    }

    defer resp.Body.Close() 

    if resp.StatusCode != http.StatusOK {
        bodyBytes, _ := io.ReadAll(resp.Body)

        log.Printf("failed to get all agent's hostels: Status %d for URL %s. Response: %s", resp.StatusCode, url, string(bodyBytes))

        return nil, fmt.Errorf("failed to get all agent's hostels")
    }

	var allHostels []db.EnrichedHostel

	if err := json.NewDecoder(resp.Body).Decode(&allHostels); err != nil {
		return nil, fmt.Errorf("failed to get all agent's hostels: %w", err)
	}

	return allHostels, nil
}