## CHAT SERVICE APIs

### Base URL (REST API)

The base URL for all **REST API** requests (for history, rooms, and counts):

| Environment | URL |
| :--- | :--- |
| **Production** | `https://ufinda-v0-01.onrender.com` |
| **Local Dev** | `http://localhost:8080` |

-----

### WebSocket Connection (Real-Time)

The WebSocket endpoint is used for real-time messaging, separate from the Base URL above.

| Protocol | Endpoint | Description |
| :--- | :--- | :--- |
| `ws` / `wss` | `/ws/chat` | Establishes a real-time connection. |

#### Connection Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | `string` | **Yes** | The 7-character ID of the authenticated mobile user (e.g., `U123456`). |

> **Example Connection URI:** `wss://base_url/ws/chat?user_id=U123456`

-----

## I. REST Endpoints (Rooms & History)

### 1\. GET `[BASE_URL]/api/v1/chat/rooms/last-message`

Retrieves a list of the user's chat rooms, including the last message and unread count for display in the main chat list view.

#### Request

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/chat/rooms/last-message` | Retrieves all rooms associated with the `user_id`, sorted by latest activity. |

#### Query Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | `string` | **Yes** | The 10-character ID of the user whose rooms are being queried. |

#### Headers

This endpoint requires an `Authorization` header with a valid user access token.

| Header | Example Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <access_token>` | The user's current access token. |

#### Workflow (Conceptual)

1.  **Authorization**: Verify the user token.
2.  **Room Retrieval**: Fetch all rooms where `user_id` is either the `buyer_id` or `vendor_id`.
3.  **Aggregation**: For each room, fetch the **last message** and calculate the **total unread count** (messages sent by the *other* party).
4.  **Response Handling**: Return the aggregated list.

#### Responses

##### Success

| Status Code | Description |
| :--- | :--- |
| `200 OK` | The list of chat rooms with last message details was successfully retrieved. |

**Body**

```json
[
  {
    "id": "1e2d3e4f-5060-7080-90a0-b0c0d0e0f123",
    "buyer_id": "B112233",
    "vendor_id": "V998877",
    "product_id": "prod-xyz-123",
    "updated_at": "2025-12-05T17:05:00Z",
    "unread_count": 3,
    "last_message": {
      "content": "I'll take three units.",
      "created_at": "2025-12-05T17:05:00Z",
      "sender_id": "B112233",
      "is_read": false
    }
  }
]
```

-----

### 2\. POST `[BASE_URL]/api/v1/chat/rooms`

Creates a new chat room between a buyer and a vendor. If a room with the exact same `buyer_id`, `vendor_id`, and (optional) `product_id` already exists, the existing room is returned.

#### Request

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/chat/rooms` | Initiates a new chat room. |

#### Body (`application/json`)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `buyer_id` | `string` | **Yes** | The 10-char ID of the Buyer. |
| `vendor_id` | `string` | **Yes** | The 10-char ID of the Vendor. |
| `product_id` | `string` | No | **Optional** product identifier to link the chat to a specific listing. |

#### Headers

| Header | Example Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <access_token>` | The user's current access token. |

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

### 3\. GET `[BASE_URL]/api/v1/chat/history`

Retrieves a paginated list of messages for a specific room. Messages are returned in chronological order (oldest first).

#### Request

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/chat/history` | Fetches the message history for a room. |

#### Query Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `room_id` | `string` | **Yes** | The UUID of the chat room. |
| `limit` | `number` | No (Default: 50) | Max number of messages to return per request. |
| `offset` | `number` | No (Default: 0) | The number of messages to skip (used for pagination). |

#### Headers

| Header | Example Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <access_token>` | The user's current access token. |

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
    "created_at": "2025-12-05T17:00:00Z",
    "is_read": true
  },
  // ... more messages
]
```

-----

### 4\. PATCH `[BASE_URL]/api/v1/chat/messages/read`

Marks all messages in a specific room, which were *not* sent by the requesting user, as read. Used when the user opens the chat screen.

#### Request

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `PATCH` | `/api/v1/chat/messages/read` | Sets the read status for all unread messages in a room. |

#### Body (`application/json`)

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `room_id` | `string` | **Yes** | The UUID of the chat room. |
| `user_id` | `string` | **Yes** | The 7-char ID of the user performing the action. |

#### Headers

| Header | Example Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <access_token>` | The user's current access token. |

