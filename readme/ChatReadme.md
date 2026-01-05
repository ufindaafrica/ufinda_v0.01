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

**Example Connection URI:** `wss://[BASE_URL]/ws/chat?token=<access_token>`

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

### 2. GET `[BASE_URL]/chat/rooms/with-last-message`

Retrieves chat rooms for the authenticated user, fetching only the **most recent message** for each room. Used for the main "Inbox" screen.

**Expected Payload (Success 200 OK):**

```json
[
    {
        "buyer_id": "usr-415938",
        "created_at": "2025-12-13T11:27:40.630759Z",
        "id": "996d626f-2d88-4f33-85af-84f8a59f8072",
        "last_message": {
            "content": "https://res.cloudinary.com/dfrew920h/image/upload/v1765627787/chat/images/devilfishwin.JPG.jpg",
            "created_at": "2025-12-13T12:27:24.097662Z",
            "id": "b6b1985f-82eb-47e1-b6a3-d7707748b985",
            "is_read": false,
            "message_type": "image",
            "public_id": "chat/images/devilfishwin.JPG",
            "sender_id": "usr-415938"
        },
        "product_id": null,
        "unread_count": 6,
        "updated_at": "2025-12-13T12:27:24.097662Z",
        "vendor_id": "vnd-414824"
    }
]

```

---

### 3. POST `[BASE_URL]/chat/rooms`

Creates a new room or returns an existing one between two parties.

**Request Body:**

```json
{
    "id": "996d626f-2d88-4f33-85af-84f8a59f8072",
    "buyer_id": "usr-415938",
    "vendor_id": "vnd-414824",
    "created_at": "2025-12-13T11:27:40.630759Z",
    "updated_at": "2025-12-13T12:27:24.097662Z"
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

### 4. GET `[BASE_URL]/chat/messages`

Fetches paginated message history for a specific room.

**Query Params:** `room_id` (Required), `limit`, `offset`.

**Expected Payload (Success 200 OK):**

```json
[
    {
        "id": "3c8ffd4b-096c-4099-b19b-bb92f79d7345",
        "chat_room_id": "996d626f-2d88-4f33-85af-84f8a59f8072",
        "sender_id": "usr-415938",
        "content": "Good afternoon sir",
        "message_type": "text",
        "is_read": true,
        "created_at": "2025-12-13T11:35:32.720532Z",
        "delivered_at": "2025-12-13T12:03:59.148784Z"
    }
]

```

---

### 5. POST `[BASE_URL]/chat/messages`

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

### 6. POST `[BASE_URL]/chat/messages/mark-read`

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

### 7. GET `[BASE_URL]/chat/unread-count`

Total count of unread messages across all rooms for the user.

**Expected Payload (Success 200 OK):**

```json
{
  "unread_count": 5
}

```

---

### GET `[BASE_URL]/chat/signature`

This endpoint provides the necessary security credentials for the client (frontend) to upload media directly to **Cloudinary**. This prevents your backend from handling large file bytes, ensuring high performance and stability on limited-RAM hosting like Render.

---

#### Request

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `[BASE_URL]/hostels/signature` | Generates a signed upload ticket for Cloudinary. |

#### Headers

| Header | Example Value | Description |
| --- | --- | --- |
| `Authorization` | `Bearer <access_token>` | **Required**. Only authenticated vendors can request signatures. |

---

#### Workflow

1. **Timestamp Generation**: The server generates a Unix timestamp to ensure the signature is time-sensitive and cannot be reused indefinitely.
2. **Parameter Mapping**: The system prepares the required upload parameters (e.g., `folder: "chat"`).
3. **Cryptographic Signing**: The server uses your `CLOUDINARY_API_SECRET` to create a HMAC-SHA1 hash of the parameters.
4. **Credential Delivery**: The server returns the signature, timestamp, and public API keys to the client.
5. **Direct Upload**: The client sends the file and these credentials directly to Cloudinary's API.

---

#### Responses

#### Success

| Status Code | Description |
| --- | --- |
| `200 OK` | Signature generated successfully. |

**Body**

```json
{
  "api_key": "123456789012345",
  "cloud_name": "ufinda-cloud",
  "folder": "chat",
  "signature": "a5e8f230b8c7...8d2f",
  "timestamp": 1735468200
}

```

#### Errors

| Status Code | Description |
| --- | --- |
| `401 Unauthorized` | User is not logged in. |
| `500 Internal Error` | Failed to generate signature due to configuration issues. |

---

#### Client Implementation Note

To perform the upload after receiving this signature, the client should send a `POST` request to:
`https://api.cloudinary.com/v1_1/<cloud_name>/auto/upload`

**Form Data Fields:**

* `file`: The media file.
* `api_key`: From the response above.
* `timestamp`: From the response above.
* `signature`: From the response above.
* `folder`: From the response above.

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