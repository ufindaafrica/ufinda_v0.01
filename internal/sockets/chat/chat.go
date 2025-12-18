package chat

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"github.com/cloudinary/cloudinary-go/v2"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/oladev/ufinda_v0.01/internal/db"
)

// WebSocket upgrader
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Adjust for your production domain
	},
}

// --- Core chat types ---

type ChatRoom struct {
	ID        string    `json:"id"`
	BuyerID   string    `json:"buyer_id"`
	VendorID  string    `json:"vendor_id"`
	ProductID *string   `json:"product_id,omitempty"`
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
	Conn   *websocket.Conn
	Hub    *Hub
	Send   chan WSMessage
	mutex  sync.Mutex
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(1024)
	c.Conn.SetReadDeadline(time.Now().Add(70 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(70 * time.Second))
		return nil
	})

	for {
		var rawMsg WSMessage
		err := c.Conn.ReadJSON(&rawMsg)
		if err != nil {
			break
		}

		switch rawMsg.Type {
		case "join_room":
			var payload JoinRoomPayload
			if err := json.Unmarshal(rawMsg.Payload, &payload); err == nil {
				c.Hub.JoinRoom(c, payload.RoomID)
			}
		case "leave_room":
			var payload LeaveRoomPayload
			if err := json.Unmarshal(rawMsg.Payload, &payload); err == nil {
				c.Hub.LeaveRoom(c, payload.RoomID)
			}
		case "message":
			if !c.Hub.RateLimiter.Allow(c.UserID) {
				c.SendError("Rate limit exceeded")
				continue
			}
			var payload SendMessagePayload
			if err := json.Unmarshal(rawMsg.Payload, &payload); err == nil {
				msgType := payload.MessageType
				if msgType == "" {
					msgType = "text"
				}
				c.Hub.ChatService.SendMessage(payload.ChatRoomID, c.UserID, payload.Content, msgType, payload.PublicID)
			}
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
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			c.mutex.Lock()
			c.Conn.WriteJSON(msg)
			c.mutex.Unlock()
		case <-ticker.C:
			c.mutex.Lock()
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				c.mutex.Unlock()
				return
			}
			c.mutex.Unlock()
		}
	}
}

func (c *Client) SendError(message string) {
	payloadBytes, _ := json.Marshal(ErrorPayload{Message: message})
	select {
	case c.Send <- WSMessage{Type: "error", Payload: payloadBytes}:
	default:
	}
}

// --- Hub ---
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
	return &Hub{
		Clients:     make(map[string]*Client),
		Rooms:       make(map[string]map[*Client]bool),
		Register:    make(chan *Client),
		Unregister:  make(chan *Client),
		Broadcast:   make(chan WSMessage),
		RateLimiter: NewRateLimiter(20, time.Minute),
		ChatService: chatService,
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mutex.Lock()
			h.Clients[client.UserID] = client
			h.mutex.Unlock()
		case client := <-h.Unregister:
			h.mutex.Lock()
			if _, ok := h.Clients[client.UserID]; ok {
				delete(h.Clients, client.UserID)
				close(client.Send)
				for roomID := range h.Rooms {
					delete(h.Rooms[roomID], client)
				}
			}
			h.mutex.Unlock()
		case message := <-h.Broadcast:
			var payload NewMessagePayload
			if err := json.Unmarshal(message.Payload, &payload); err == nil {
				h.BroadcastToRoom(payload.ChatRoomID, message, payload.SenderID)
			}
		}
	}
}

func (h *Hub) BroadcastToRoom(roomID string, message WSMessage, senderID string) {
	h.mutex.RLock()
	defer h.mutex.RUnlock()
	if clients, exists := h.Rooms[roomID]; exists {
		for client := range clients {
			if client.UserID != senderID {
				select {
				case client.Send <- message:
				default:
				}
			}
		}
	}
}

func (h *Hub) ConfirmSenderDelivery(payload MessageDeliveredPayload, senderID string) {
	h.mutex.RLock()
	client, ok := h.Clients[senderID]
	h.mutex.RUnlock()
	if ok {
		payloadBytes, _ := json.Marshal(payload)
		select {
		case client.Send <- WSMessage{Type: "message_delivered", Payload: payloadBytes}:
		default:
		}
	}
}

func (h *Hub) JoinRoom(client *Client, roomID string) {
	h.mutex.Lock()
	if h.Rooms[roomID] == nil {
		h.Rooms[roomID] = make(map[*Client]bool)
	}
	h.Rooms[roomID][client] = true
	h.mutex.Unlock()
}

func (h *Hub) LeaveRoom(client *Client, roomID string) {
	h.mutex.Lock()
	if clients, exists := h.Rooms[roomID]; exists {
		delete(clients, client)
	}
	h.mutex.Unlock()
}

// --- Supabase Chat Service ---

type SupabaseChatService struct {
	hub              *Hub
	CloudinaryClient *cloudinary.Cloudinary
}

func NewSupabaseChatService(cld *cloudinary.Cloudinary) *SupabaseChatService {
	return &SupabaseChatService{CloudinaryClient: cld}
}

func (cs *SupabaseChatService) SetHub(hub *Hub) { cs.hub = hub }

