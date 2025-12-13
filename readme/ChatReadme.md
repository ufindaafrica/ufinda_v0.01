## CHAT SERVICE APIs

### Base URL (REST API)

The base URL for all **REST API** requests:

| Environment | URL |
| :--- | :--- |
| **Production** | `https://ufinda-v0-01.onrender.com` |
| **Local Dev** | `http://localhost:8080` |

-----

### WebSocket Connection (Real-Time)

The WebSocket endpoint is secured using the authentication token.

| Protocol | Endpoint | Description |
| :--- | :--- | :--- |
| `ws` / `wss` | `/ws/chat` | Establishes a real-time connection. |

#### Connection Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| **`token`** | `string` | **Yes** | The full **access token** used for authentication. The server extracts the validated `user_id` from this token. |

> **Example Connection URI:** `wss://base_url/ws/chat?**token**=<access_token>`

-----

## IMPORTANT: Authorization and User ID Changes

All API access (REST and WebSocket) is strictly controlled by the **`Authorization: Bearer <token>`** header or the **`token` query parameter**.

  * **No Manual `user_id` Passing:** The server extracts the validated `user_id` from the JWT token's payload. **The mobile developer should NOT pass the `user_id`** in the query or body for endpoints that act on the currently authenticated user (e.g., getting rooms, unread count).

-----

## I. REST Endpoints (Rooms, History, & Upload)

All REST endpoints are prefixed with `/chat` and require the `Authorization: Bearer <access_token>` header.

### 1\. GET `/chat/rooms/with-last-message`

Retrieves a list of the authenticated user's chat rooms, including the last message, read status, and unread count. (Maps to `GetUserChatRoomsWithLastMessageHandler`).

#### Request

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/chat/rooms/with-last-message` | Retrieves all rooms for the **authenticated user**. |

#### Query Parameters

**None required.** User ID is extracted from the token.

#### Headers

| Header | Example Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <access_token>` | **REQUIRED**. The user's current access token. |

#### Responses

##### Success

| Status Code | Description |
| :--- | :--- |
| `200 OK` | The list of chat rooms with aggregated details was successfully retrieved. |

**Body**

```json
[
  {
    "id": "1e2d3e4f-5060-7080-90a0-b0c0d0e0f123",
    "buyer_id": "B112233",
    "vendor_id": "V998877",
    "product_id": "prod-xyz-123",
    "unread_count": 3,
    "last_message": {
        "content": "I'll take three units.",
        "message_type": "text",
        "public_id": null,
        "created_at": "2025-12-05T17:05:00Z",
        "sender_id": "B112233",
        "is_read": false
    }
  }
]
```

-----

### 2\. POST `/chat/rooms`

Creates a new chat room. If an existing room exists with the same parties and optional product, the existing room is returned. (Maps to `CreateChatRoomHandler`).

#### Request

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/chat/rooms` | Initiates a new chat room. |

#### Body (`application/json`)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `buyer_id` | `string` | **Yes** | The ID of the Buyer. |
| `vendor_id` | `string` | **Yes** | The ID of the Vendor. |
| `product_id` | `string` | No | **Optional** product identifier. |

#### Headers

| Header | Example Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <access_token>` | **REQUIRED**. The user's current access token. |

#### Responses

##### Success

| Status Code | Description |
| :--- | :--- |
| `201 Created` | A new chat room was created or an existing one was successfully retrieved. |

**Body**

```json
{
  "id": "1e2d3e4f-5060-7080-90a0-b0c0d0e0f123",
  "buyer_id": "B112233",
  "vendor_id": "V998877",
  "product_id": "prod-xyz-123",
  "created_at": "2025-12-05T17:00:00Z"
}
```

-----

### 3\. GET `/chat/messages`

Retrieves a paginated list of messages for a specific room. (Maps to `GetChatHistoryHandler`).

#### Request

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/chat/messages` | Fetches the message history for a room. |

#### Query Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `room_id` | `string` | **Yes** | The UUID of the chat room. |
| `limit` | `number` | No (Default: 50) | Max number of messages to return per request. |
| `offset` | `number` | No (Default: 0) | The number of messages to skip (used for pagination). |

#### Headers

| Header | Example Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <access_token>` | **REQUIRED**. The user's current access token. |

#### Responses

##### Success

| Status Code | Description |
| :--- | :--- |
| `200 OK` | The list of messages was successfully retrieved. |

**Body**

```json
[
  {
    "id": "m1234567-890a-bcde-f123-4567890abcde",
    "chat_room_id": "1e2d3e4f-5060-7080-90a0-b0c0d0e0f123",
    "sender_id": "B112233",
    "content": "Hello, is this product available?",
    "message_type": "text",
    "public_id": null,
    "created_at": "2025-12-05T17:00:00Z",
    "is_read": true
  },
  // ... more messages
]
```

-----

### 4\. POST `/chat/upload-img` **(IMAGE UPLOAD)**

Uploads an image file to Cloudinary. Used as the first step for sending images. (Maps to `HandleImageUpload`).

#### Request

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/chat/upload-img` | Uploads image file. |

#### Body (`multipart/form-data`)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| **`image`** | `File` | **Yes** | The image file (max 10MB). **Field name must be `image`**. |

#### Headers

| Header | Example Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <access_token>` | **REQUIRED**. The user's current access token. |

