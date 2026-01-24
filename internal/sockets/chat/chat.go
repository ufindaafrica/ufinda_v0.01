package chat

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"github.com/go-redis/redis/v8"
	"context"
	"sync"
	"net/url"
	"strings"
	"time"
	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/oladev/ufinda_v0.01/internal/db"
	"github.com/oladev/ufinda_v0.01/internal/db/notification" // Imported as requested
	chatlog "github.com/oladev/ufinda_v0.01/internal/logs/chat"
)

// WebSocket upgrader with origin check
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		if origin == "" {
			return true // Allow non-browser requests (e.g., Postman)
		}
		allowedOrigins := []string{
			"https://ufinda-v0-01.onrender.com",
		}
		for _, allowed := range allowedOrigins {
			if origin == allowed {
				return true
			}
		}
		log.Printf("WebSocket origin check failed for origin: %s", origin)
		return false
	},
}

// --- Core chat types ---

type RecipientProfile struct {
    UserID      string  `json:"user_id"`
    DisplayName string  `json:"display_name"` // Username for Vendor, First+Last for Buyer
    Phone       string  `json:"phone"`
    ProfileImg  *string `json:"profile_img"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type ChatRoom struct {
	ID        string    `json:"id"`
	BuyerID   string    `json:"buyer_id"`
	VendorID  string    `json:"vendor_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Recipient *RecipientProfile `json:"recipient_info,omitempty"`
}

type Message struct {
	ID           string     `json:"id"`
	ChatRoomID   string     `json:"chat_room_id"`
	SenderID     string     `json:"sender_id"`
	Content      string     `json:"content"`
	MessageType  string     `json:"message_type"`
	IsRead       bool       `json:"is_read"`
	PublicID     *string    `json:"public_id,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	DeliveredAt  *time.Time `json:"delivered_at,omitempty"`
}

type ChatMessage struct {
	ID           string     `json:"id"`
	ChatRoomID   string     `json:"chat_room_id"`
	SenderID     string     `json:"sender_id"`
	Content      string     `json:"content"`
	MessageType  string     `json:"message_type"`
	PublicID     *string    `json:"public_id,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
	SenderName   string     `json:"sender_name"`
	DeliveredAt  *time.Time `json:"delivered_at,omitempty"`
	NewChanges *map[string]interface{} `json:"new_changes"`
}

type WSMessage struct {
	Type      string          `json:"type"`
	Payload   json.RawMessage `json:"payload"`
	MessageID string          `json:"message_id,omitempty"`
}

type JoinRoomPayload struct {
	RoomID string `json:"room_id"`
}

type LeaveRoomPayload struct {
	RoomID string `json:"room_id"`
}

type SendMessagePayload struct {
	ChatRoomID  string  `json:"room_id"`
	Content     string  `json:"content"`
	MessageType string  `json:"message_type"`
	PublicID    *string `json:"public_id,omitempty"`
}

type NewMessagePayload ChatMessage

type MessageDeliveredPayload struct {
	MessageID string `json:"message_id"`
}

type ErrorPayload struct {
	Message string `json:"message"`
}

// --- Rate Limiter ---
type RateLimiter struct {
	userMessages map[string]int
	lastReset    map[string]time.Time
	limit        int
	interval     time.Duration
	mutex        sync.Mutex
}

func NewRateLimiter(limit int, interval time.Duration) *RateLimiter {
	return &RateLimiter{
		userMessages: make(map[string]int),
		lastReset:    make(map[string]time.Time),
		limit:        limit,
		interval:     interval,
		mutex:        sync.Mutex{},
	}
}

func (rl *RateLimiter) Allow(userID string) bool {
	rl.mutex.Lock()
	defer rl.mutex.Unlock()

	now := time.Now()
	if lastReset, ok := rl.lastReset[userID]; !ok || now.Sub(lastReset) > rl.interval {
		rl.userMessages[userID] = 0
		rl.lastReset[userID] = now
	}

	if rl.userMessages[userID] < rl.limit {
		rl.userMessages[userID]++
		return true
	}
	return false
}

// --- WebSocket Client ---
type Client struct {
	UserID   string
	Username string
	Conn     *websocket.Conn
	Hub      *Hub
	Send     chan WSMessage
	mutex    sync.Mutex
}

