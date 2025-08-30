package chat

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"sync"
	"time"
	"uFinda/internal/db"
	"strconv"
	"github.com/google/uuid"
	// "github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

// WebSocket upgrader with stricter origin check
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		if origin == "" {
			// Allow requests without Origin header (e.g., Postman)
			// disable in production
			return true
		}
		allowedOrigins := []string{
			"http://localhost:3000",
			// your production origins
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
	ID        string     `json:"id"`
	BuyerID   string     `json:"buyer_id"`
	VendorID  string     `json:"vendor_id"`
	ProductID *string    `json:"product_id,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

type Message struct {
	ID          string     `json:"id"`
	ChatRoomID  string     `json:"chat_room_id"`
	SenderID    string     `json:"sender_id"`
	Content     string     `json:"content"`
	MessageType string     `json:"message_type"`
	IsRead      bool       `json:"is_read"`
	CreatedAt   time.Time  `json:"created_at"`
	DeliveredAt *time.Time `json:"delivered_at,omitempty"`
}

type ChatMessage struct {
	ID          string     `json:"id"`
	ChatRoomID  string     `json:"chat_room_id"`
	SenderID    string     `json:"sender_id"`
	Content     string     `json:"content"`
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
	ChatRoomID string `json:"room_id"`
	Content    string `json:"content"`
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
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		var rawMsg WSMessage
		err := c.Conn.ReadJSON(&rawMsg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket unexpected close for user %s: %v", c.UserID, err)
			} else {
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

			// Save the message to DB
			_, err := c.Hub.ChatService.SendMessage(payload.ChatRoomID, c.UserID, payload.Content)
			if err != nil {
				log.Printf("Client %s: Failed to persist message: %v", c.UserID, err)
				c.SendError("Failed to save message")
				continue
			}

			// senderName, err := c.Hub.ChatService.getSenderName(c.UserID)
    		// if err != nil {
			// 	log.Printf("Warning: Could not get sender name for user %s: %v. Using 'Unknown User'.", c.UserID, err)
			// 	senderName = "Unknown User"
			// }

			// // Prepare enriched payload to broadcast
			// broadcastPayload := NewMessagePayload{
			// 	ID:          message.ID,
			// 	ChatRoomID:  message.ChatRoomID,
			// 	SenderID:    message.SenderID,
			// 	Content:     message.Content,
			// 	CreatedAt:   message.CreatedAt,
			// 	SenderName:  SenderName,
			// 	DeliveredAt: message.DeliveredAt,
			// }
			// payloadBytes, err := json.Marshal(broadcastPayload)
			// if err != nil {
			// 	log.Printf("Client %s: Failed to marshal broadcast payload: %v", c.UserID, err)
			// 	c.SendError("Internal error")
			// 	continue
			// }

			// // Broadcast the saved message to everyone
			// messageToHub := WSMessage{
			// 	Type:      "message",
			// 	Payload:   payloadBytes,
			// 	MessageID: message.ID,
			// }
			// c.Hub.Broadcast <- messageToHub


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
				log.Printf("Client %s: WebSocket ping error部分error: %v", c.UserID, err)
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
	Clients     map[*Client]bool
	Rooms       map[string]map[*Client]bool
	Register    chan *Client
	Unregister  chan *Client
	Broadcast   chan WSMessage
	RateLimiter *RateLimiter
	ChatService *SupabaseChatService
}

func NewHub() *Hub {
	return &Hub{
		Clients:     make(map[*Client]bool),
		Rooms:       make(map[string]map[*Client]bool),
		Register:    make(chan *Client),
		Unregister:  make(chan *Client),
		Broadcast:   make(chan WSMessage),
		RateLimiter: NewRateLimiter(20, time.Minute),
		ChatService: nil,
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.Clients[client] = true
			log.Printf("Client %s registered. Total clients: %d", client.UserID, len(h.Clients))

		case client := <-h.Unregister:
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				close(client.Send)

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
				log.Printf("Hub: uuid: %v", payload.ChatRoomID)
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

func (h *Hub) BroadcastToRoom(roomID string, message WSMessage) {
	if clients, exists := h.Rooms[roomID]; exists {
		clientsToBroadcast := make([]*Client, 0, len(clients))
		for client := range clients {
			clientsToBroadcast = append(clientsToBroadcast, client)
		}

		for _, client := range clientsToBroadcast {
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

func NewSupabaseChatService(hub *Hub) *SupabaseChatService {
	return &SupabaseChatService{hub: hub}
}

func (cs *SupabaseChatService) CreateChatRoom(buyerID, vendorID string, productID *string) (*ChatRoom, error) {
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
		"buyer_id":  buyerID,
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
	if _, err := uuid.Parse(senderID); err != nil {
		return nil, fmt.Errorf("sender_id is not a valid UUID: %v", err)
	}
	if len(content) == 0 || len(content) > 1000 {
		return nil, fmt.Errorf("message content must be between 1 and 1000 characters")
	}

	messageData := map[string]interface{}{
		"chat_room_id": chatRoomID,
		"sender_id":    senderID,
		"content":      content,
		"message_type": "text",
		"is_read":      false,
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
		ID:          message.ID,
		ChatRoomID:  message.ChatRoomID,
		SenderID:    message.SenderID,
		Content:     message.Content,
		CreatedAt:   message.CreatedAt,
		SenderName:  senderName,
		DeliveredAt: message.DeliveredAt,
	}

	payloadBytes, err := json.Marshal(chatMsg)
	if err != nil {
		log.Printf("Error marshalling NewMessagePayload: %v", err)
		return message, nil
	}

	cs.hub.Broadcast <- WSMessage{
		Type:      "message",
		Payload:   payloadBytes,
		MessageID: message.ID,
	}

	return message, nil
}

func (cs *SupabaseChatService) getSenderName(userID string) (string, error) {
	// First try the users table (email or phone)
	endpoint := fmt.Sprintf("/rest/v1/users?id=eq.%s&select=phone,email", userID)
	resp, err := db.MakeDBRequest("GET", endpoint, nil, nil)
	if err != nil {
		log.Printf("Error making DB request to get user: %v", err)
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		var users []map[string]interface{}
		if err := json.Unmarshal(body, &users); err == nil && len(users) > 0 {
			if phone, ok := users[0]["phone"].(string); ok && phone != "" {
				return phone, nil
			}
			if email, ok := users[0]["email"].(string); ok && email != "" {
				return email, nil
			}
		}
	}

	// Now try the vendors table (email or phone)
	vendorEndpoint := fmt.Sprintf("/rest/v1/vendors?id=eq.%s&select=phone,email", userID)
	vendorResp, err := db.MakeDBRequest("GET", vendorEndpoint, nil, nil)
	if err != nil {
		log.Printf("Error making DB request to get vendor: %v", err)
		return "", err
	}
	defer vendorResp.Body.Close()

	if vendorResp.StatusCode == http.StatusOK {
		body, _ := io.ReadAll(vendorResp.Body)
		var vendors []map[string]interface{}
		if err := json.Unmarshal(body, &vendors); err == nil && len(vendors) > 0 {
			if phone, ok := vendors[0]["phone"].(string); ok && phone != "" {
				return phone, nil
			}
			if email, ok := vendors[0]["email"].(string); ok && email != "" {
				return email, nil
			}
		}
	}

	return "Unknown User", fmt.Errorf("sender not found in users or vendors for ID %s", userID)
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

	for i, j := 0, len(messages)-1; i < j; i, j = i+1, j-1 {
		messages[i], messages[j] = messages[j], messages[i]
	}

	return messages, nil
}

func (cs *SupabaseChatService) GetUserChatRooms(userID string) ([]ChatRoom, error) {
	if _, err := uuid.Parse(userID); err != nil {
		return nil, fmt.Errorf("user_id is not a valid UUID: %v", err)
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
	if _, err := uuid.Parse(userID); err != nil {
		return fmt.Errorf("user_id is not a valid UUID: %v", err)
	}

	data := map[string]interface{}{
		"is_read":      true,
		"delivered_at": time.Now().UTC().Format(time.RFC3339Nano),
	}

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
	if _, err := uuid.Parse(userID); err != nil {
		return 0, fmt.Errorf("user_id is not a valid UUID: %v", err)
	}

	chatRooms, err := cs.GetUserChatRooms(userID)
	if err != nil {
		log.Printf("Error getting chat rooms for unread count: %v", err)
		return 0, err
	}

	totalUnread := 0
	for _, room := range chatRooms {
		query := fmt.Sprintf("chat_room_id=eq.%s&sender_id=neq.%s&is_read=eq.false", room.ID, userID)
		endpoint := fmt.Sprintf("/rest/v1/messages?%s&select=id", query)
		resp, err := db.MakeDBRequest("GET", endpoint, nil, nil)
		if err != nil {
			log.Printf("Error making DB request for unread messages in room %s: %v", room.ID, err)
			continue
		}
		defer resp.Body.Close()

		if resp.StatusCode == http.StatusOK {
			body, err := io.ReadAll(resp.Body)
			if err != nil {
				log.Printf("Error reading response body for unread messages in room %s: %v", room.ID, err)
				continue
			}

			var messages []map[string]interface{}
			if err := json.Unmarshal(body, &messages); err != nil {
				log.Printf("Error parsing unread messages response for room %s: %v, body: %s", room.ID, err, string(body))
				continue
			}
			totalUnread += len(messages)
		} else {
			log.Printf("Failed to get unread messages for room %s, status: %d", room.ID, resp.StatusCode)
		}
	}

	return totalUnread, nil
}

func (cs *SupabaseChatService) GetUserChatRoomsWithLastMessage(userID string) ([]map[string]interface{}, error) {
	if _, err := uuid.Parse(userID); err != nil {
		return nil, fmt.Errorf("user_id is not a valid UUID: %v", err)
	}

	chatRooms, err := cs.GetUserChatRooms(userID)
	if err != nil {
		log.Printf("Error getting chat rooms for last message aggregation: %v", err)
		return nil, err
	}

	var result []map[string]interface{}
	for _, room := range chatRooms {
		roomData := map[string]interface{}{
			"id":         room.ID,
			"buyer_id":   room.BuyerID,
			"vendor_id":  room.VendorID,
			"product_id": room.ProductID,
			"created_at": room.CreatedAt,
			"updated_at": room.UpdatedAt,
		}

		messages, err := cs.GetChatHistory(room.ID, 1, 0)
		if err == nil && len(messages) > 0 {
			lastMessage := messages[0]
			roomData["last_message"] = map[string]interface{}{
				"id":         lastMessage.ID,
				"content":    lastMessage.Content,
				"created_at": lastMessage.CreatedAt,
				"sender_id":  lastMessage.SenderID,
				"is_read":    lastMessage.IsRead,
			}
		} else if err != nil {
			log.Printf("Warning: Could not get last message for room %s: %v", room.ID, err)
		}

		query := fmt.Sprintf("chat_room_id=eq.%s&sender_id=neq.%s&is_read=eq.false", room.ID, userID)
		endpoint := fmt.Sprintf("/rest/v1/messages?%s&select=id", query)
		resp, err := db.MakeDBRequest("GET", endpoint, nil, nil)
		if err == nil {
			defer resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				body, _ := io.ReadAll(resp.Body)
				var unreadMessages []map[string]interface{}
				if json.Unmarshal(body, &unreadMessages) == nil {
					roomData["unread_count"] = len(unreadMessages)
				} else {
					log.Printf("Warning: Could not parse unread count response for room %s: %v", room.ID, err)
				}
			} else {
				log.Printf("Warning: Failed to get unread count for room %s, status: %d", room.ID, resp.StatusCode)
			}
		} else {
			log.Printf("Warning: Could not make DB request for unread count for room %s: %v", room.ID, err)
		}

		result = append(result, roomData)
	}

	return result, nil
}

// --- HTTP Handlers ---

func (cs *SupabaseChatService) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	userID := r.Header.Get("id")
	username := r.Header.Get("username")

	if userID == "" || username == "" {
		log.Printf("WebSocket Unauthorized: Missing user credentials")
		http.Error(w, "Unauthorized: Missing user credentials", http.StatusUnauthorized)
		return
	}
	if _, err := uuid.Parse(userID); err != nil {
		log.Printf("WebSocket Unauthorized: Invalid user_id UUID: %s", userID)
		http.Error(w, "Unauthorized: Invalid user_id format", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade error for user %s: %v", userID, err)
		http.Error(w, "WebSocket upgrade failed", http.StatusInternalServerError)
		return
	}

	client := &Client{
		UserID:   userID,
		Username: username,
		Conn:     conn,
		Hub:      cs.hub,
		Send:     make(chan WSMessage, 256),
	}

	cs.hub.Register <- client
	go client.WritePump()
	go client.ReadPump()
	log.Printf("Client %s connected via WebSocket.", client.UserID)
}

func (cs *SupabaseChatService) CreateChatRoomHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		BuyerID   string  `json:"buyer_id"`
		VendorID  string  `json:"vendor_id"`
		ProductID *string `json:"product_id,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}

	if req.BuyerID == "" || req.VendorID == "" {
		http.Error(w, "Buyer ID and Vendor ID are required", http.StatusBadRequest)
		return
	}
	if _, err := uuid.Parse(req.BuyerID); err != nil {
		http.Error(w, "Invalid buyer_id format", http.StatusBadRequest)
		return
	}
	if _, err := uuid.Parse(req.VendorID); err != nil {
		http.Error(w, "Invalid vendor_id format", http.StatusBadRequest)
		return
	}
	if req.ProductID != nil {
		if _, err := uuid.Parse(*req.ProductID); err != nil {
			http.Error(w, "Invalid product_id format", http.StatusBadRequest)
			return
		}
	}

	chatRoom, err := cs.CreateChatRoom(req.BuyerID, req.VendorID, req.ProductID)
	if err != nil {
		log.Printf("Error in CreateChatRoomHandler: %v", err)
		http.Error(w, fmt.Sprintf("Failed to create chat room: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(chatRoom)
}

func (cs *SupabaseChatService) SendMessageHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ChatRoomID string `json:"chat_room_id"`
		SenderID   string `json:"sender_id"`
		Content    string `json:"content"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}

	if req.ChatRoomID == "" || req.SenderID == "" || req.Content == "" {
		http.Error(w, "Missing required fields: chat_room_id, sender_id, or content", http.StatusBadRequest)
		return
	}
	if _, err := uuid.Parse(req.ChatRoomID); err != nil {
		http.Error(w, "Invalid chat_room_id format", http.StatusBadRequest)
		return
	}
	if _, err := uuid.Parse(req.SenderID); err != nil {
		http.Error(w, "Invalid sender_id format", http.StatusBadRequest)
		return
	}

	message, err := cs.SendMessage(req.ChatRoomID, req.SenderID, req.Content)
	if err != nil {
		log.Printf("Error in SendMessageHandler: %v", err)
		http.Error(w, fmt.Sprintf("Failed to send message: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(message)
}

func (cs *SupabaseChatService) GetChatHistoryHandler(w http.ResponseWriter, r *http.Request) {
	chatRoomID := r.URL.Query().Get("room_id")
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	if chatRoomID == "" {
		http.Error(w, "Missing room_id", http.StatusBadRequest)
		return
	}
	if _, err := uuid.Parse(chatRoomID); err != nil {
		http.Error(w, "Invalid room_id format", http.StatusBadRequest)
		return
	}

	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit == 0 {
		limit = 50
	}
	if limit > 100 {
		limit = 100
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil || offset < 0 {
		offset = 0
	}

	messages, err := cs.GetChatHistory(chatRoomID, limit, offset)
	if err != nil {
		log.Printf("Error in GetChatHistoryHandler: %v", err)
		http.Error(w, fmt.Sprintf("Failed to get chat history: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(messages)
}

func (cs *SupabaseChatService) GetUserChatRoomsHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		http.Error(w, "Missing user_id", http.StatusBadRequest)
		return
	}
	if _, err := uuid.Parse(userID); err != nil {
		http.Error(w, "Invalid user_id format", http.StatusBadRequest)
		return
	}

	chatRooms, err := cs.GetUserChatRooms(userID)
	if err != nil {
		log.Printf("Error in GetUserChatRoomsHandler: %v", err)
		http.Error(w, fmt.Sprintf("Failed to get chat rooms: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(chatRooms)
}

func (cs *SupabaseChatService) MarkMessagesAsReadHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ChatRoomID string `json:"chat_room_id"`
		UserID     string `json:"user_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, fmt.Sprintf("Invalid request body: %v", err), http.StatusBadRequest)
		return
	}

	if req.ChatRoomID == "" || req.UserID == "" {
		http.Error(w, "Missing required fields: chat_room_id or user_id", http.StatusBadRequest)
		return
	}
	if _, err := uuid.Parse(req.ChatRoomID); err != nil {
		http.Error(w, "Invalid chat_room_id format", http.StatusBadRequest)
		return
	}
	if _, err := uuid.Parse(req.UserID); err != nil {
		http.Error(w, "Invalid user_id format", http.StatusBadRequest)
		return
	}

	if err := cs.MarkMessagesAsRead(req.ChatRoomID, req.UserID); err != nil {
		log.Printf("Error in MarkMessagesAsReadHandler: %v", err)
		http.Error(w, fmt.Sprintf("Failed to mark messages as read: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "success", "message": "Messages marked as read"})
}

func (cs *SupabaseChatService) GetUnreadCountHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		http.Error(w, "Missing user_id", http.StatusBadRequest)
		return
	}
	if _, err := uuid.Parse(userID); err != nil {
		http.Error(w, "Invalid user_id format", http.StatusBadRequest)
		return
	}

	count, err := cs.GetUnreadMessageCount(userID)
	if err != nil {
		log.Printf("Error in GetUnreadCountHandler: %v", err)
		http.Error(w, fmt.Sprintf("Failed to get unread count: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]int{"unread_count": count})
}

func (cs *SupabaseChatService) GetUserChatRoomsWithLastMessageHandler(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		http.Error(w, "Missing user_id", http.StatusBadRequest)
		return
	}
	if _, err := uuid.Parse(userID); err != nil {
		http.Error(w, "Invalid user_id format", http.StatusBadRequest)
		return
	}

	chatRooms, err := cs.GetUserChatRoomsWithLastMessage(userID)
	if err != nil {
		log.Printf("Error in GetUserChatRoomsWithLastMessageHandler: %v", err)
		http.Error(w, fmt.Sprintf("Failed to get chat rooms with last message: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(chatRooms)
}

// func SetupSupabaseChatRoutes(router *mux.Router) {
// 	hub := NewHub()
// 	go hub.Run()

// 	chatService := NewSupabaseChatService(hub)

// 	router.HandleFunc("/ws/chat", chatService.HandleWebSocket)
// 	router.HandleFunc("/api/chat/rooms", chatService.CreateChatRoomHandler).Methods("POST")
// 	router.HandleFunc("/api/chat/rooms", chatService.GetUserChatRoomsHandler).Methods("GET")
// 	router.HandleFunc("/api/chat/rooms/with-last-message", chatService.GetUserChatRoomsWithLastMessageHandler).Methods("GET")
// 	router.HandleFunc("/api/chat/messages", chatService.SendMessageHandler).Methods("POST")
// 	router.HandleFunc("/api/chat/messages", chatService.GetChatHistoryHandler).Methods("GET")
// 	router.HandleFunc("/api/chat/messages/mark-read", chatService.MarkMessagesAsReadHandler).Methods("POST")
// 	router.HandleFunc("/api/chat/unread-count", chatService.GetUnreadCountHandler).Methods("GET")

// 	log.Println("Chat routes registered successfully.")
// }