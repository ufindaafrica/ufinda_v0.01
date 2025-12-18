## CHAT SERVICE APIs

### Base URL (REST API)

| Environment | URL |
| --- | --- |
| **Production** | `https://ufinda-v0-01.onrender.com` |
| **Local Dev** | `http://localhost:8080` |

---

### WebSocket Connection (Real-Time)

The WebSocket endpoint is secured using the authentication token. It provides the persistent pipe for instant message delivery.

| Protocol | Endpoint | Description |
| --- | --- | --- |
| `ws` / `wss` | `/ws/chat` | Establishes a real-time connection. |

**Example Connection URI:** `wss://base_url/ws/chat?token=<access_token>`

---

## I. REST Endpoints (Rooms & History)

All REST endpoints require the `Authorization: Bearer <access_token>` header. **User IDs are extracted automatically from the token.**

### 1. GET `/chat/rooms`

Retrieves all chat rooms where the authenticated user is either the buyer or the vendor. This returns the raw room metadata.

**Expected Payload (Success 200 OK):**

```json
[
  {
    "id": "1e2d3e4f-5060-7080-90a0-b0c0d0e0f123",
    "buyer_id": "user_uuid_123",
    "vendor_id": "vendor_uuid_456",
    "product_id": "product_uuid_789",
    "created_at": "2025-12-05T17:00:00Z",
    "updated_at": "2025-12-05T17:05:00Z"
  }
]

```

---

### 2. GET `/chat/rooms/with-last-message`

Retrieves chat rooms for the authenticated user, fetching only the **most recent message** for each room. Used for the main "Inbox" screen.

**Expected Payload (Success 200 OK):**

```json
[
  {
    "id": "1e2d3e4f-5060-7080-90a0-b0c0d0e0f123",
    "buyer_id": "user_uuid_123",
    "vendor_id": "vendor_uuid_456",
    "product_id": null,
    "created_at": "2025-12-13T12:27:24.097662+00:00",
    "updated_at": "2025-12-13T12:27:24.097662+00:00",
    "messages": [
      {
        "content": "Is this still available?",
        "created_at": "2025-12-05T17:05:00Z",
        "message_type": "text"|"image"
      }
    ]
  }
]

```

---

### 3. POST `/chat/rooms`

Creates a new room or returns an existing one between two parties.

**Request Body:**

```json
{
  "buyer_id": "UUID",
  "vendor_id": "UUID",
  "product_id": "UUID (Optional)"
}

```

**Expected Payload (Success 201 Created):**

```json
{
  "id": "1e2d3e4f-5060-7080-90a0-b0c0d0e0f123",
  "buyer_id": "UUID",
  "vendor_id": "UUID",
  "product_id": null,
  "created_at": "2025-12-05T17:00:00Z"
}

```

---

### 4. GET `/chat/messages`

Fetches paginated message history for a specific room.

**Query Params:** `room_id` (Required), `limit`, `offset`.

**Expected Payload (Success 200 OK):**

```json
[
  {
    "id": "msg_uuid_1",
    "chat_room_id": "room_uuid",
    "sender_id": "user_uuid",
    "content": "Hello!",
    "message_type": "text",
    "is_read": true,
    "created_at": "2025-12-05T17:00:00Z"
  }
]

```

---

### 5. POST `/chat/messages`

REST fallback to send a message.

**Request Body:**

```json
{
  "room_id": "UUID",
  "content": "Message text or Image URL",
  "message_type": "text",
  "public_id": "cloudinary_id (Optional)"
}

```

**Expected Payload (Success 201 Created):**

```json
{
  "id": "msg_uuid",
  "chat_room_id": "room_uuid",
  "sender_id": "your_id",
  "content": "Message text",
  "message_type": "text",
  "is_read": false,
  "created_at": "2025-12-05T17:10:00Z"
}

```

---

### 6. POST `/chat/messages/mark-read`

Updates unread messages in a room to `is_read: true`.

**Request Body:**

```json
{
  "room_id": "UUID"
}

```

**Expected Payload (Success 204 No Content):**
*(No body returned)*

---

### 7. GET `/chat/unread-count`

Total count of unread messages across all rooms for the user.

**Expected Payload (Success 200 OK):**

```json
{
  "unread_count": 5
}

```

---

### 8. POST `/chat/upload-img`

Uploads a raw image file to Cloudinary.

**Request Body:** `multipart/form-data` with field `image`.

**Expected Payload (Success 200 OK):**

```json
{
  "url": "https://res.cloudinary.com/...",
  "public_id": "chat/abc123",
  "message_type": "image"
}

```

---

## II. WebSocket Protocol (Real-Time)

### A. Mobile ➡️ Server (Actions)

| Type | Payload Example |
| --- | --- |
| **`join_room`** | `{"room_id": "UUID"}` |
| **`message`** | `{"room_id": "UUID", "content": "...", "message_type": "text"}` |

### B. Server ➡️ Mobile (Events)

#### `type: "message"`

Broadcast to the recipient when a new message arrives.

**Expected Payload:**

```json
{
  "type": "message",
  "payload": {
    "id": "msg_uuid",
    "chat_room_id": "room_uuid",
    "sender_id": "sender_uuid",
    "content": "Hey!",
    "message_type": "text",
    "created_at": "2025-12-05T17:00:00Z"
  }
}

```

#### `type: "message_delivered"`

Confirmation sent back to the **sender** after the database successfully saves the message.

**Expected Payload:**

```json
{
  "type": "message_delivered",
  "payload": {
    "message_id": "msg_uuid"
  }
}

---------