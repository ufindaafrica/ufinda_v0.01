package userhostel

import (
	"net/http"
	"github.com/gin-gonic/gin"
    "io"
    "log"
    "strings"
    "net/url"
    "strconv"
	"fmt"
	"github.com/google/uuid"
    "errors"
    "encoding/json"
	"github.com/oladev/ufinda_v0.01/internal/db"
    "github.com/oladev/ufinda_v0.01/internal/db/hostel"
)

// return available hostels
func GetAvailableHostelHandler(c *gin.Context) {
    url := fmt.Sprintf("/rest/v1/hostels?is_available=eq.true")

    resp, err := db.MakeDBRequest("GET", url, nil, nil)

    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to connect to database API"})
        return
    }

    // Ensure the response body is always closed
    defer resp.Body.Close() 

    if resp.StatusCode != http.StatusOK {
        // ... (Error handling remains the same) ...
        bodyBytes, readErr := io.ReadAll(resp.Body)
        if readErr != nil {
            log.Printf("DB API Error: Failed to read error response body (Status: %d)", resp.StatusCode)
        } else {
            // Note: The variable 'url' is the correct one to log here.
            log.Printf("DB API Error: Status %d for URL %s. Response: %s", resp.StatusCode, url, string(bodyBytes))
        }

        c.JSON(http.StatusInternalServerError, gin.H{"error": "database retrieval failed"})
        return
    }

    var hostels []db.Hostel 
    
    // Decode directly from resp.Body. The Decode function will read the stream once.
    if err := json.NewDecoder(resp.Body).Decode(&hostels); err != nil {
        // Log the decoding error for debugging (e.g., mismatch between DB schema and Go struct)
        log.Printf("ERROR decoding DB response: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "error processing hostel data"})
        return
    }

    // Return the successfully decoded slice of structs as JSON to the client.
    c.JSON(http.StatusOK, hostels)
}

const DefaultPageSize = 20

func GetHostelBySearchQueryHandler(c *gin.Context) {
	// --- 1. Get and Sanitize Query Parameters ---
	
	searchTerm := strings.TrimSpace(c.Query("q"))
	
	// Get both min and max price
	minPriceStr := c.Query("price_min") 
	maxPriceStr := c.Query("price_max")
	
	hostelType := c.Query("type") // Maps to RoomType in your model

	// Sorting parameters
	sortBy := c.DefaultQuery("sort_by", "created_at") 
	order := c.DefaultQuery("order", "desc") 
	
	// Pagination
	pageStr := c.DefaultQuery("page", "1")
	page, _ := strconv.Atoi(pageStr)
	if page < 1 { page = 1 }
	offset := (page - 1) * DefaultPageSize
	
	// --- 2. Dynamically Build the PostgREST URL ---
	
	baseURL := "/rest/v1/hostels"
	params := url.Values{}

	// A. Full-Text Search (FTS) - Handles the primary text search
	if searchTerm != "" {
		// Replaces spaces with '&' for a valid tsquery (AND condition)
		safeSearchTerm := strings.ReplaceAll(searchTerm, " ", "&")
		params.Add("search_document", fmt.Sprintf("fts.%s", safeSearchTerm))
	}
	
	// B. Min/Max Price Filter (RentPerYear) - Numerical search remains exact
	
	// 1. Minimum Price (Greater Than or Equal to: gte)
	if minPriceStr != "" {
		if _, err := strconv.Atoi(minPriceStr); err == nil {
			params.Add("rent_per_year", fmt.Sprintf("gte.%s", minPriceStr))
		}
	}
	
	// 2. Maximum Price (Less Than or Equal to: lte)
	if maxPriceStr != "" {
		if _, err := strconv.Atoi(maxPriceStr); err == nil {
			// Standardizing key to 'rentperyear' for consistency
			params.Add("rent_per_year", fmt.Sprintf("lte.%s", maxPriceStr))
		}
	}
	
	// C. Type Filter (RoomType) 
	if hostelType != "" {
		params.Add("room_type", fmt.Sprintf("ilike.*%s*", hostelType)) 
	}

	// D. Availability Filter (Mandatory)
	params.Add("is_available", "eq.true") 
	
	// E. Sorting
	params.Add("order", fmt.Sprintf("%s.%s", sortBy, order))
	
	// F. Pagination
	params.Add("limit", fmt.Sprintf("%d", DefaultPageSize))
	params.Add("offset", fmt.Sprintf("%d", offset))

	finalURL := fmt.Sprintf("%s?%s", baseURL, params.Encode())
	
	resp, err := db.MakeDBRequest("GET", finalURL, nil, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to connect to database API"})
		return
	}

	defer resp.Body.Close() 

	if resp.StatusCode != http.StatusOK {

		bodyBytes, readErr := io.ReadAll(resp.Body)
		if readErr != nil {
			log.Printf("DB API Error: Failed to read error response body (Status: %d)", resp.StatusCode)
		} else {
			// Using finalURL for accurate logging
			log.Printf("DB API Error: Status %d for URL %s. Response: %s", resp.StatusCode, finalURL, string(bodyBytes))
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "database retrieval failed"})
		return
	}

	var hostel []db.Hostel
	if err := json.NewDecoder(resp.Body).Decode(&hostel); err != nil {
		log.Printf("ERROR decoding DB response: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error processing hostel data"})
		return
	}

	c.JSON(http.StatusOK, hostel)
}

func GetHostelByIdHandler(c *gin.Context) {
    id := c.Param("id")
    getHostel, err := hosteldb.FindHostelByID(id)
    if err != nil {
        if errors.Is(err, hosteldb.ErrorHostelNotFound) {
            c.JSON(http.StatusNotFound, gin.H{"error": "hostel not found"})
            return
        }else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "error fetching hostel"})
            return
        }
    }

    c.JSON(http.StatusOK, getHostel)
}

func GetSimilarHostelsHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
        // --- 1. Get Hostel ID from Path Parameter ---
		hostelID := c.Param("id")
		if hostelID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Hostel ID is required in the path"})
			return
		}

		limit := 10 // Default limit
		limitStr := c.Query("limit")
		if limitStr != "" {
			var err error
			limit, err = strconv.Atoi(limitStr)
			if err != nil || limit <= 0 {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid limit parameter"})
				return
			}
		}

		pageStr := c.DefaultQuery("page", "1")
		
		page, err := strconv.Atoi(pageStr)
        if err != nil || page < 1 {
             c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid page parameter. Must be an integer >= 1."})
             return
        }
		offset := (page - 1) * limit
        // fetch the base hostel
		baseHostel, err := hosteldb.FindHostelByID(hostelID)
		if err != nil {
			if err == hosteldb.ErrorHostelNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Hostel not found"})
				return
			}
            
			log.Printf("Error retrieving base hostel details: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve base hostel details"})
			return
		}
        

		similarHostels, err := hosteldb.FindSimilarHostels(baseHostel, limit, offset)
		if err != nil {
			log.Printf("Error fetching similar hostels: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch similar hostels"})
			return
		}

        // --- 5. Return the Results ---
		c.JSON(http.StatusOK, similarHostels)
	}
}

func AddToFavoritesHandler(c *gin.Context) {
	getUser, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	user, ok := getUser.(*db.User)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user type"})
		return
	}

	hostelId := c.Param("id")
	if hostelId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "hostel id cannot be empty"})
		return
	}

	favorite := db.Favorites{
		ID: uuid.New(),
		UserID: user.ID,
		HostelID: hostelId,
	}

	if err := hosteldb.AddToFavorites(favorite); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to add to favorites"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "successfully added to favorites"})
}