func (c *Client) ReadPump() {
	defer func() {
		log.Printf("Client %s: Disconnecting. Cleaning up resources.", c.UserID)
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(512)
	c.Conn.SetReadDeadline(time.Now().Add(70 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(70 * time.Second))
		return nil
	})

	for {
		var rawMsg WSMessage
		err := c.Conn.ReadJSON(&rawMsg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("[ERROR] WebSocket unexpected close for user %s: %v", c.UserID, err)
			} else if err != io.EOF {
				log.Printf("[ERROR] WebSocket read error for user %s: %v", c.UserID, err)
			}
			break
		}

		switch rawMsg.Type {
		case "join_room":
			var payload JoinRoomPayload
			if err := json.Unmarshal(rawMsg.Payload, &payload); err != nil {
				log.Printf("[ERROR] Client %s: Failed to unmarshal join_room payload: %v", c.UserID, err)
				c.SendError("Invalid join_room payload")
				continue
			}
			if _, err := uuid.Parse(payload.RoomID); err != nil {
				log.Printf("[ERROR] Client %s: Invalid room_id UUID: %s", c.UserID, payload.RoomID)
				c.SendError("Invalid room_id format")
				continue
			}
			c.Hub.JoinRoom(c, payload.RoomID)

		case "leave_room":
			var payload LeaveRoomPayload
			if err := json.Unmarshal(rawMsg.Payload, &payload); err != nil {
				log.Printf("[ERROR] Client %s: Failed to unmarshal leave_room payload: %v", c.UserID, err)
				c.SendError("Invalid leave_room payload")
				continue
			}
			if _, err := uuid.Parse(payload.RoomID); err != nil {
				log.Printf("[ERROR] Client %s: Invalid room_id UUID: %s", c.UserID, payload.RoomID)
				c.SendError("Invalid room_id format")
				continue
			}
			c.Hub.LeaveRoom(c, payload.RoomID)

		case "message":
			if !c.Hub.RateLimiter.Allow(c.UserID) {
				log.Printf("[ERROR] Client %s: Rate limit exceeded.", c.UserID)
				c.SendError("Rate limit exceeded. Please wait.")
				continue
			}

			var payload SendMessagePayload
			if err := json.Unmarshal(rawMsg.Payload, &payload); err != nil {
				log.Printf("[ERROR] Client %s: Failed to unmarshal message payload: %v", c.UserID, err)
				c.SendError("Invalid message payload")
				continue
			}

			msgType := payload.MessageType
			if msgType == "" {
				msgType = "text"
			}

			maxContentLength := 1000
			if msgType == "text" {
				// Use maxContentLength = 1000
			} else if msgType == "image" || msgType == "audio" {
				maxContentLength = 500 // Max URL length
				if payload.PublicID == nil {
					c.SendError("message missing PublicID")
					continue
				}
			} else {
				c.SendError(fmt.Sprintf("Unsupported message type: %s", msgType))
				continue
			}

			if len(payload.Content) == 0 || len(payload.Content) > maxContentLength {
				c.SendError(fmt.Sprintf("Content invalid length (max %d characters) for type %s", maxContentLength, msgType))
				continue
			}

			if msgType == "text" {
				payload.PublicID = nil
			}
			_, err := c.Hub.ChatService.SendMessage(payload.ChatRoomID, c.UserID, payload.Content, msgType, payload.PublicID)
			if err != nil {
				log.Printf("[CRITICAL] Client %s: Failed to persist message: %v", c.UserID, err)
				c.SendError("Failed to save message")
				continue
			}

		case "pong":
			// Handled by SetPongHandler
		default:
			log.Printf("[ERROR] Client %s: Unknown WS message type: %s", c.UserID, rawMsg.Type)
			c.SendError(fmt.Sprintf("Unknown message type: %s", rawMsg.Type))
		}
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case msg, ok := <-c.Send:
			if !ok {
				log.Printf("[ERROR] Client %s: Send channel closed. Sending close message.", c.UserID)
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			c.mutex.Lock()
			err := c.Conn.WriteJSON(msg)
			c.mutex.Unlock()
			if err != nil {
				log.Printf("[ERROR] Client %s: WebSocket write error: %v", c.UserID, err)
				return
			}
		case <-ticker.C:
			c.mutex.Lock()
			err := c.Conn.WriteMessage(websocket.PingMessage, nil)
			c.mutex.Unlock()
			if err != nil {
				log.Printf("[ERROR] Client %s: WebSocket ping error: %v", c.UserID, err)
				return
			}
		}
	}
}

func (c *Client) SendError(message string) {
	payloadBytes, _ := json.Marshal(ErrorPayload{Message: message})
	select {
	case c.Send <- WSMessage{Type: "error", Payload: payloadBytes}:
	default:
		log.Printf("[ERROR] Client %s: Failed to send error message (channel blocked).", c.UserID)
		c.Hub.Unregister <- c
	}
}

// --- Hub (Optimized for O(1) Client Lookup) ---
type Hub struct {
	Clients          map[string]*Client
	Rooms            map[string]map[*Client]bool
	RoomParticipants map[string]ChatRoom
	Register         chan *Client
	Unregister       chan *Client
	Broadcast        chan WSMessage
	RateLimiter      *RateLimiter
	ChatService      *SupabaseChatService
	mutex            sync.RWMutex
}