#### Responses

##### Success

| Status Code | Description |
| :--- | :--- |
| `204 No Content` | Messages were successfully marked as read. The client should update the UI without waiting for a new body. |

-----

### 5\. GET `[BASE_URL]/api/v1/chat/unread-count`

Retrieves the aggregated total unread message count across **all** of a user's chat rooms. Useful for badge notifications on the main app icon or chat tab.

#### Request

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/chat/unread-count` | Fetches the total number of unread messages for the user. |

#### Query Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | `string` | **Yes** | The 7-character user ID. |

#### Headers

| Header | Example Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <access_token>` | The user's current access token. |

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

This protocol defines the structure for all real-time events and actions over the established connection (`/ws/chat`). All messages must be a JSON object with a required `type` field.

[Image of Chat WebSocket Protocol Flow Diagram]

### A. Mobile ➡️ Server Messages (Actions)

| Type | Action | Description |
| :--- | :--- | :--- |
| `join_room` | Join Room | Starts receiving real-time messages for the specific room ID. |
| `leave_room` | Leave Room | Stops receiving real-time messages for the specific room ID. |
| `message` | Send Message | Submits a new chat message to be saved and broadcast. |

#### `type: "message"` (Sending a new message)

```json
{
  "type": "message",
  "payload": {
    "room_id": "1e2d3e4f-5060-7080-90a0-b0c0d0e0f123",
    "content": "Can you ship this item next week?"
  }
}
```

### B. Server ➡️ Mobile Messages (Events)

| Type | Event | Trigger |
| :--- | :--- | :--- |
| `message` | New Message | A new message was saved to the DB and broadcast to the room participants. |
| `message_delivered` | Delivery Confirm | A message sent by the user was successfully delivered (pushed) to another client. |
| `error` | Protocol Error | An issue occurred (e.g., rate limit, invalid payload format). |

#### `type: "message"` (Receiving a new message)

This event contains all the details needed to display a new message on the screen.

```json
{
  "type": "message",
  "message_id": "m1234567-890a-bcde-f123-4567890abcde",
  "payload": {
    "id": "m1234567-890a-bcde-f123-4567890abcde",
    "chat_room_id": "1e2d3e4f-5060-7080-90a0-b0c0d0e0f123",
    "sender_id": "V998877",
    "content": "Yes, we can ship it next week.",
    "created_at": "2025-12-05T17:05:00Z",
    "sender_name": "Vendor A Store",
    "is_read": false
  }
}
```

#### `type: "message_delivered"` (Delivery Confirmation)

Use this to update the UI status (e.g., change a pending icon to a "delivered" checkmark).

```json
{
  "type": "message_delivered",
  "payload": {
    "message_id": "m1234567-890a-bcde-f123-4567890abcde"
  }
}
```

-----

## 🛑 Common Errors (REST & WS)

| Status Code | Type (WS) | Description | Resolution |
| :--- | :--- | :--- | :--- |
| `401 Unauthorized` | N/A | Missing or invalid access token (REST). | Check `Authorization` header validity. |
| `400 Bad Request` | `error` | Invalid JSON body/payload or missing required query parameter. | Review endpoint body/query specs. |
| `403 Forbidden` | N/A | User is authenticated but lacks required chat permissions. | Check user's role/permissions. |
| `500 Internal Error` | `error` | Unexpected server issue (DB failure, internal timeout). | Server-side issue; report to backend team. |
