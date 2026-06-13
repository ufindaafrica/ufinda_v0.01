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
| **Join Room** | `{"type": "join_room", "payload": {"room_id": "UUID"}}` | Subscribes to a specific chat room. |
| **Leave Room** | `{"type": "leave_room", "payload": {"room_id": "UUID"}}` | Unsubscribes from a chat room. |
| **Send Message** | `{"type": "message", "payload": {"room_id": "UUID", "content": "text/url", "message_type": "text/image/audio", "public_id": "string?"}}` | Sends a message. |

### Server-to-Client Events

#### `new_message`

Sent to the recipient when a new message arrives.

* **Payload Structure:**

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
    // One of the following two fields will be present:
    "new_changes": {"profile_img": "url"}, 
    // OR
    "profile_img": "url"
  }
}

```

> **Client Logic for Profile Images:**
> * If `new_changes` is present, it contains a delta update. Use the `profile_img` inside `new_changes` to **immediately update** the recipient's cached profile image in your UI.
> * If `new_changes` is absent, the `profile_img` field (if present) provides the current image. Only update the UI if you do not currently have a profile image cached for this user, or use it to verify your existing cache.
> 
> 

---

## 2. REST API Endpoints

**Base URL:** `https://ufinda-v0-01.onrender.com`

### Chat Rooms

#### **Create Chat Room**

`POST [BASE_URL]/chat/rooms`

* **Request Payload:** `{ "vendor_id": "UUID" }`
* **Response (201 Created):**

```json
{
  "id": "room_uuid",
  "recipient_info": {
    "user_id": "vendor_uuid",
    "profile_img": "url" // Use this for the initial chat icon
  }
}

```

#### **Get Chat Rooms (Summary)**

`GET [BASE_URL]/chat/rooms/with-last-message`

* **Description:** Returns a list of active rooms.
* **Response (200 OK):**

```json
[
  {
    "id": "room_uuid",
    "last_message": { "content": "...", "created_at": "..." },
    // Similar to WebSocket events, new_changes indicates a profile photo update
    "new_changes": { "profile_img": "new_url_here" } 
  }
]

```

---

## 3. Technical Constraints & Logic

* **Profile Sync Strategy:** The system uses Redis to track when the sender last updated their profile.
* **Efficiency:** We only send the `new_changes` object when an actual update has occurred, ensuring the mobile client doesn't perform unnecessary UI re-renders or local database writes.
* **Initial Load:** When creating a room or fetching the room list, always check if `new_changes` is available to keep your local cache synchronized.


* **Offline Delivery:** If a recipient is not connected to the WebSocket, the system automatically triggers a **Push Notification**. Upon reconnecting and calling the history/room list endpoints, the client will receive the current state and any pending `new_changes`.