func NewHub(chatService *SupabaseChatService) *Hub {
	h := &Hub{
		Clients:          make(map[string]*Client),
		Rooms:            make(map[string]map[*Client]bool),
		RoomParticipants: make(map[string]ChatRoom),
		Register:         make(chan *Client),
		Unregister:       make(chan *Client),
		Broadcast:        make(chan WSMessage),
		RateLimiter:      NewRateLimiter(10, time.Minute),
		ChatService:      chatService,
	}
	return h
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mutex.Lock()
			if oldClient, ok := h.Clients[client.UserID]; ok {
				log.Printf("Client %s reconnected. Closing old connection.", client.UserID)
				oldClient.Conn.Close()
			}
			h.Clients[client.UserID] = client
			h.mutex.Unlock()
			log.Printf("Client %s registered. Total clients: %d", client.UserID, len(h.Clients))

		case client := <-h.Unregister:
			h.mutex.Lock()
			if _, ok := h.Clients[client.UserID]; ok {
				delete(h.Clients, client.UserID)
				select {
				case <-client.Send:
				default:
					close(client.Send)
				}
				for roomID, clientsInRoom := range h.Rooms {
					if _, exists := clientsInRoom[client]; exists {
						delete(clientsInRoom, client)
						if len(clientsInRoom) == 0 {
							delete(h.Rooms, roomID)
							delete(h.RoomParticipants, roomID) // Clean up cache
							log.Printf("Chat room %s is now empty and removed.", roomID)
						}
					}
				}
				log.Printf("Client %s unregistered. Total clients: %d", client.UserID, len(h.Clients))
			}
			h.mutex.Unlock()

		case message := <-h.Broadcast:
			if message.Type == "message" {
				var payload NewMessagePayload
				if err := json.Unmarshal(message.Payload, &payload); err != nil {
					log.Printf("[ERROR] Hub: Failed to unmarshal broadcast message payload: %v", err)
					continue
				}
				if _, err := uuid.Parse(payload.ChatRoomID); err != nil {
					log.Printf("[ERROR] Hub: Invalid chat_room_id UUID: %s", payload.ChatRoomID)
					continue
				}
				h.BroadcastToRoom(payload.ChatRoomID, message, payload.SenderID)
			}
		}
	}
}

func (h *Hub) ConfirmSenderDelivery(payload MessageDeliveredPayload, senderID string) {
	h.mutex.RLock()
	client, ok := h.Clients[senderID]
	h.mutex.RUnlock()

	if !ok {
		log.Printf("Sender %s not currently connected to send delivery confirmation.", senderID)
		return
	}

	payloadBytes, _ := json.Marshal(payload)
	select {
	case client.Send <- WSMessage{Type: "message_delivered", Payload: payloadBytes}:
		log.Printf("Delivery confirmed to sender %s for message %s.", senderID, payload.MessageID)
	default:
		log.Printf("[ERROR] Sender %s channel blocked. Failed to send delivery confirmation.", senderID)
	}
}

func (h *Hub) JoinRoom(client *Client, roomID string) {
	h.mutex.Lock()
	if h.Rooms[roomID] == nil {
		h.Rooms[roomID] = make(map[*Client]bool)

		// Optimization: Cache room details when first person joins
		room, err := h.ChatService.findExistingRoomByID(roomID)
		if err == nil && room != nil {
			h.RoomParticipants[roomID] = *room
		}
	}
	h.Rooms[roomID][client] = true
	h.mutex.Unlock()

	log.Printf("Client %s joined room %s.", client.UserID, roomID)

	payloadBytes, _ := json.Marshal(JoinRoomPayload{RoomID: roomID})
	select {
	case client.Send <- WSMessage{Type: "join_room", Payload: payloadBytes}:
	default:
		log.Printf("[ERROR] Client %s: Failed to send room_joined ack (channel blocked).", client.UserID)
		h.Unregister <- client
	}
}

func (h *Hub) LeaveRoom(client *Client, roomID string) {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	if clients, exists := h.Rooms[roomID]; exists {
		if _, inRoom := clients[client]; inRoom {
			delete(clients, client)
			if len(clients) == 0 {
				delete(h.Rooms, roomID)
				delete(h.RoomParticipants, roomID) // Clean up cache
				log.Printf("Chat room %s is now empty and removed.", roomID)
			}
			log.Printf("Client %s left room %s.", client.UserID, roomID)

			payloadBytes, _ := json.Marshal(LeaveRoomPayload{RoomID: roomID})
			select {
			case client.Send <- WSMessage{Type: "leave_room", Payload: payloadBytes}:
			default:
				log.Printf("[ERROR] Client %s: Failed to send room_left ack (channel blocked).", client.UserID)
			}
		}
	}
}

