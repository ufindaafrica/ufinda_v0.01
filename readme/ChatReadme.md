## CHAT README

This documentation provides a comprehensive overview of the uFinda Chat System, covering both the **WebSocket** protocol and the **REST API** endpoints.

---

## 1. WebSocket API

**Base URL:** `wss://ufinda-v0-01.onrender.com/ws/chat`

**Authentication:** Requires a valid session/token (handled via middleware).

### Client-to-Server Events

Clients send JSON messages to perform actions.

| Action | Payload Required | Description |
| --- | --- | --- |
| **Join Room** | `{"type": "join_room", "payload": {"room_id": "UUID"}}` | Subscribes to a specific chat room to receive real-time messages. |
| **Leave Room** | `{"type": "leave_room", "payload": {"room_id": "UUID"}}` | Unsubscribes from a chat room. |
| **Send Message** | `{"type": "message", "payload": {"room_id": "UUID", "content": "text/url", "message_type": "text/image/audio", "public_id": "string?"}}` | Sends a message. `public_id` is required for media types. |

### Server-to-Client Events

The server broadcasts these messages to the relevant clients.

#### `new_message`

Sent to the recipient when a new message arrives.

* **Payload Example:**
```json
{
  "type": "new_message",
  "payload": {
    "id": "msg_uuid",
    "chat_room_id": "room_uuid",
    "sender_id": "user_uuid",
    "content": "Hello!",
    "message_type": "text",
    "sender_name": "Olalekan",
    "created_at": "2026-01-23T...",
    "new_changes": { "display_name": "New Name", "profile_img": "url" }
  }
}

```


> **Note:** `new_changes` is only populated if the sender's profile has updated since the recipient last saw it (synced via Redis).



#### `message_delivered`

Sent back to the **sender** to acknowledge the message was saved and broadcasted.

* **Payload:** `{"message_id": "UUID"}`

---

## 2. REST API Endpoints

All endpoints require authentication and return `MsgServerError` on internal failure.
**Base URL:** `https://ufinda-v0-01.onrender.com`

### Chat Rooms

#### **Create Chat Room**

`POST [BASE_URL]/chat/rooms`

* **Request Payload:**
```json
{ "vendor_id": "UUID" }

```


* **Expected Return (201 Created):**
```json
{
  "id": "room_uuid",
  "buyer_id": "user_uuid",
  "vendor_id": "vendor_uuid",
  "recipient_info": {
    "user_id": "vendor_uuid",
    "display_name": "VendorName",
    "profile_img": "url"
  }
}

```



#### **Get Chat Rooms (Summary)**

`GET [BASE_URL]/chat/rooms/with-last-message`

* **Description:** Returns all rooms for the user including the last message, unread count, and any profile updates (`new_changes`).
* **Expected Return (200 OK):**
```json
[
  {
    "id": "room_uuid",
    "last_message": { "content": "Last msg here", "created_at": "..." },
    "unread_count": 3,
    "new_changes": { "display_name": "Updated Name" }
  }
]

```



### Messages

#### **Get Chat History**

`GET [BASE_URL]/chat/messages?room_id=UUID&page=1`

* **Parameters:** `room_id` (required), `page` (optional, default 1, 20 msgs per page).
* **Expected Return (200 OK):** An array of `Message` objects ordered by `created_at` (Ascending for UI).

#### **Mark Messages as Read**

`POST [BASE_URL]/chat/messages/mark-read`

* **Request Payload:** `{ "room_id": "UUID" }`
* **Expected Return:** `204 No Content`

#### **Total Unread Count**

`GET [BASE_URL]/chat/unread-count`

* **Expected Return (200 OK):** `{ "unread_count": 5 }`

### Utilities

#### **Get Cloudinary Signature**

`GET /chat/signature`

* **Description:** Generates a secure signature for client-side uploads.
* **Expected Return (200 OK):** `{ "signature": "...", "timestamp": "..." }`

---

## 3. Technical Constraints & Logic

* **Rate Limiting:** Users are restricted to **10 messages per minute**.
* **Message Lengths:** * Text: Max 1000 characters.
* Image/Audio: Max 500 characters (URL length).


* **Profile Sync:** The system uses Redis to track when User A last saw User B's profile. If User B updates their photo, the very next message sent will include a `new_changes` payload so the UI can update the contact info without a fresh API call.
* **Offline Delivery:** If a recipient is not connected to the WebSocket, the system automatically triggers a **Push Notification** via the `notification` package.
