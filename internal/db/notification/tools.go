package notifdb

import (
	"github.com/oladev/ufinda_v0.01/internal/db"
	"fmt"
	"io"
	"net/url"
	"net/http"
	"encoding/json"
	"bytes"
	"errors"
	"time"
	"log"
)

var ErrTokenNotFound = errors.New("no token found for device")

// ExpoPushMessage defines the standard Expo payload
type ExpoPushMessage struct {
	To    string                 `json:"to"`
	Title string                 `json:"title"`
	Body  string                 `json:"body"`
	Data  map[string]interface{} `json:"data"`
	Sound string                 `json:"sound"`
}

// ExpoResponse handles the polymorphic response from Expo
type ExpoResponse struct {
	Data []struct {
		Status  string `json:"status"`
		ID      string `json:"id"`
		Message string `json:"message"`
		Details *struct {
			Error string `json:"error"`
		} `json:"details,omitempty"`
	} `json:"data"`
}


func CreatePushToken(data db.PushNotificationToken) error {
	url := fmt.Sprintf("/rest/v1/device_tokens")

	resp, err := db.MakeDBRequest("POST", url, data, nil)
	if err != nil {
		return fmt.Errorf("failed to save push token: %v", err)
	}

	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated {
		bodyBytes, _ := io.ReadAll(resp.Body)

		bodyString := string(bodyBytes)
		return fmt.Errorf("failed to save push token: server responded with status %d and body: %s", resp.StatusCode, bodyString)
	}

	return nil
}

// GetPushTokens now returns a slice of tokens instead of just one
func GetPushTokens(userID string) ([]db.PushNotificationToken, error) {
    // We filter by user_id to get all devices owned by this user
    url := fmt.Sprintf("/rest/v1/device_tokens?user_id=eq.%s", url.QueryEscape(userID))

    resp, err := db.MakeDBRequest("GET", url, nil, nil)
    if err != nil {
        return nil, fmt.Errorf("failed to get device push tokens: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        bodyBytes, _ := io.ReadAll(resp.Body)
        return nil, fmt.Errorf("failed to get tokens: status %d, body: %s", resp.StatusCode, string(bodyBytes))
    }

    var pushTokens []db.PushNotificationToken
    if err := json.NewDecoder(resp.Body).Decode(&pushTokens); err != nil {
        return nil, fmt.Errorf("failed to decode push tokens: %w", err)
    }

    if len(pushTokens) == 0 {
        return nil, ErrTokenNotFound
    }

    return pushTokens, nil
}


func SendPushNotification(token, title, body, chatID string) error {
	url := "https://exp.host/--/api/v2/push/send"

	msg := ExpoPushMessage{
		To:    token,
		Title: title,
		Body:  body,
		Data:  map[string]interface{}{"chat_id": chatID},
		Sound: "default",
	}

	// Expo strictly expects an array of messages
	payload, err := json.Marshal([]ExpoPushMessage{msg})
	if err != nil {
		return fmt.Errorf("failed to marshal push message: %w", err)
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(payload))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	client := &http.Client{Timeout: 10 * time.Second}
	
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request to expo: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("expo API error (%d): %s", resp.StatusCode, string(bodyBytes))
	}

	// Helper to handle both object and array responses from Expo
	var raw map[string]json.RawMessage
	if err := json.Unmarshal(bodyBytes, &raw); err != nil {
		return fmt.Errorf("failed to parse response: %w", err)
	}

	var tickets []struct {
		Status  string `json:"status"`
		ID      string `json:"id"`
		Message string `json:"message"`
		Details *struct {
			Error string `json:"error"`
		} `json:"details"`
	}

	// If Data is an object, wrap it in a slice; if it's an array, just unmarshal
	dataRaw := raw["data"]
	if len(dataRaw) > 0 && dataRaw[0] == '{' {
		var single struct {
			Status  string `json:"status"`
			ID      string `json:"id"`
			Message string `json:"message"`
			Details *struct{ Error string `json:"error"` } `json:"details"`
		}
		json.Unmarshal(dataRaw, &single)
		tickets = append(tickets, single)
	} else {
		json.Unmarshal(dataRaw, &tickets)
	}

	for _, ticket := range tickets {
		if ticket.Status == "error" {
			if ticket.Details != nil && ticket.Details.Error == "DeviceNotRegistered" {
				log.Printf("[CLEANUP] Token %s invalid. Deleting...", token)
				// DeleteInvalidToken(token) 
			} else {
				log.Printf("[ERROR] Expo error: %s", ticket.Message)
			}
		} else {
			log.Printf("[SUCCESS] Delivered: %s", ticket.ID)
		}
	}

	return nil
}