// Optimized BroadcastToRoom with Push Notification logic
func (h *Hub) BroadcastToRoom(roomID string, message WSMessage, senderID string) {
    h.mutex.RLock()
    roomInfo, roomCached := h.RoomParticipants[roomID]
    clientsInRoom := h.Rooms[roomID]
    h.mutex.RUnlock()

    if !roomCached {
        room, err := h.ChatService.findExistingRoomByID(roomID)
        if err == nil && room != nil {
            h.mutex.Lock()
            h.RoomParticipants[roomID] = *room
            roomInfo = *room
            h.mutex.Unlock()
        } else { return }
    }

    recipientID := roomInfo.VendorID
    if senderID == roomInfo.VendorID {
        recipientID = roomInfo.BuyerID
    }

    recipientReceived := false

    // 1. Send to Active Room Participants
    for client := range clientsInRoom {
        if client.UserID != senderID {
            select {
            case client.Send <- message:
                recipientReceived = true
            default:
                h.Unregister <- client
            }
        }
    }

    // 2. Send to Recipient's Global Connection (if they are in another screen)
    if !recipientReceived {
        h.mutex.RLock()
        globalClient, isOnline := h.Clients[recipientID]
        h.mutex.RUnlock()

        if isOnline {
            select {
            case globalClient.Send <- message:
                recipientReceived = true
            default:
                h.Unregister <- globalClient
            }
        }
    }

    // 3. Push Notification fallback
    if !recipientReceived {
        var payload NewMessagePayload
        json.Unmarshal(message.Payload, &payload)
        go h.handleOfflinePush(recipientID, roomID, payload.Content)
    }
}

// Helper for Push Notification
func (h *Hub) handleOfflinePush(recipientID, roomID, content string) {
    tokens, err := notifdb.GetPushTokens(recipientID)
    if err != nil || len(tokens) == 0 {
        return
    }

    title := "New Message on uFinda"

    // 2. Loop through every device token found for this user
    for _, tData := range tokens {
        if tData.DeviceToken == "" {
            continue
        }

        if err := notifdb.SendPushNotification(tData.DeviceToken, title, content, roomID); err != nil {
            log.Printf("[PUSH ERROR] Failed to send to device %s for user %s: %v", tData.DeviceToken, recipientID, err)
            chatlog.LogChat(recipientID, err)
        }
    }
}

type SupabaseChatService struct {
	hub              *Hub
	CloudinaryClient *cloudinary.Cloudinary
	RedisClient *redis.Client
}

func NewSupabaseChatService(cld *cloudinary.Cloudinary, rdb *redis.Client) *SupabaseChatService {
	if rdb == nil {
        log.Println("[ERROR] NewSupabaseChatService received a nil Redis client!")
    }
    return &SupabaseChatService{
        CloudinaryClient: cld,
        RedisClient:      rdb,
    }
}

func (cs *SupabaseChatService) SetHub(hub *Hub) {
	cs.hub = hub
}

func (cs *SupabaseChatService) CreateChatRoom(buyerID, vendorID string) (*ChatRoom, error) {
    // 1. Check existing room
    existingRoom, _ := cs.findExistingRoom(buyerID, vendorID)
    
    var room *ChatRoom
    if existingRoom != nil {
        room = existingRoom
    } else {
        roomData := map[string]interface{}{"buyer_id": buyerID, "vendor_id": vendorID}
        headers := map[string]string{"Prefer": "return=representation"}
        resp, err := db.MakeDBRequest("POST", "/rest/v1/chat_rooms", roomData, headers)
        if err != nil { return nil, err }
        defer resp.Body.Close()
        
        var rooms []ChatRoom
        json.NewDecoder(resp.Body).Decode(&rooms)
        room = &rooms[0]
    }

    // 3. Attach Recipient Info (The Vendor)
    recipient, err := cs.GetRecipientProfile(vendorID)
	
    if err == nil {
        room.Recipient = recipient
    }

    return room, nil
}

