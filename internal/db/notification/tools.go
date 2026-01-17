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

type ExpoPushMessage struct {
    To    string                 `json:"to"`          
    Title string                 `json:"title"`           // Title of the message
    Body  string                 `json:"body"`            
    Data  map[string]interface{} `json:"data,omitempty"` // Extra data like chat_id
    Sound string                 `json:"sound"`           // Set to "default"
}

type ExpoResponse struct {
    Data []struct {
        Status  string `json:"status"`
        Message string `json:"message"`
        Details struct {
            Error string `json:"error"`
        } `json:"details"`
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

func SendPushNotification(token string, title string, body string, chatID string) error {
    url := "https://exp.host/--/api/v2/push/send"
    
    msg := ExpoPushMessage{
        To:    token,
        Title: title,
        Body:  body,
        Data:  map[string]interface{}{"chat_id": chatID},
        Sound: "default",
    }

    payload, err := json.Marshal(msg)
    if err != nil {
        return fmt.Errorf("failed to marshal push message: %w", err)
    }

    req, err := http.NewRequest("POST", url, bytes.NewBuffer(payload))
    if err != nil {
        return fmt.Errorf("failed to create request: %w", err)
    }

    req.Header.Set("Content-Type", "application/json")
    req.Header.Set("Accept", "application/json")

    client := &http.Client{Timeout: 10 * time.Second}
    resp, err := client.Do(req)
    if err != nil {
        return fmt.Errorf("failed to send request to expo: %w", err)
    }
    defer resp.Body.Close()

    // Check if Expo accepted the request
    if resp.StatusCode != http.StatusOK {
        bodyBytes, _ := io.ReadAll(resp.Body)
        return fmt.Errorf("expo API returned error: %d, body: %s", resp.StatusCode, string(bodyBytes))
    }

    var expoResp ExpoResponse
    if err := json.NewDecoder(resp.Body).Decode(&expoResp); err != nil {
        return fmt.Errorf("failed to decode expo response: %w", err)
    }

    // Expo returns an array of "tickets" even for a single message
    for _, ticket := range expoResp.Data {
        if ticket.Status == "error" {
            if ticket.Details.Error == "DeviceNotRegistered" {
                log.Printf("[CLEANUP] Token %s is no longer valid. Deleting...", token)
                // Call your DB function here
                // DeleteInvalidToken(token) 
            } else {
                log.Printf("[ERROR] Expo push error: %s - %s", ticket.Details.Error, ticket.Message)
            }
        } else {
            log.Printf("[SUCCESS] Push delivered to token: %s", token)
        }
    }

    return nil
}