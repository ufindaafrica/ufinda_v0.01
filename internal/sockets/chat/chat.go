package chat

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv" // <-- ADDED: Needed for parsing limit/offset in handlers
	"sync"
	"time"
	"github.com/oladev/ufinda_v0.01/internal/db"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

// Define the expected length for non-UUID user/vendor IDs
const UserIDLength = 10

// WebSocket upgrader with stricter origin check
var upgrader = websocket.Upgrader{
	ReadBufferSize: 1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		if origin == "" {
			// Allow requests without Origin header (e.g., Postman)
			// disable in production
			return true
		}
		allowedOrigins := []string{
			"http://localhost:8080",
			// "http://localhost:3000",
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

// Helper to validate the 7-character string ID
func isValidStringID(id string) bool {
	return len(id) == UserIDLength
}

// --- Core chat types ---

type ChatRoom struct {
	ID string `json:"id"`
	BuyerID string `json:"buyer_id"`
	VendorID string `json:"vendor_id"`
	ProductID *string `json:"product_id,omitempty"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Message struct {
	ID string `json:"id"`
	ChatRoomID string `json:"chat_room_id"`
	SenderID string `json:"sender_id"`
	Content string `json:"content"`
	MessageType string `json:"message_type"`
	IsRead bool `json:"is_read"`
	CreatedAt time.Time `json:"created_at"`
	DeliveredAt *time.Time `json:"delivered_at,omitempty"`
}

type ChatMessage struct {
	ID string `json:"id"`
	ChatRoomID string `json:"chat_room_id"`
	SenderID string `json:"sender_id"`
	Content string `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	SenderName string `json:"sender_name"`
	DeliveredAt *time.Time `json:"delivered_at,omitempty"`
}

type WSMessage struct {
	Type string `json:"type"`
	Payload json.RawMessage `json:"payload"`
	MessageID string `json:"message_id,omitempty"`
}

type JoinRoomPayload struct {
	RoomID string `json:"room_id"`
}

type LeaveRoomPayload struct {
	RoomID string `json:"room_id"`
}

type SendMessagePayload struct {
	ChatRoomID string `json:"room_id"`
	Content string `json:"content"`
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
	lastReset map[string]time.Time
	limit int
	interval time.Duration
	mutex sync.Mutex
}

func NewRateLimiter(limit int, interval time.Duration) *RateLimiter {
	return &RateLimiter{
		userMessages: make(map[string]int),
		lastReset: make(map[string]time.Time),
		limit: limit,
		interval: interval,
		mutex: sync.Mutex{},
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
	UserID string
	Username string
	Conn *websocket.Conn
	Hub *Hub
	Send chan WSMessage
	mutex sync.Mutex
}

func (c *Client) ReadPump() {
	defer func() {
		log.Printf("Client %s: Disconnecting. Cleaning up resources.", c.UserID)
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(512)
	// Setting read deadline to 60s + 10s grace
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
			} else if err != io.EOF { // EOF often means a clean closure
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
			if _, err := uuid.Parse(payload.ChatRoomID); err != nil {
				log.Printf("Client %s: Invalid chat_room_id UUID: %s", c.UserID, payload.ChatRoomID)
				c.SendError("Invalid chat_room_id format")
				continue
			}
			if payload.Content == "" {
				c.SendError("Content missing for message")
				continue
			}
			if len(payload.Content) > 1000 {
				c.SendError("Message content too long (max 1000 characters)")
				continue
			}
			// UserID length check (for consistency, although already checked on connection)
			if !isValidStringID(c.UserID) {
				log.Printf("Client %s: Invalid SenderID format.", c.UserID)
				c.SendError("Invalid Sender ID format.")
				continue
			}

			// Save the message to DB and broadcast is handled inside SendMessage
			_, err := c.Hub.ChatService.SendMessage(payload.ChatRoomID, c.UserID, payload.Content)
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
				// Corrected logging of the ping error
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

// --- Hub ---

type Hub struct {
	Clients map[*Client]bool
	Rooms map[string]map[*Client]bool
	Register chan *Client
	Unregister chan *Client
	Broadcast chan WSMessage
	RateLimiter *RateLimiter
	ChatService *SupabaseChatService
}

func NewHub(chatService *SupabaseChatService) *Hub {
	h := &Hub{
		Clients: make(map[*Client]bool),
		Rooms: make(map[string]map[*Client]bool),
		Register: make(chan *Client),
		Unregister: make(chan *Client),
		Broadcast: make(chan WSMessage),
		RateLimiter: NewRateLimiter(10, time.Minute),
		ChatService: chatService,
	}
	return h
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			if !isValidStringID(client.UserID) {
				log.Printf("Refusing registration for client with invalid UserID format: %s", client.UserID)
				client.Conn.Close()
				continue
			}
			h.Clients[client] = true
			log.Printf("Client %s registered. Total clients: %d", client.UserID, len(h.Clients))

		case client := <-h.Unregister:
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				// Only close if the channel hasn't been closed elsewhere (e.g., in SendError)
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
				h.BroadcastToRoom(payload.ChatRoomID, message)
			}
		}
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

// Refactored to iterate directly over the map
func (h *Hub) BroadcastToRoom(roomID string, message WSMessage) {
	if clients, exists := h.Rooms[roomID]; exists {
		for client := range clients {
			select {
			case client.Send <- message:
				if message.Type == "message" {
					payloadBytes, _ := json.Marshal(MessageDeliveredPayload{MessageID: message.MessageID})
					select {
					case client.Send <- WSMessage{Type: "message_delivered", Payload: payloadBytes}:
					default:
						log.Printf("Client %s: Failed to send message_delivered ack (channel blocked). Unregistering.", client.UserID)
						h.Unregister <- client
					}
				}
			default:
				log.Printf("Client %s: Send channel blocked. Unregistering client.", client.UserID)
				h.Unregister <- client
			}
		}
	}
}

// --- Supabase Chat Service ---

type SupabaseChatService struct {
	hub *Hub
}

func NewSupabaseChatService() *SupabaseChatService {
	return &SupabaseChatService{}
}

func (cs *SupabaseChatService) SetHub(hub *Hub) {
	cs.hub = hub
}

func (cs *SupabaseChatService) CreateChatRoom(buyerID, vendorID string, productID *string) (*ChatRoom, error) {
	if !isValidStringID(buyerID) || !isValidStringID(vendorID) {
		return nil, fmt.Errorf("invalid buyer or vendor ID format (must be %d characters)", UserIDLength)
	}

	existingRoom, err := cs.findExistingRoom(buyerID, vendorID, productID)
	if err != nil {
		log.Printf("Error checking for existing chat room: %v", err)
		return nil, fmt.Errorf("failed to check for existing room: %v", err)
	}
	if existingRoom != nil {
		log.Printf("Found existing chat room ID %s for buyer %s, vendor %s", existingRoom.ID, buyerID, vendorID)
		return existingRoom, nil
	}

	roomData := map[string]interface{}{
		"buyer_id": buyerID,
		"vendor_id": vendorID,
	}
	if productID != nil {
		roomData["product_id"] = *productID
	}

	headers := map[string]string{
		"Prefer": "return=representation",
	}

	resp, err := db.MakeDBRequest("POST", "/rest/v1/chat_rooms", roomData, headers)
	if err != nil {
		log.Printf("Error making DB request to create chat room: %v", err)
		return nil, fmt.Errorf("failed to make DB request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("Failed to create chat room, status: %d, response: %s", resp.StatusCode, string(bodyBytes))
		return nil, fmt.Errorf("failed to create chat room: status %d, response: %s", resp.StatusCode, string(bodyBytes))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response body after creating chat room: %v", err)
		return nil, fmt.Errorf("failed to read response: %v", err)
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

func (cs *SupabaseChatService) findExistingRoom(buyerID, vendorID string, productID *string) (*ChatRoom, error) {
	query := fmt.Sprintf("buyer_id=eq.%s&vendor_id=eq.%s", buyerID, vendorID)
	if productID != nil {
		query += fmt.Sprintf("&product_id=eq.%s", *productID)
	} else {
		query += "&product_id=is.null"
	}

	endpoint := fmt.Sprintf("/rest/v1/chat_rooms?%s", query)
	resp, err := db.MakeDBRequest("GET", endpoint, nil, nil)
	if err != nil {
		log.Printf("Error querying existing chat rooms: %v", err)
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("Failed to query chat rooms, status: %d, response: %s", resp.StatusCode, string(bodyBytes))
		return nil, fmt.Errorf("failed to query chat rooms: status %d, response: %s", resp.StatusCode, string(bodyBytes))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response body for existing chat room query: %v", err)
		return nil, err
	}

	var rooms []ChatRoom
	if err := json.Unmarshal(body, &rooms); err != nil {
		log.Printf("Error parsing existing chat room response: %v, body: %s", err, string(body))
		return nil, err
	}

	if len(rooms) > 0 {
		return &rooms[0], nil
	}

	return nil, nil
}

func (cs *SupabaseChatService) SendMessage(chatRoomID, senderID, content string) (*Message, error) {
	if _, err := uuid.Parse(chatRoomID); err != nil {
		return nil, fmt.Errorf("chat_room_id is not a valid UUID: %v", err)
	}
	if !isValidStringID(senderID) {
		return nil, fmt.Errorf("sender_id is not a valid string ID (must be %d characters)", UserIDLength)
	}
	if len(content) == 0 || len(content) > 1000 {
		return nil, fmt.Errorf("message content must be between 1 and 1000 characters")
	}

	messageData := map[string]interface{}{
		"chat_room_id": chatRoomID,
		"sender_id": senderID,
		"content": content,
		"message_type": "text",
		"is_read": false,
	}

	resp, err := db.MakeDBRequest(
		"POST",
		"/rest/v1/messages",
		messageData,
		map[string]string{
			"Prefer": "return=representation",
		},
	)

	if err != nil {
		log.Printf("Error making DB request to send message: %v", err)
		return nil, fmt.Errorf("failed to make DB request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("Failed to send message to DB, status: %d, response: %s", resp.StatusCode, string(bodyBytes))
		return nil, fmt.Errorf("failed to send message: status %d, response: %s", resp.StatusCode, string(bodyBytes))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response body after sending message: %v", err)
		return nil, fmt.Errorf("failed to read response: %v", err)
	}

	var messages []Message
	if err := json.Unmarshal(body, &messages); err != nil {
		log.Printf("Error parsing send message response: %v, body: %s", err, string(body))
		return nil, fmt.Errorf("failed to parse response: %v", err)
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
		ID: message.ID,
		ChatRoomID: message.ChatRoomID,
		SenderID: message.SenderID,
		Content: message.Content,
		CreatedAt: message.CreatedAt,
		SenderName: senderName,
		DeliveredAt: message.DeliveredAt,
	}

	payloadBytes, err := json.Marshal(chatMsg)
	if err != nil {
		log.Printf("Error marshalling NewMessagePayload: %v", err)
		// Still return the message even if broadcast marshalling fails
		return message, nil
	}
	
	if cs.hub != nil {
		cs.hub.Broadcast <- WSMessage{
			Type: "message",
			Payload: payloadBytes,
			MessageID: message.ID,
		}
	} else {
		log.Println("Warning: Hub is nil in SupabaseChatService. Message cannot be broadcast.")
	}


	return message, nil
}

func (cs *SupabaseChatService) getSenderName(userID string) (string, error) {
	if !isValidStringID(userID) {
		return "Unknown User", fmt.Errorf("userID is not a valid string ID (must be %d characters)", UserIDLength)
	}

	// First try the users table (first_name or last_name)
	endpoint := fmt.Sprintf("/rest/v1/users?id=eq.%s&select=first_name,last_name", userID)
	resp, err := db.MakeDBRequest("GET", endpoint, nil, nil)
	if err != nil {
		log.Printf("Error making DB request to get user: %v", err)
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		body, err := io.ReadAll(resp.Body)
		if err == nil {
			var users []map[string]interface{}
			if err := json.Unmarshal(body, &users); err == nil && len(users) > 0 {
				// Prioritize first_name, then last name
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

	// Now try the vendors table (email or phone)
	vendorEndpoint := fmt.Sprintf("/rest/v1/vendors?id=eq.%s&select=first_name,email", userID)
	vendorResp, err := db.MakeDBRequest("GET", vendorEndpoint, nil, nil)
	if err != nil {
		log.Printf("Error making DB request to get vendor: %v", err)
		return "", err
	}
	defer vendorResp.Body.Close()

	if vendorResp.StatusCode == http.StatusOK {
		body, err := io.ReadAll(vendorResp.Body)
		if err == nil {
			var vendors []map[string]interface{}
			if err := json.Unmarshal(body, &vendors); err == nil && len(vendors) > 0 {
				// Prioritize first_name, then last_name
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
		log.Printf("Error making DB request to get chat history: %v", err)
		return nil, fmt.Errorf("failed to get chat history: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("Failed to get chat history, status: %d, response: %s", resp.StatusCode, string(bodyBytes))
		return nil, fmt.Errorf("failed to get chat history: status %d, response: %s", resp.StatusCode, string(bodyBytes))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response body for chat history: %v", err)
		return nil, fmt.Errorf("failed to read response: %v", err)
	}

	var messages []Message
	if err := json.Unmarshal(body, &messages); err != nil {
		log.Printf("Error parsing chat history response: %v, body: %s", err, string(body))
		return nil, fmt.Errorf("failed to parse response: %v", err)
	}

	// Reverse the order to display chronologically (oldest first)
	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, nil
}

func (cs *SupabaseChatService) GetUserChatRooms(userID string) ([]ChatRoom, error) {
	if !isValidStringID(userID) {
		return nil, fmt.Errorf("user_id is not a valid string ID (must be %d characters)", UserIDLength)
	}

	query := fmt.Sprintf("or=(buyer_id.eq.%s,vendor_id.eq.%s)", userID, userID)
	endpoint := fmt.Sprintf("/rest/v1/chat_rooms?%s&order=updated_at.desc", query)
	resp, err := db.MakeDBRequest("GET", endpoint, nil, nil)
	if err != nil {
		log.Printf("Error making DB request to get user chat rooms: %v", err)
		return nil, fmt.Errorf("failed to get user chat rooms: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("Failed to get user chat rooms, status: %d, response: %s", resp.StatusCode, string(bodyBytes))
		return nil, fmt.Errorf("failed to get user chat rooms: status %d, response: %s", resp.StatusCode, string(bodyBytes))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("Error reading response body for user chat rooms: %v", err)
		return nil, fmt.Errorf("failed to read response: %v", err)
	}

	var chatRooms []ChatRoom
	if err := json.Unmarshal(body, &chatRooms); err != nil {
		log.Printf("Error parsing user chat rooms response: %v, body: %s", err, string(body))
		return nil, fmt.Errorf("failed to parse response: %v", err)
	}

	return chatRooms, nil
}

func (cs *SupabaseChatService) MarkMessagesAsRead(chatRoomID, userID string) error {
	if _, err := uuid.Parse(chatRoomID); err != nil {
		return fmt.Errorf("chat_room_id is not a valid UUID: %v", err)
	}
	if !isValidStringID(userID) {
		return fmt.Errorf("user_id is not a valid string ID (must be %d characters)", UserIDLength)
	}

	data := map[string]interface{}{
		"is_read": true,
		"delivered_at": time.Now().UTC().Format(time.RFC3339Nano),
	}

	// PATCH only messages not sent by the user AND not already read
	query := fmt.Sprintf("chat_room_id=eq.%s&sender_id=neq.%s&is_read=eq.false", chatRoomID, userID)
	endpoint := fmt.Sprintf("/rest/v1/messages?%s", query)
	resp, err := db.MakeDBRequest("PATCH", endpoint, data, nil)
	if err != nil {
		log.Printf("Error making DB request to mark messages as read: %v", err)
		return fmt.Errorf("failed to mark messages as read: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Printf("Failed to mark messages as read, status: %d, response: %s", resp.StatusCode, string(bodyBytes))
		return fmt.Errorf("failed to mark messages as read: status %d, response: %s", resp.StatusCode, string(bodyBytes))
	}
	log.Printf("Marked messages in room %s as read for user %s.", chatRoomID, userID)
	return nil
}

func (cs *SupabaseChatService) GetUnreadMessageCount(userID string) (int, error) {
	if !isValidStringID(userID) {
		return 0, fmt.Errorf("user_id is not a valid string ID (must be %d characters)", UserIDLength)
	}

	chatRooms, err := cs.GetUserChatRooms(userID)
	if err != nil {
		log.Printf("Error getting chat rooms for unread count: %v", err)
		return 0, err
	}

	totalUnread := 0
	for _, room := range chatRooms {
		// Only count messages sent by the other party and not read
		query := fmt.Sprintf("chat_room_id=eq.%s&sender_id=neq.%s&is_read=eq.false", room.ID, userID)
		endpoint := fmt.Sprintf("/rest/v1/messages?%s&select=id", query)
		resp, err := db.MakeDBRequest("GET", endpoint, nil, nil)
		if err != nil {
			log.Printf("Error making DB request for unread messages in room %s: %v", room.ID, err)
			continue
		}
		// NOTE: Deferring outside the loop is risky as it only executes at the end of GetUnreadMessageCount. 
		// Since the original code placed it inside the loop, we will stick to that to ensure connections are closed promptly.
		// defer resp.Body.Close() 

		if resp.StatusCode == http.StatusOK {
			body, err := io.ReadAll(resp.Body)
			if err != nil {
				log.Printf("Error reading response body for unread messages in room %s: %v", room.ID, err)
				resp.Body.Close() // Ensure connection is closed after reading/error
				continue
			}

			var messages []map[string]interface{}
			if err := json.Unmarshal(body, &messages); err != nil {
				log.Printf("Error parsing unread messages response for room %s: %v, body: %s", room.ID, err, string(body))
				resp.Body.Close() // Ensure connection is closed after error
				continue
			}
			totalUnread += len(messages)
		} else {
			log.Printf("Failed to get unread messages for room %s, status: %d", room.ID, resp.StatusCode)
		}
		resp.Body.Close() // Explicitly close the body for each loop iteration
	}

	return totalUnread, nil
}

func (cs *SupabaseChatService) GetUserChatRoomsWithLastMessage(userID string) ([]map[string]interface{}, error) {
	if !isValidStringID(userID) {
		return nil, fmt.Errorf("user_id is not a valid string ID (must be %d characters)", UserIDLength)
	}

	chatRooms, err := cs.GetUserChatRooms(userID)
	if err != nil {
		log.Printf("Error getting chat rooms for last message aggregation: %v", err)
		return nil, err
	}

	var result []map[string]interface{}
	for _, room := range chatRooms {
		roomData := map[string]interface{}{
			"id": room.ID,
			"buyer_id": room.BuyerID,
			"vendor_id": room.VendorID,
			"product_id": room.ProductID,
			"created_at": room.CreatedAt,
			"updated_at": room.UpdatedAt,
		}

		// 1. Get Last Message
		messages, err := cs.GetChatHistory(room.ID, 1, 0)
		if err == nil && len(messages) > 0 {
			lastMessage := messages[0]
			roomData["last_message"] = map[string]interface{}{
				"id": lastMessage.ID,
				"content": lastMessage.Content,
				"created_at": lastMessage.CreatedAt,
				"sender_id": lastMessage.SenderID,
				"is_read": lastMessage.IsRead,
			}
		} else if err != nil {
			log.Printf("Warning: Could not get last message for room %s: %v", room.ID, err)
		}

		// 2. Get Unread Count
		query := fmt.Sprintf("chat_room_id=eq.%s&sender_id=neq.%s&is_read=eq.false", room.ID, userID)
		endpoint := fmt.Sprintf("/rest/v1/messages?%s&select=id", query)
		resp, err := db.MakeDBRequest("GET", endpoint, nil, nil)
		if err == nil {
			// defer resp.Body.Close() // Moved inside if block or handled explicitly
			if resp.StatusCode == http.StatusOK {
				body, _ := io.ReadAll(resp.Body)
				var unreadMessages []map[string]interface{}
				if json.Unmarshal(body, &unreadMessages) == nil {
					roomData["unread_count"] = len(unreadMessages)
				} else {
					log.Printf("Warning: Could not parse unread count response for room %s: %v", room.ID, err)
					roomData["unread_count"] = 0
				}
			} else {
				log.Printf("Warning: Failed to get unread count for room %s, status: %d", room.ID, resp.StatusCode)
				roomData["unread_count"] = 0
			}
			resp.Body.Close() // Close the body
		} else {
			log.Printf("Warning: Error requesting unread count for room %s: %v", room.ID, err)
			roomData["unread_count"] = 0
		}

		result = append(result, roomData)
	}

	return result, nil
}

// -------------------------------------------------------------
// HTTP HANDLERS (THE MISSING METHODS)
// -------------------------------------------------------------

// Helper for consistent error responses
func respondWithError(w http.ResponseWriter, code int, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	// Ignore error on encoding simple error response
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}

// HandleWebSocket upgrades the HTTP connection to a WebSocket.
func (cs *SupabaseChatService) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("user_id")
	if !isValidStringID(userID) {
		log.Printf("WebSocket connection refused: Invalid user_id format: %s", userID)
		respondWithError(w, http.StatusUnauthorized, "Invalid or missing user_id (must be 7 characters)")
		return
	}
	
	if cs.hub == nil {
		respondWithError(w, http.StatusServiceUnavailable, "Chat service is not fully initialized. Hub is missing.")
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade failed:", err)
		return
	}

	client := &Client{
		UserID: userID,
		Conn: conn,
		Hub: cs.hub,
		Send: make(chan WSMessage, 256),
	}

	cs.hub.Register <- client

	go client.WritePump()
	go client.ReadPump()
}

// CreateChatRoomHandler handles the creation of a new chat room.
func (cs *SupabaseChatService) CreateChatRoomHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		BuyerID   string  `json:"buyer_id"`
		VendorID  string  `json:"vendor_id"`
		ProductID *string `json:"product_id,omitempty"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	room, err := cs.CreateChatRoom(req.BuyerID, req.VendorID, req.ProductID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(room)
}

// GetUserChatRoomsHandler retrieves all chat rooms associated with a user.
func (cs *SupabaseChatService) GetUserChatRoomsHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("user_id")
	if !isValidStringID(userID) {
		respondWithError(w, http.StatusBadRequest, "Invalid user_id format")
		return
	}

	rooms, err := cs.GetUserChatRooms(userID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(rooms)
}

// GetUserChatRoomsWithLastMessageHandler retrieves rooms with last message and unread count.
func (cs *SupabaseChatService) GetUserChatRoomsWithLastMessageHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("user_id")
	if !isValidStringID(userID) {
		respondWithError(w, http.StatusBadRequest, "Invalid user_id format")
		return
	}

	rooms, err := cs.GetUserChatRoomsWithLastMessage(userID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(rooms)
}

// SendMessageHandler sends a message via HTTP (for non-WS users).
func (cs *SupabaseChatService) SendMessageHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ChatRoomID string `json:"room_id"`
		SenderID string `json:"sender_id"`
		Content string `json:"content"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// SendMessage handles validation and DB persistence
	message, err := cs.SendMessage(req.ChatRoomID, req.SenderID, req.Content)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error()) 
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(message)
}

// GetChatHistoryHandler retrieves the history for a given room.
func (cs *SupabaseChatService) GetChatHistoryHandler(w http.ResponseWriter, r *http.Request) {
	roomID := r.URL.Query().Get("room_id")
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	// Parse limit and offset with defaults
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 { limit = 50 }
	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 { offset = 0 }

	messages, err := cs.GetChatHistory(roomID, limit, offset)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(messages)
}

// MarkMessagesAsReadHandler marks all messages in a room, sent by the other party, as read.
func (cs *SupabaseChatService) MarkMessagesAsReadHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ChatRoomID string `json:"room_id"`
		UserID string `json:"user_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	if err := cs.MarkMessagesAsRead(req.ChatRoomID, req.UserID); err != nil {
		respondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetUnreadCountHandler retrieves the total number of unread messages for a user.
func (cs *SupabaseChatService) GetUnreadCountHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("user_id")
	if !isValidStringID(userID) {
		respondWithError(w, http.StatusBadRequest, "Invalid user_id format")
		return
	}

	count, err := cs.GetUnreadMessageCount(userID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]int{"unread_count": count})
}