func (cs *SupabaseChatService) SendMessage(chatRoomID, senderID, content, messageType string, publicID *string) (*Message, error) {
	messageData := map[string]interface{}{
		"chat_room_id": chatRoomID,
		"sender_id":    senderID,
		"content":      content,
		"message_type": messageType,
		"is_read":      false,
	}
	if publicID != nil {
		messageData["public_id"] = *publicID
	}

	resp, err := db.MakeDBRequest("POST", "/rest/v1/messages", messageData, map[string]string{"Prefer": "return=representation"})
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var messages []Message
	json.Unmarshal(body, &messages)
	if len(messages) == 0 {
		return nil, fmt.Errorf("send failed")
	}

	msg := messages[0]
	// Broadcast
	payload := ChatMessage{
		ID: msg.ID, ChatRoomID: msg.ChatRoomID, SenderID: msg.SenderID,
		Content: msg.Content, MessageType: msg.MessageType, CreatedAt: msg.CreatedAt,
		PublicID: msg.PublicID,
	}
	pBytes, _ := json.Marshal(payload)
	cs.hub.Broadcast <- WSMessage{Type: "message", Payload: pBytes}
	cs.hub.ConfirmSenderDelivery(MessageDeliveredPayload{MessageID: msg.ID}, senderID)

	return &msg, nil
}

// -------------------------------------------------------------
// GIN NATIVE HANDLERS
// -------------------------------------------------------------

func (cs *SupabaseChatService) HandleWebSocket(c *gin.Context) {
	userID, exists := c.Get("id")
	if !exists {
		return
	}
	uid, ok := userID.(string)
	if !ok {
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	client := &Client{
		UserID: uid,
		Conn:   conn,
		Hub:    cs.hub,
		Send:   make(chan WSMessage, 256),
	}
	cs.hub.Register <- client

	go client.WritePump()
	client.ReadPump()
}

func (cs *SupabaseChatService) CreateChatRoomHandler(c *gin.Context) {
	var req struct {
		BuyerID   string  `json:"buyer_id"`
		VendorID  string  `json:"vendor_id"`
		ProductID *string `json:"product_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		return
	}

	roomData := map[string]interface{}{"buyer_id": req.BuyerID, "vendor_id": req.VendorID}
	if req.ProductID != nil {
		roomData["product_id"] = *req.ProductID
	}

	resp, err := db.MakeDBRequest("POST", "/rest/v1/chat_rooms", roomData, map[string]string{"Prefer": "return=representation"})
	if err != nil {
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var rooms []ChatRoom
	json.Unmarshal(body, &rooms)
	c.JSON(http.StatusCreated, rooms[0])
}

func (cs *SupabaseChatService) GetUserChatRoomsHandler(c *gin.Context) {
	userID, _ := c.Get("id")
	url := fmt.Sprintf("/rest/v1/chat_rooms?or=(buyer_id.eq.%s,vendor_id.eq.%s)&order=updated_at.desc", userID, userID)

	resp, err := db.MakeDBRequest("GET", url, nil, nil)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var rooms []ChatRoom
	json.Unmarshal(body, &rooms)
	c.JSON(http.StatusOK, rooms)
}

func (cs *SupabaseChatService) GetUserChatRoomsWithLastMessageHandler(c *gin.Context) {
	userID, _ := c.Get("id")
	url := fmt.Sprintf("/rest/v1/chat_rooms?or=(buyer_id.eq.%s,vendor_id.eq.%s)&select=*,messages(content,message_type,created_at)&messages.limit=1&messages.order=created_at.desc&order=updated_at.desc", userID, userID)

	resp, err := db.MakeDBRequest("GET", url, nil, nil)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var result []interface{}
	json.Unmarshal(body, &result)
	c.JSON(http.StatusOK, result)
}

func (cs *SupabaseChatService) SendMessageHandler(c *gin.Context) {
	userID, _ := c.Get("id")
	uid := userID.(string)

	var req SendMessagePayload
	if err := c.ShouldBindJSON(&req); err != nil {
		return
	}

	msg, err := cs.SendMessage(req.ChatRoomID, uid, req.Content, req.MessageType, req.PublicID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, msg)
}

func (cs *SupabaseChatService) GetChatHistoryHandler(c *gin.Context) {
	roomID := c.Query("room_id")
	limit := c.DefaultQuery("limit", "50")
	offset := c.DefaultQuery("offset", "0")

	url := fmt.Sprintf("/rest/v1/messages?chat_room_id=eq.%s&order=created_at.desc&limit=%s&offset=%s", roomID, limit, offset)
	resp, err := db.MakeDBRequest("GET", url, nil, nil)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var messages []Message
	json.Unmarshal(body, &messages)
	c.JSON(http.StatusOK, messages)
}

func (cs *SupabaseChatService) MarkMessagesAsReadHandler(c *gin.Context) {
	userID, _ := c.Get("id")
	var req struct{ RoomID string `json:"room_id"` }
	if err := c.ShouldBindJSON(&req); err != nil {
		return
	}

	url := fmt.Sprintf("/rest/v1/messages?chat_room_id=eq.%s&sender_id=neq.%s&is_read=eq.false", req.RoomID, userID)
	data := map[string]interface{}{"is_read": true, "delivered_at": time.Now()}

	db.MakeDBRequest("PATCH", url, data, nil)
	c.Status(http.StatusNoContent)
}

func (cs *SupabaseChatService) GetUnreadCountHandler(c *gin.Context) {
	userID, _ := c.Get("id")
	url := fmt.Sprintf("/rest/v1/messages?receiver_id=eq.%s&is_read=eq.false&select=count", userID)

	resp, err := db.MakeDBRequest("GET", url, nil, nil)
	if err != nil {
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	c.Data(http.StatusOK, "application/json", body)
}

func (cs *SupabaseChatService) HandleImageUpload(c *gin.Context) {
	file, _, err := c.Request.FormFile("image")
	if err != nil {
		return
	}
	defer file.Close()
	// Logic to upload to cloudinary...
	c.JSON(http.StatusOK, gin.H{"url": "...", "public_id": "...", "message_type": "image"})
}