#### Responses

##### Success

| Status Code | Description |
| :--- | :--- |
| `200 OK` | Image uploaded successfully. The client must save this payload for the subsequent WebSocket `message` action. |

**Body**

```json
{
  "url": "https://res.cloudinary.com/.../unique_file.jpg",
  "public_id": "chat/images/unique_file",
  "message_type": "image"
}
```

-----

### 5\. POST `/chat/messages/mark-read` **(NEW HTTP METHOD)**

Marks all messages in a specific room, which were *not* sent by the requesting user, as read. (Maps to `MarkMessagesAsReadHandler`).

#### Request

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/chat/messages/mark-read` | Sets the read status for all unread messages for the authenticated user. |

#### Body (`application/json`) **(UPDATED)**

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `room_id` | `string` | **Yes** | The UUID of the chat room. |
| \~\~`user_id`\~\~ | \~\~`string`\~\~ | **No** | **REMOVED. Extracted from Authorization Header.** |

#### Headers

| Header | Example Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <access_token>` | **REQUIRED**. The user's current access token. |

#### Responses

##### Success

| Status Code | Description |
| :--- | :--- |
| `204 No Content` | Messages were successfully marked as read. **(Triggers `message_read` WS event)**. |

-----

### 6\. GET `/chat/unread-count`

Retrieves the aggregated total unread message count across **all** of a user's chat rooms. (Maps to `GetUnreadCountHandler`).

#### Request

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/chat/unread-count` | Fetches the total number of unread messages for the **authenticated user**. |

#### Query Parameters

**None required.** User ID is extracted from the token.

#### Headers

| Header | Example Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <access_token>` | **REQUIRED**. The user's current access token. |

#### Responses

##### Success

| Status Code | Description |
| :--- | :--- |
| `200 OK` | The total unread count was successfully retrieved. |

**Body**

```json
{
  "unread_count": 15
}
```

-----

## II. WebSocket Protocol (Real-Time Messaging)

This protocol defines the structure for all real-time events and actions over the established connection (`/ws/chat`).

### A. Mobile ➡️ Server Messages (Actions)

| Type | Action | Description |
| :--- | :--- | :--- |
| `join_room` | Join Room | Starts receiving real-time messages for the specific room ID. |
| `leave_room` | Leave Room | Stops receiving real-time messages for the specific room ID. |
| `message` | Send Message | Submits a new chat message to be saved and broadcast. |

#### `type: "message"` (Sending a new message)

The server automatically fills the `sender_id` based on the connection token.

```json
{
  "type": "message",
  "payload": {
    "room_id": "1e2d3e4f-5060-7080-90a0-b0c0d0e0f123",
    "content": "https://cloudinary.com/.../image.jpg",
    "message_type": "image", // or 'text', 'file', etc.
    "public_id": "chat/images/unique_id" // Required for type 'image' and 'file'
  }
}
```

### B. Server ➡️ Mobile Messages (Events)

| Type | Event | Trigger |
| :--- | :--- | :--- |
| `message` | New Message | A new message was saved to the DB and broadcast to **recipients only**. |
| `message_delivered` | Delivery Confirm | A message sent by the user was successfully saved to the DB (for the sender). |
| **`message_read`** | **Read Receipt** | The recipient has called the `POST /chat/messages/mark-read` endpoint. |
| `error` | Protocol Error | An issue occurred (e.g., rate limit, invalid payload format). |

#### `type: "message"` (Receiving a new message)

This message is only sent to the recipient(s).

```json
{
  "type": "message",
  "message_id": "m1234567-890a-bcde-f123-4567890abcde",
  "payload": {
    "id": "m1234567-890a-bcde-f123-4567890abcde",
    "chat_room_id": "1e2d3e4f-5060-7080-90a0-b0c0d0e0f123",
    "sender_id": "V998877",
    "content": "Yes, we can ship it next week.",
    "message_type": "text", 
    "public_id": null,
    "created_at": "2025-12-05T17:05:00Z",
    "sender_name": "Vendor A Store"
  }
}
```

#### `type: "message_delivered"` (Delivery Confirmation)

Use this to update the sender's UI status.

```json
{
  "type": "message_delivered",
  "payload": {
    "message_id": "m1234567-890a-bcde-f123-4567890abcde"
  }
}
```

#### `type: "message_read"` (Read Receipt)

The sender receives this when the recipient views the messages.

```json
{
  "type": "message_read",
  "payload": {
    "room_id": "1e2d3e4f-5060-7080-90a0-b0c0d0e0f123",
    "reader_id": "R998877"
  }
}
```

-----

## 🛑 Common Errors (REST & WS)

| Status Code | Type (WS) | Description | Resolution |
| :--- | :--- | :--- | :--- |
| `401 Unauthorized` | N/A | Missing or invalid access token (REST or WS connection). | **Ensure token is present in `Authorization` header (REST) or `token` query param (WS).** |
| `400 Bad Request` | `error` | Invalid JSON body/payload or missing required field. | Review endpoint body/query specs. |
| `403 Forbidden` | N/A | User is authenticated but lacks required chat permissions. | Check user's role/permissions. |
| `500 Internal Error` | `error` | Unexpected server issue (DB failure, internal timeout). | Server-side issue; report to backend team. |