func (cs *SupabaseChatService) GetRecipientProfile(userID string) (*RecipientProfile, error) {
    selectQuery := "id,role,username,first_name,last_name,phone,updated_at," +
        "vendor_kyc!left(profile_img, updated_at)," + 
        "user_kyc!left(profile_img, updated_at)"

    params := url.Values{}
    params.Set("id", "eq."+userID)
    params.Set("select", selectQuery)
    params.Set("limit", "1")

    finalURL := fmt.Sprintf("/rest/v1/users?%s", params.Encode())
    resp, err := db.MakeDBRequest("GET", finalURL, nil, nil)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    // 2. Read the body once for debugging if needed
    body, _ := io.ReadAll(resp.Body)
    
    var results []struct {
        ID        string    `json:"id"`
        Role      string    `json:"role"`
        Username  *string   `json:"username"`
        FirstName string    `json:"first_name"`
        LastName  string    `json:"last_name"`
        Phone     string    `json:"phone"`
        UpdatedAt time.Time `json:"updated_at"`
        VendorKYC *struct {
            ProfileImg *db.UploadedFile `json:"profile_img"`
            UpdatedAt  time.Time        `json:"updated_at"`
        } `json:"vendor_kyc"`
        UserKYC *struct {
            ProfileImg *db.UploadedFile `json:"profile_img"`
            UpdatedAt  time.Time        `json:"updated_at"`
        } `json:"user_kyc"`
    }

    if err := json.Unmarshal(body, &results); err != nil {
        return nil, fmt.Errorf("failed to decode response: %v", err)
    }

    if len(results) == 0 {
        return nil, fmt.Errorf("recipient with ID %s not found in users table", userID)
    }

	res := results[0]
    profile := &RecipientProfile{
        UserID:    res.ID,
        Phone:     res.Phone,
        UpdatedAt: res.UpdatedAt,
    }

    if res.Role == "vendor" {
        if res.Username != nil {
            profile.DisplayName = *res.Username
        } else {
            profile.DisplayName = "Vendor"
        }
        
        // Access the first element of the slice
        if res.VendorKYC != nil {
            kyc := res.VendorKYC
            if kyc.ProfileImg != nil {
                imgURL := kyc.ProfileImg.URL
                profile.ProfileImg = &imgURL
            }
            if kyc.UpdatedAt.After(profile.UpdatedAt) {
                profile.UpdatedAt = kyc.UpdatedAt
            }
        }
    } else {
		if res.FirstName != "" {
			profile.DisplayName = res.FirstName
		}else if res.LastName != "" {
			profile.DisplayName = res.LastName
		}else { profile.DisplayName = "User" }
        
        // Access the first element of the slice
        if res.UserKYC != nil {
            kyc := res.UserKYC
            if kyc.ProfileImg != nil {
                imgURL := kyc.ProfileImg.URL
                profile.ProfileImg = &imgURL
            }
            if kyc.UpdatedAt.After(profile.UpdatedAt) {
                profile.UpdatedAt = kyc.UpdatedAt
            }
        }
    }

    return profile, nil
}

func (cs *SupabaseChatService) findExistingRoom(buyerID, vendorID string) (*ChatRoom, error) {
	query := fmt.Sprintf("buyer_id=eq.%s&vendor_id=eq.%s", buyerID, vendorID)
	return cs.queryOneRoom(query)
}

// Optimized Helper to fetch by ID
func (cs *SupabaseChatService) findExistingRoomByID(roomID string) (*ChatRoom, error) {
	query := fmt.Sprintf("id=eq.%s", roomID)
	return cs.queryOneRoom(query)
}

func (cs *SupabaseChatService) queryOneRoom(query string) (*ChatRoom, error) {
	endpoint := fmt.Sprintf("/rest/v1/chat_rooms?%s", query)
	resp, err := db.MakeDBRequest("GET", endpoint, nil, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get chat rooms: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to get chat rooms: status %d, response: %s", resp.StatusCode, string(bodyBytes))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to get chat rooms: %w", err)
	}

	var rooms []ChatRoom
	if err := json.Unmarshal(body, &rooms); err != nil {
		return nil, fmt.Errorf("failed to get chat rooms: %w", err)
	}

	if len(rooms) > 0 {
		return &rooms[0], nil
	}
	return nil, nil
}

func (cs *SupabaseChatService) SendMessage(chatRoomID, senderID, content string, messageType string, publicID *string) (*Message, error) {
    if _, err := uuid.Parse(chatRoomID); err != nil {
        return nil, fmt.Errorf("chat_room_id is not a valid UUID: %w", err)
    }

    // 2. Prepare Database Payload
    messageData := map[string]interface{}{
        "chat_room_id": chatRoomID,
        "sender_id":    senderID,
        "content":      content,
        "message_type": messageType,
        "is_read":      false,
    }

    if publicID != nil && (messageType == "image" || messageType == "audio") {
        messageData["public_id"] = *publicID
    }

    // 3. Save to Database
    resp, err := db.MakeDBRequest(
        "POST", "/rest/v1/messages", messageData,
        map[string]string{"Prefer": "return=representation"},
    )
    if err != nil { return nil, err }
    defer resp.Body.Close()

    body, _ := io.ReadAll(resp.Body)
    var messages []Message
    if err := json.Unmarshal(body, &messages); err != nil || len(messages) == 0 {
        return nil, fmt.Errorf("no message returned or failed to decode")
    }

    message := &messages[0]

    // 4. Handle Profile Sync (Global User-to-User)
    var newChangesPtr *map[string]interface{}
    senderProfile, err := cs.GetRecipientProfile(senderID)
    
    // Fetch room to find the recipient (the viewer)
    room, roomErr := cs.findExistingRoomByID(chatRoomID)

    if err == nil && senderProfile != nil && roomErr == nil && cs.RedisClient != nil {
        ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
        defer cancel()

        // Identify the receiver (Viewer)
        recipientID := room.VendorID
        if senderID == room.VendorID {
            recipientID = room.BuyerID
        }

        // GLOBAL KEY: Tracks if this specific recipient has seen this specific sender's latest profile
        redisKey := cs.getProfileSyncKey(recipientID, senderID)
        
        lastSeenStr, redisErr := cs.RedisClient.Get(ctx, redisKey).Result()
        dbTimeStr := senderProfile.UpdatedAt.Format(time.RFC3339)

        if redisErr == redis.Nil || lastSeenStr != dbTimeStr {
            changes := map[string]interface{}{
                "display_name": senderProfile.DisplayName,
                "profile_img":  senderProfile.ProfileImg,
                "phone":        senderProfile.Phone,
            }
            newChangesPtr = &changes
            
            cs.RedisClient.Set(ctx, redisKey, dbTimeStr, 7*24*time.Hour)
            log.Printf("[SYNC] Global: Populating new_changes for %s -> recipient %s", senderID, recipientID)
        }
    }

    // 5. Build WebSocket Payload
    displayName := "User"
    if senderProfile != nil {
        displayName = senderProfile.DisplayName
    }

    chatMsg := NewMessagePayload{
        ID:          message.ID,
        ChatRoomID:  message.ChatRoomID,
        SenderID:    message.SenderID,
        Content:     message.Content,
        MessageType: message.MessageType,
        CreatedAt:   message.CreatedAt,
        SenderName:  displayName,
        PublicID:    message.PublicID,
        DeliveredAt: message.DeliveredAt,
        NewChanges:  newChangesPtr, 
    }

    payloadBytes, _ := json.Marshal(chatMsg)

    // 6. Broadcast
    if cs.hub != nil {
        cs.hub.BroadcastToRoom(chatRoomID, WSMessage{
            Type:    "new_message",
            Payload: payloadBytes,
        }, senderID)
        cs.hub.ConfirmSenderDelivery(MessageDeliveredPayload{MessageID: message.ID}, senderID)
    }

    return message, nil
}

