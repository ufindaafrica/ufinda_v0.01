package chat

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"sync"
	"time"
	"github.com/oladev/ufinda_v0.01/internal/logs/chat"
	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/oladev/ufinda_v0.01/internal/db"
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

type ChatRoom struct {
	ID        string    `json:"id"`
	BuyerID   string    `json:"buyer_id"`
	VendorID  string    `json:"vendor_id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Message struct {
	ID          string     `json:"id"`
	ChatRoomID  string     `json:"chat_room_id"`
	SenderID    string     `json:"sender_id"`
	Content     string     `json:"content"`
	MessageType string     `json:"message_type"`
	IsRead      bool       `json:"is_read"`
	PublicID    *string    `json:"public_id,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	DeliveredAt *time.Time `json:"delivered_at,omitempty"`
}

type ChatMessage struct {
	ID          string     `json:"id"`
	ChatRoomID  string     `json:"chat_room_id"`
	SenderID    string     `json:"sender_id"`
	Content     string     `json:"content"`
	MessageType string     `json:"message_type"`
	PublicID    *string    `json:"public_id,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	SenderName  string     `json:"sender_name"`
	DeliveredAt *time.Time `json:"delivered_at,omitempty"`
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
				log.Printf("WebSocket unexpected close for user %s: %v", c.UserID, err)
			} else if err != io.EOF {
				log.Printf("WebSocket read error for user %s: %v", c.UserID, err)
			}
			break
		}

		switch rawMsg.Type {
		case "join_room":
			var payload JoinRoomPayload
			if err := json.Unmarshal(rawMsg.Payload, &payload); err != nil {
				log.Printf("Client %s: Failed to unmarshal join_room payload: %v", c.UserID, err)
				c.SendError("Invalid join_room payload")
				continue
			}
			if _, err := uuid.Parse(payload.RoomID); err != nil {
				log.Printf("Client %s: Invalid room_id UUID: %s", c.UserID, payload.RoomID)
				c.SendError("Invalid room_id format")
				continue
			}
			c.Hub.JoinRoom(c, payload.RoomID)

		case "leave_room":
			var payload LeaveRoomPayload
			if err := json.Unmarshal(rawMsg.Payload, &payload); err != nil {
				log.Printf("Client %s: Failed to unmarshal leave_room payload: %v", c.UserID, err)
				c.SendError("Invalid leave_room payload")
				continue
			}
			if _, err := uuid.Parse(payload.RoomID); err != nil {
				log.Printf("Client %s: Invalid room_id UUID: %s", c.UserID, payload.RoomID)
				c.SendError("Invalid room_id format")
				continue
			}
			c.Hub.LeaveRoom(c, payload.RoomID)

		case "message":
			if !c.Hub.RateLimiter.Allow(c.UserID) {
				log.Printf("Client %s: Rate limit exceeded.", c.UserID)
				c.SendError("Rate limit exceeded. Please wait.")
				continue
			}

			var payload SendMessagePayload
			if err := json.Unmarshal(rawMsg.Payload, &payload); err != nil {
				log.Printf("Client %s: Failed to unmarshal message payload: %v", c.UserID, err)
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
			} else if msgType == "image" {
				maxContentLength = 500 // Max URL length
				if payload.PublicID == nil {
					c.SendError("Image message missing PublicID")
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
				log.Printf("Client %s: Failed to persist message: %v", c.UserID, err)
				c.SendError("Failed to save message")
				continue
			}

		case "pong":
			// Handled by SetPongHandler
		default:
			log.Printf("Client %s: Unknown WS message type: %s", c.UserID, rawMsg.Type)
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
				log.Printf("Client %s: Send channel closed. Sending close message.", c.UserID)
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			c.mutex.Lock()
			err := c.Conn.WriteJSON(msg)
			c.mutex.Unlock()
			if err != nil {
				log.Printf("Client %s: WebSocket write error: %v", c.UserID, err)
				return
			}
		case <-ticker.C:
			c.mutex.Lock()
			err := c.Conn.WriteMessage(websocket.PingMessage, nil)
			c.mutex.Unlock()
			if err != nil {
				log.Printf("Client %s: WebSocket ping error: %v", c.UserID, err)
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
		log.Printf("Client %s: Failed to send error message (channel blocked).", c.UserID)
		c.Hub.Unregister <- c
	}
}

// --- Hub (Optimized for O(1) Client Lookup) ---
type Hub struct {
	Clients     map[string]*Client
	Rooms       map[string]map[*Client]bool
	Register    chan *Client
	Unregister  chan *Client
	Broadcast   chan WSMessage
	RateLimiter *RateLimiter
	ChatService *SupabaseChatService
	mutex       sync.RWMutex
}

func NewHub(chatService *SupabaseChatService) *Hub {
	h := &Hub{
		Clients:     make(map[string]*Client),
		Rooms:       make(map[string]map[*Client]bool),
		Register:    make(chan *Client),
		Unregister:  make(chan *Client),
		Broadcast:   make(chan WSMessage),
		RateLimiter: NewRateLimiter(10, time.Minute),
		ChatService: chatService,
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
					log.Printf("Hub: Failed to unmarshal broadcast message payload: %v", err)
					continue
				}
				if _, err := uuid.Parse(payload.ChatRoomID); err != nil {
					log.Printf("Hub: Invalid chat_room_id UUID: %s", payload.ChatRoomID)
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
		log.Printf("Sender %s channel blocked. Failed to send delivery confirmation.", senderID)
	}
}

func (h *Hub) JoinRoom(client *Client, roomID string) {
	if h.Rooms[roomID] == nil {
		h.Rooms[roomID] = make(map[*Client]bool)
	}
	h.Rooms[roomID][client] = true
	log.Printf("Client %s joined room %s.", client.UserID, roomID)

	payloadBytes, _ := json.Marshal(JoinRoomPayload{RoomID: roomID})
	select {
	case client.Send <- WSMessage{Type: "join_room", Payload: payloadBytes}:
	default:
		log.Printf("Client %s: Failed to send room_joined ack (channel blocked).", client.UserID)
		h.Unregister <- client
	}
}

func (h *Hub) LeaveRoom(client *Client, roomID string) {
	if clients, exists := h.Rooms[roomID]; exists {
		if _, inRoom := clients[client]; inRoom {
			delete(clients, client)
			if len(clients) == 0 {
				delete(h.Rooms, roomID)
				log.Printf("Chat room %s is now empty and removed.", roomID)
			}
			log.Printf("Client %s left room %s.", client.UserID, roomID)

			payloadBytes, _ := json.Marshal(LeaveRoomPayload{RoomID: roomID})
			select {
			case client.Send <- WSMessage{Type: "leave_room", Payload: payloadBytes}:
			default:
				log.Printf("Client %s: Failed to send room_left ack (channel blocked).", client.UserID)
				h.Unregister <- client
			}
		}
	}
}

func (h *Hub) BroadcastToRoom(roomID string, message WSMessage, senderID string) {
	if clients, exists := h.Rooms[roomID]; exists {
		for client := range clients {
			if client.UserID == senderID {
				continue
			}
			select {
			case client.Send <- message:
			default:
				log.Printf("Client %s: Send channel blocked. Unregistering client.", client.UserID)
				h.Unregister <- client
			}
		}
	}
}

type SupabaseChatService struct {
	hub              *Hub
	CloudinaryClient *cloudinary.Cloudinary
}

func NewSupabaseChatService(cld *cloudinary.Cloudinary) *SupabaseChatService {
	return &SupabaseChatService{
		CloudinaryClient: cld,
	}
}

func (cs *SupabaseChatService) SetHub(hub *Hub) {
	cs.hub = hub
}

func (cs *SupabaseChatService) CreateChatRoom(buyerID, vendorID string) (*ChatRoom, error) {
	existingRoom, err := cs.findExistingRoom(buyerID, vendorID)
	if err != nil {
		log.Printf("Error checking for existing chat room: %v", err)
		return nil, fmt.Errorf("failed to check for existing room: %v", err)
	}
	if existingRoom != nil {
		log.Printf("Found existing chat room ID %s for buyer %s, vendor %s", existingRoom.ID, buyerID, vendorID)
		return existingRoom, nil
	}

	roomData := map[string]interface{}{
		"buyer_id":  buyerID,
		"vendor_id": vendorID,
	}

	headers := map[string]string{
		"Prefer": "return=representation",
	}

	resp, err := db.MakeDBRequest("POST", "/rest/v1/chat_rooms", roomData, headers)
	if err != nil {
		return nil, fmt.Errorf("failed to make chat room: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to create chat room: status %d, response: %s", resp.StatusCode, string(bodyBytes))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to chat room: %v", err)
	}

	var rooms []ChatRoom
	if err := json.Unmarshal(body, &rooms); err != nil {
		log.Printf("Error parsing create chat room response: %v, body: %s", err, string(body))
		return nil, fmt.Errorf("failed to parse response: %v", err)
	}

	if len(rooms) == 0 {
		return nil, fmt.Errorf("no chat room returned after creation")
	}

	log.Printf("Successfully created chat room ID %s", rooms[0].ID)
	return &rooms[0], nil
}

func (cs *SupabaseChatService) findExistingRoom(buyerID, vendorID string) (*ChatRoom, error) {
	query := fmt.Sprintf("buyer_id=eq.%s&vendor_id=eq.%s", buyerID, vendorID)

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

	if len(content) == 0 || len(content) > 1000 {
		return nil, fmt.Errorf("message content must be between 1 and 1000 characters")
	}

	messageData := map[string]interface{}{
		"chat_room_id": chatRoomID,
		"sender_id":    senderID,
		"content":      content,
		"message_type": messageType,
		"is_read":      false,
	}

	if publicID != nil && messageType == "image" {
		messageData["public_id"] = *publicID
	}

	resp, err := db.MakeDBRequest(
		"POST", "/rest/v1/messages", messageData,
		map[string]string{"Prefer": "return=representation"},
	)

	if err != nil {
		return nil, fmt.Errorf("failed to send message: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("failed to send message: status %d, response: %s", resp.StatusCode, string(bodyBytes))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to send response: %w", err)
	}

	var messages []Message
	if err := json.Unmarshal(body, &messages); err != nil {
		return nil, fmt.Errorf("failed to send message: %w", err)
	}

	if len(messages) == 0 {
		return nil, fmt.Errorf("no message returned after sending")
	}

	message := &messages[0]
	senderName, err := cs.getSenderName(senderID)
	if err != nil {
		log.Printf("Warning: Could not get sender name for user %s: %v. Using 'Unknown User'.", senderID, err)
		senderName = "Unknown User"
	}

	chatMsg := NewMessagePayload{
		ID:          message.ID,
		ChatRoomID:  message.ChatRoomID,
		SenderID:    message.SenderID,
		Content:     message.Content,
		MessageType: message.MessageType,
		CreatedAt:   message.CreatedAt,
		SenderName:  senderName,
		PublicID:    message.PublicID,
		DeliveredAt: message.DeliveredAt,
	}

	payloadBytes, err := json.Marshal(chatMsg)
	if err != nil {
		log.Printf("Error marshalling NewMessagePayload: %v", err)
		return message, nil
	}

	if cs.hub != nil {
		cs.hub.Broadcast <- WSMessage{
			Type:      "message",
			Payload:   payloadBytes,
			MessageID: message.ID,
		}
		cs.hub.ConfirmSenderDelivery(MessageDeliveredPayload{MessageID: message.ID}, senderID)
	} else {
		log.Println("Warning: Hub is nil in SupabaseChatService. Message cannot be broadcast.")
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
		log.Printf("Users table query failed with status %d for ID %s", resp.StatusCode, userID)
	}

	vendorEndpoint := fmt.Sprintf("/rest/v1/vendors?id=eq.%s&select=first_name,email", userID)
	vendorResp, err := db.MakeDBRequest("GET", vendorEndpoint, nil, nil)
	if err != nil {
		return "", fmt.Errorf("failed to get sender name: %w", err)
	}
	defer vendorResp.Body.Close()

	if vendorResp.StatusCode == http.StatusOK {
		body, err := io.ReadAll(vendorResp.Body)
		if err == nil {
			var vendors []map[string]interface{}
			if err := json.Unmarshal(body, &vendors); err == nil && len(vendors) > 0 {
				if first_name, ok := vendors[0]["first_name"].(string); ok && first_name != "" {
					return first_name, nil
				}
				if last_name, ok := vendors[0]["last_name"].(string); ok && last_name != "" {
					return last_name, nil
				}
			}
		}
	} else {
		log.Printf("Vendors table query failed with status %d for ID %s", vendorResp.StatusCode, userID)
	}

	return "Unknown User", fmt.Errorf("sender not found or has no contact info in users or vendors for ID %s", userID)
}

func (cs *SupabaseChatService) GetChatHistory(chatRoomID string, limit int, offset int) ([]Message, error) {
	if _, err := uuid.Parse(chatRoomID); err != nil {
		return nil, fmt.Errorf("chat_room_id is not a valid UUID: %v", err)
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
		log.Printf("Failed to get chat history, status: %d, response: %s", resp.StatusCode, string(bodyBytes))
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
		return 0, fmt.Errorf("failed to get unread message count: %w", err)
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

func (cs *SupabaseChatService) GetUserChatRoomsWithLastMessage(userID string) ([]map[string]interface{}, error) {
	chatRooms, err := cs.GetUserChatRooms(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user chat rooms with last message: %w", err)
	}

	var result []map[string]interface{}
	for _, room := range chatRooms {
		roomData := map[string]interface{}{
			"id":         room.ID,
			"buyer_id":   room.BuyerID,
			"vendor_id":  room.VendorID,
			"created_at": room.CreatedAt,
			"updated_at": room.UpdatedAt,
		}

		messages, err := cs.GetChatHistory(room.ID, 1, 0)
		if err == nil && len(messages) > 0 {
			lastMessage := messages[0]
			roomData["last_message"] = map[string]interface{}{
				"id":           lastMessage.ID,
				"content":      lastMessage.Content,
				"created_at":   lastMessage.CreatedAt,
				"sender_id":    lastMessage.SenderID,
				"is_read":      lastMessage.IsRead,
				"message_type": lastMessage.MessageType,
				"public_id":    lastMessage.PublicID,
			}
		} else if err != nil {
			log.Printf("[CRITICAL] Could not get last message for room %s: %v", room.ID, err)
		}

		query := fmt.Sprintf("chat_room_id=eq.%s&sender_id=neq.%s&is_read=eq.false", room.ID, userID)
		endpoint := fmt.Sprintf("/rest/v1/messages?%s&select=id", query)
		resp, err := db.MakeDBRequest("GET", endpoint, nil, nil)
		if err == nil {
			if resp.StatusCode == http.StatusOK {
				body, _ := io.ReadAll(resp.Body)
				var unreadMessages []map[string]interface{}
				if json.Unmarshal(body, &unreadMessages) == nil {
					roomData["unread_count"] = len(unreadMessages)
				} else {
					log.Printf("[CRITICAL] Could not get unread message count for room %s: %v", room.ID, err)
					roomData["unread_count"] = 0
				}
			} else {
				log.Printf("[CRITICAL] Could not get unread message count for room %s, status: %d", room.ID, resp.StatusCode)
				roomData["unread_count"] = 0
			}
			resp.Body.Close()
		} else {
			log.Printf("[CRITICAL] Could not get unread message count for room %s: %v", room.ID, err)
			roomData["unread_count"] = 0
		}

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
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	c.JSON(http.StatusOK, signature)
}

func (cs *SupabaseChatService) CreateChatRoomHandler(c *gin.Context) {
	userID := c.GetString("id")

	var req struct {
		BuyerID   string  `json:"buyer_id"`
		VendorID  string  `json:"vendor_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	room, err := cs.CreateChatRoom(req.BuyerID, req.VendorID)
	if err != nil {
		chatlog.LogChat(userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	c.JSON(http.StatusCreated, room)
}

func (cs *SupabaseChatService) GetUserChatRoomsHandler(c *gin.Context) {
	userID := c.GetString("id")

	rooms, err := cs.GetUserChatRooms(userID)
	if err != nil {
		chatlog.LogChat(userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	c.JSON(http.StatusOK, rooms)
}

func (cs *SupabaseChatService) GetUserChatRoomsWithLastMessageHandler(c *gin.Context) {
	userID := c.GetString("id")

	rooms, err := cs.GetUserChatRoomsWithLastMessage(userID)
	if err != nil {
		chatlog.LogChat(userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	c.JSON(http.StatusCreated, message)
}

func (cs *SupabaseChatService) GetChatHistoryHandler(c *gin.Context) {
	userID := c.GetString("id")

	roomID := c.Query("room_id")
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 50
	}
	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	messages, err := cs.GetChatHistory(roomID, limit, offset)
	if err != nil {
		chatlog.LogChat(userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	c.JSON(http.StatusOK, messages)
}

func (cs *SupabaseChatService) MarkMessagesAsReadHandler(c *gin.Context) {
	var req struct {
		ChatRoomID string `json:"room_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request payload"})
		return
	}

	userID := c.GetString("id")

	if err := cs.MarkMessagesAsRead(req.ChatRoomID, userID); err != nil {
		chatlog.LogChat(userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	c.Status(http.StatusNoContent)
}

func (cs *SupabaseChatService) GetUnreadCountHandler(c *gin.Context) {
	userID := c.GetString("id")

	count, err := cs.GetUnreadMessageCount(userID)
	if err != nil {
		chatlog.LogChat(userID, err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": MsgServerError})
		return
	}

	c.JSON(http.StatusOK, gin.H{"unread_count": count})
}