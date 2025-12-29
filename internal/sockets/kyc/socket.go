package hub

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

type Client struct {
	UserID string
	Conn   *websocket.Conn
}

type Hub struct {
	clients map[string]*websocket.Conn
	register   chan *Client
	unregister chan *Client
}

type KYCStatusUpdate struct {
	UserID      string `json:"user_id"`
	FinalStatus string `json:"final_status"`
	Message     string `json:"message"`
}

func NewHub() *Hub {
	return &Hub{
		clients:    make(map[string]*websocket.Conn),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			// Register a new client connection
			h.clients[client.UserID] = client.Conn
			log.Printf("WebSocket: Registered user %s. Active clients: %d", client.UserID, len(h.clients))
		
		case client := <-h.unregister:
			// Unregister a client connection
			if _, ok := h.clients[client.UserID]; ok {
				delete(h.clients, client.UserID)
				client.Conn.Close()
				log.Printf("WebSocket: Unregistered user %s. Active clients: %d", client.UserID, len(h.clients))
			}
		}
	}
}

// SendUpdateToUser sends a message to a specific user's active connection.
func (h *Hub) SendUpdateToUser(userID string, update KYCStatusUpdate) {
	conn, ok := h.clients[userID]
	if !ok {
		log.Printf("WebSocket: User %s not currently connected, cannot push update.", userID)
		return
	}

	// Marshal the update struct into JSON
	data, err := json.Marshal(update)
	if err != nil {
		log.Printf("WebSocket Error: Failed to marshal update for user %s: %v", userID, err)
		return
	}

	// Write the message to the WebSocket
	if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
		log.Printf("WebSocket Error: Failed to write message to user %s: %v", userID, err)
		// Assume connection is dead, unregister it
		h.unregister <- &Client{UserID: userID, Conn: conn}
	}
	log.Printf("WebSocket: Successfully pushed status update to user %s", userID)
}


// --- 2. WebSocket Handler ---

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	// Allow cross-origin requests for development
	CheckOrigin: func(r *http.Request) bool { 
		origin := r.Header.Get("Origin")
		if origin == "" {
			return true
		}

		if origin == "http://ufinda-v0-01.onrender.com" {
			return true
		}
		return false
	}, 
}

// WSHandler upgrades the HTTP connection to a WebSocket connection.
// It is now part of the 'hub' package and takes the current Hub instance.
func WSHandler(h *Hub, c *gin.Context) {
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing user_id parameter"})
		return
	}
	
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println(err)
		return
	}
	
	client := &Client{UserID: userID, Conn: conn}
	
	// Register the new client with the hub
	h.register <- client

	// Start a goroutine to listen for incoming messages (e.g., pings or disconnects)
	// This ensures the hub cleans up the connection when the client closes the socket.
	go func() {
		defer func() {
			h.unregister <- client
		}()
		
		// Simple read loop to detect disconnects
		for {
			_, _, err := conn.ReadMessage()
			if err != nil {
				// Detects connection closed by client
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					log.Printf("User %s disconnected: %v", userID, err)
				}
				break
			}
		}
	}()
}