func (cs *SupabaseChatService) getSenderName(userID string) (string, error) {
	endpoint := fmt.Sprintf("/rest/v1/users?id=eq.%s&select=first_name,last_name", userID)
	resp, err := db.MakeDBRequest("GET", endpoint, nil, nil)
	if err != nil {
		return "", fmt.Errorf("failed to get sender name: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		body, err := io.ReadAll(resp.Body)
		if err == nil {
			var users []map[string]interface{}
			if err := json.Unmarshal(body, &users); err == nil && len(users) > 0 {
				if first_name, ok := users[0]["first_name"].(string); ok && first_name != "" {
					return first_name, nil
				}
				if last_name, ok := users[0]["last_name"].(string); ok && last_name != "" {
					return last_name, nil
				}
			}
		}
	} else {
		log.Printf("[ERROR] Users table query failed with status %d for ID %s", resp.StatusCode, userID)
	}

	return "Unknown User", fmt.Errorf("sender not found or has no contact info ID %s", userID)
}

func (cs *SupabaseChatService) GetChatHistory(chatRoomID string, limit int, offset int) ([]Message, error) {
	if _, err := uuid.Parse(chatRoomID); err != nil {
		return nil, fmt.Errorf("chat room id is not a valid UUID: %v", err)
	}

	query := fmt.Sprintf("chat_room_id=eq.%s", chatRoomID)
	endpoint := fmt.Sprintf("/rest/v1/messages?%s&order=created_at.desc&limit=%d&offset=%d", query, limit, offset)
	resp, err := db.MakeDBRequest("GET", endpoint, nil, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get chat history: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to get chat history: status %d, response: %s", resp.StatusCode, string(bodyBytes))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to get chat history: %w", err)
	}

	var messages []Message
	if err := json.Unmarshal(body, &messages); err != nil {
		return nil, fmt.Errorf("failed to get chat history: %w", err)
	}

	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, nil
}

func (cs *SupabaseChatService) getProfileSyncKey(viewerID, targetID string) string {
    return fmt.Sprintf("sync:viewer:%s:target:%s", viewerID, targetID)
}

func (cs *SupabaseChatService) GetUserChatRooms(userID string) ([]ChatRoom, error) {
	query := fmt.Sprintf("or=(buyer_id.eq.%s,vendor_id.eq.%s)", userID, userID)
	endpoint := fmt.Sprintf("/rest/v1/chat_rooms?%s&order=updated_at.desc", query)
	resp, err := db.MakeDBRequest("GET", endpoint, nil, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get user chat rooms: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to get user chat rooms: status %d, response: %s", resp.StatusCode, string(bodyBytes))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to get user chat rooms: %w", err)
	}

	var chatRooms []ChatRoom
	if err := json.Unmarshal(body, &chatRooms); err != nil {
		return nil, fmt.Errorf("failed to get user chat rooms: %w", err)
	}

	return chatRooms, nil
}

