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
    "encoding/json"
	"github.com/oladev/ufinda_v0.01/internal/db"
	"github.com/oladev/ufinda_v0.01/internal/logs/hostel"
    "github.com/oladev/ufinda_v0.01/internal/db/hostel"
)

func GetAvailableHostelHandler(c *gin.Context) {
	// Pagination
	pageStr := c.DefaultQuery("page", "1")
	page, _ := strconv.Atoi(pageStr)
	if page < 1 { page = 1 }
	offset := (page - 1) * DefaultPageSize

    selectQuery := "*,vendor_info:fk_hostel_agent(first_name,last_name,phone,vendor_metrics(current_rating,total_ratings),fk_vendor_kyc(profile_img))"
    
    params := url.Values{}
    params.Set("select", selectQuery)
    params.Set("is_available", "eq.true")
    params.Set("limit", strconv.Itoa(DefaultPageSize))
    params.Set("offset", strconv.Itoa(offset))
    params.Set("order", "created_at.desc")

    finalURL := fmt.Sprintf("/rest/v1/hostels?%s", params.Encode())

    // 3. Make the Request
    resp, err := db.MakeDBRequest("GET", finalURL, nil, nil)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
        return
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        bodyBytes, _ := io.ReadAll(resp.Body)
        log.Printf("[CRITICAL] DB API Error: Status %d for URL %s. Response: %s", resp.StatusCode, finalURL, string(bodyBytes))
        c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
        return
    }

    var hostels []db.EnrichedHostel 
    if err := json.NewDecoder(resp.Body).Decode(&hostels); err != nil {
        log.Printf("[CRITICAL] ERROR decoding DB response: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
        return
    }

    c.JSON(http.StatusOK, hostels)
}

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
		words := strings.Fields(searchTerm)
    	cleanSearchTerm := strings.Join(words, " ")
		params.Add("search_document", fmt.Sprintf("plfts.%s", cleanSearchTerm))
	}
	
	// B. Min/Max Price Filter (RentPerYear) - Numerical search remains exact
	
	// 1. Minimum Price (Greater Than or Equal to: gte)
	if minPriceStr != "" {
		if _, err := strconv.Atoi(minPriceStr); err == nil {
			params.Add("total_price", fmt.Sprintf("gte.%s", minPriceStr))
		}
	}
	
	// 2. Maximum Price (Less Than or Equal to: lte)
	if maxPriceStr != "" {
		if _, err := strconv.Atoi(maxPriceStr); err == nil {
			// Standardizing key to 'rentperyear' for consistency
			params.Add("total_price", fmt.Sprintf("lte.%s", maxPriceStr))
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

	enrichedHostels, err := makeEnrichedHostelRequest(
        "GET", 
        baseURL, 
        params.Encode(),
    )
    
    if err != nil {
        log.Printf("[CRITICAL] ERROR during enriched search request: %v", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
        return
    }

    // --- 5. Return the Results ---
    // Return the new enriched struct type
    c.JSON(http.StatusOK, enrichedHostels)
}

func GetHostelByIdHandler(c *gin.Context) {
    id := c.Param("id")
    
    // Build parameters to filter by ID
    params := url.Values{}
    params.Add("id", fmt.Sprintf("eq.%s", id))
    
    enrichedHostels, err := makeEnrichedHostelRequest(
        "GET", 
        "/rest/v1/hostels", 
        params.Encode(),
    )
    
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
        return
    }

    if len(enrichedHostels) == 0 {
        c.JSON(http.StatusNotFound, gin.H{"error": "Hostel not found"})
        return
    }
    
    // Return the single enriched hostel object
    c.JSON(http.StatusOK, enrichedHostels[0]) 
}

func GetSimilarHostelsHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
        // --- 1. Get Hostel ID from Path Parameter ---
		hostelID := c.Param("id")
		if hostelID == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Hostel ID is required"})
			return
		}

		// Pagination
		pageStr := c.DefaultQuery("page", "1")
		page, _ := strconv.Atoi(pageStr)
		if page < 1 { page = 1 }
		offset := (page - 1) * DefaultPageSize

		baseHostel, err := hosteldb.FindHostelByID(hostelID)
		if err != nil {
			if err == hosteldb.ErrorHostelNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Hostel not found"})
				return
			}
            
			log.Printf("[CRITICAL] Error retrieving base hostel details: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
			return
		}
        

		similarHostels, err := hosteldb.FindSimilarHostels(baseHostel, DefaultPageSize, offset)
		if err != nil {
			log.Printf("[CRITICAL] Error fetching similar hostels: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
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
		UserID: user.ID,
		HostelID: hostelId,
	}

	if err := hosteldb.AddToFavorites(favorite); err != nil {
		hostellog.LogHostel(user.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "successfully added to favorites"})
}

func GetFavoritesHostelHandler(c *gin.Context) {
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

	favHostels, err := hosteldb.GetFavoritesHostel(user.ID)
	if err != nil {
		hostellog.LogHostel(user.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	c.JSON(http.StatusOK, favHostels)
}

func DeleteFromFavoritesHandler(c *gin.Context) {
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

	hostelID := c.Param("id")
	if err := hosteldb.DeleteFromFavorites(user.ID, hostelID); err != nil {
		hostellog.LogHostel(user.ID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "hostel successfully removed from favorites"})
}

func GetAllAgentHostelsHandler(c *gin.Context) {
	getUser, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}

	_, ok := getUser.(*db.User)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user type"})
		return
	}

	vendorID := c.Param("vendor_id")
	allAgentHostels, err := hosteldb.GetAllAgentHostels(vendorID)
	if err != nil {
		log.Print("[CRITICAL] %w", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	c.JSON(http.StatusOK, allAgentHostels)
}