func (cs *SupabaseChatService) MarkMessagesAsRead(chatRoomID, userID string) error {
	if _, err := uuid.Parse(chatRoomID); err != nil {
		return fmt.Errorf("chat_room_id is not a valid UUID: %v", err)
	}

	data := map[string]interface{}{
		"is_read":      true,
		"delivered_at": time.Now().UTC().Format(time.RFC3339Nano),
	}

	query := fmt.Sprintf("chat_room_id=eq.%s&sender_id=neq.%s&is_read=eq.false", chatRoomID, userID)
	endpoint := fmt.Sprintf("/rest/v1/messages?%s", query)
	resp, err := db.MakeDBRequest("PATCH", endpoint, data, nil)
	if err != nil {
		return fmt.Errorf("failed to mark messages as read: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("failed to mark messages as read: status %d, response: %s", resp.StatusCode, string(bodyBytes))
	}
	
	log.Printf("Marked messages in room %s as read for user %s.", chatRoomID, userID)

	return nil
}

func (cs *SupabaseChatService) GetUnreadMessageCount(userID string) (int, error) {
	chatRooms, err := cs.GetUserChatRooms(userID)
	if err != nil {
		return 0, err
	}

	totalUnread := 0
	for _, room := range chatRooms {
		query := fmt.Sprintf("chat_room_id=eq.%s&sender_id=neq.%s&is_read=eq.false", room.ID, userID)
		endpoint := fmt.Sprintf("/rest/v1/messages?%s&select=id", query)
		resp, err := db.MakeDBRequest("GET", endpoint, nil, nil)
		if err != nil {
			log.Printf("[ERROR] Failed to get unread messages count for room %s: %v", room.ID, err)
			continue
		}

		if resp.StatusCode == http.StatusOK {
			body, err := io.ReadAll(resp.Body)
			if err != nil {
				log.Printf("[ERROR] Failed to get unread messages count for room %s: %v", room.ID, err)
				resp.Body.Close()
				continue
			}

			var messages []map[string]interface{}
			if err := json.Unmarshal(body, &messages); err != nil {
				log.Printf("[ERROR] Failed to get unread messages count for room %s: %v, body: %s", room.ID, err, string(body))
				resp.Body.Close()
				continue
			}
			totalUnread += len(messages)
		} else {
			log.Printf("[ERROR] Failed to get unread messages count for room %s, status: %d", room.ID, resp.StatusCode)
		}
		resp.Body.Close()
	}

	return totalUnread, nil
}

func (cs *SupabaseChatService) GetRoomUnreadMessageCount(roomID string, userID string) (int, error) {
    // 1. Build the query
    // Filter: messages in this room, NOT sent by the current user, where is_read is false
    params := url.Values{}
    params.Set("chat_room_id", "eq."+roomID)
    params.Set("sender_id", "neq."+userID)
    params.Set("is_read", "eq.false")
    params.Set("select", "id") // We only need the count, but PostgREST requires a select

    endpoint := fmt.Sprintf("/rest/v1/messages?%s", params.Encode())

    // 2. Set headers for counting
    headers := map[string]string{
        "Prefer": "count=exact",
    }

    // 3. Make the request
    resp, err := db.MakeDBRequest("GET", endpoint, nil, headers)
    if err != nil {
        return 0, fmt.Errorf("failed to request unread count: %v", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return 0, fmt.Errorf("failed to get unread count, status: %d", resp.StatusCode)
    }

    // 4. Extract the count from the Content-Range header
    // Header format: "0-0/5" where 5 is the total count
    contentRange := resp.Header.Get("Content-Range")
    if contentRange != "" {
        parts := strings.Split(contentRange, "/")
        if len(parts) > 1 {
            count, err := strconv.Atoi(parts[1])
            if err == nil {
                return count, nil
            }
        }
    }

    // Fallback: If header is missing, decode the body length
    body, _ := io.ReadAll(resp.Body)
    var messages []interface{}
    if err := json.Unmarshal(body, &messages); err != nil {
        return 0, err
    }

    return len(messages), nil
}

func (cs *SupabaseChatService) GetUserChatRoomsWithLastMessage(userID string) ([]map[string]interface{}, error) {
    chatRooms, err := cs.GetUserChatRooms(userID)
    if err != nil {
        return nil, err
    }

    var result []map[string]interface{}
    ctx := context.Background()

    for _, room := range chatRooms {
        // 1. Identify Recipient
        recipientID := room.VendorID
        if userID == room.VendorID {
            recipientID = room.BuyerID
        }

        roomData := map[string]interface{}{
            "id": room.ID,
            "buyer_id": room.BuyerID,
            "vendor_id": room.VendorID,
        }

        // 2. Fetch Current Recipient Profile (The "Fresh" data)
        recipient, err := cs.GetRecipientProfile(recipientID)
        if err == nil && recipient != nil {
            // 3. Check Redis for the "Last Seen" timestamp
            redisKey := cs.getProfileSyncKey(userID, recipientID)
            lastSeenStr, _ := cs.RedisClient.Get(ctx, redisKey).Result()

            // 4. Comparison Logic
            isUpdated := false
            dbTimeStr := recipient.UpdatedAt.Format(time.RFC3339)

            if lastSeenStr == "" || lastSeenStr != dbTimeStr {
                // New user or the timestamp in DB is different from Cache
                isUpdated = true
            }

            if isUpdated {
                roomData["new_changes"] = map[string]interface{}{
                    "display_name": recipient.DisplayName,
                    "profile_img":  recipient.ProfileImg,
                    "phone":        recipient.Phone,
                }
                // Update Redis to mark this new version as "Seen"
                cs.RedisClient.Set(ctx, redisKey, dbTimeStr, 7*24*time.Hour)
            } else {
                roomData["new_changes"] = nil
            }
        }

        // 5. Last Message Logic
        messages, err := cs.GetChatHistory(room.ID, 1, 0)
        if err == nil && len(messages) > 0 {
            roomData["last_message"] = messages[0]
        }

        // 6. Unread Count Logic
        roomData["unread_count"], _ = cs.GetRoomUnreadMessageCount(room.ID, userID)

        result = append(result, roomData)
    }

    return result, nil
}

// -------------------------------------------------------------
// HTTP HANDLERS
// -------------------------------------------------------------

func (cs *SupabaseChatService) HandleWebSocket(c *gin.Context) {
	userIDVal, exists := c.Get("id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		c.Abort()
		return
	}

	validatedUserID, ok := userIDVal.(string)
	if !ok {
		log.Printf("[ERROR]: validatedUserID in context is not a string. Type: %T", userIDVal)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "MsgServerError"})
		c.Abort()
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println("WebSocket upgrade failed:", err)
		return
	}

	client := &Client{
		UserID: validatedUserID,
		Conn:   conn,
		Hub:    cs.hub,
		Send:   make(chan WSMessage, 256),
	}

	cs.hub.Register <- client

	go client.WritePump()
	go client.ReadPump()
}

func (cs *SupabaseChatService) GetCloudinarySignatureHandler(c *gin.Context) {
	userID := c.GetString("id")
	signature, err := GetCloudinarySignature(cs.CloudinaryClient)
	if err != nil {
		chatlog.LogChat(userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "MsgServerError"})
		return
	}

	c.JSON(http.StatusOK, signature)
}

func (cs *SupabaseChatService) CreateChatRoomHandler(c *gin.Context) {
	userID := c.GetString("id")

	var req struct {
		VendorID string `json:"vendor_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	room, err := cs.CreateChatRoom(userID, req.VendorID)
	if err != nil {
		chatlog.LogChat(userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "MsgServerError"})
		return
	}

	c.JSON(http.StatusCreated, room)
}

func (cs *SupabaseChatService) GetUserChatRoomsHandler(c *gin.Context) {
	userID := c.GetString("id")

	rooms, err := cs.GetUserChatRooms(userID)
	if err != nil {
		chatlog.LogChat(userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "MsgServerError"})
		return
	}

	c.JSON(http.StatusOK, rooms)
}

func (cs *SupabaseChatService) GetUserChatRoomsWithLastMessageHandler(c *gin.Context) {
	userID := c.GetString("id")

	rooms, err := cs.GetUserChatRoomsWithLastMessage(userID)
	if err != nil {
		chatlog.LogChat(userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "MsgServerError"})
		return
	}

	c.JSON(http.StatusOK, rooms)
}

func (cs *SupabaseChatService) SendMessageHandler(c *gin.Context) {
	var req SendMessagePayload

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	senderID := c.GetString("id")

	message, err := cs.SendMessage(req.ChatRoomID, senderID, req.Content, req.MessageType, req.PublicID)
	if err != nil {
		chatlog.LogChat(senderID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "MsgServerError"})
		return
	}

	c.JSON(http.StatusCreated, message)
}

func (cs *SupabaseChatService) GetChatHistoryHandler(c *gin.Context) {
	userID := c.GetString("id")

	roomID := c.Query("room_id")
	pageStr := c.DefaultQuery("page", "1")
	page, _ := strconv.Atoi(pageStr)
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * 20 // Assuming DefaultPageSize is 20

	messages, err := cs.GetChatHistory(roomID, 20, offset)
	if err != nil {
		chatlog.LogChat(userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "MsgServerError"})
		return
	}

	c.JSON(http.StatusOK, messages)
}

func (cs *SupabaseChatService) MarkMessagesAsReadHandler(c *gin.Context) {
	var req struct {
		ChatRoomID string `json:"room_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	userID := c.GetString("id")

	if err := cs.MarkMessagesAsRead(req.ChatRoomID, userID); err != nil {
		chatlog.LogChat(userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "MsgServerError"})
		return
	}

	c.Status(http.StatusNoContent)
}

func (cs *SupabaseChatService) GetUnreadCountHandler(c *gin.Context) {
	userID := c.GetString("id")

	count, err := cs.GetUnreadMessageCount(userID)
	if err != nil {
		chatlog.LogChat(userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "MsgServerError"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"unread_count": count})
}
