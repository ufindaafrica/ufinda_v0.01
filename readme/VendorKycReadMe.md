## KYC API: *VENDOR*

## Base URL
The base URL for all API requests:

| Environment | URL |
| :--- | :--- |
| **Test** | `https://ufinda-v0-01.onrender.com` |
| **Production** | `https://ufinda-v0-01-2prv.onrender.com` |
| **Local Dev** | `http://localhost:8080` |

-----

### GET `[BASE_URL]/kyc/vendor/signature`

This endpoint provides the necessary security credentials for the client (frontend) to upload media directly to **Cloudinary**. This prevents your backend from handling large file bytes, ensuring high performance and stability on limited-RAM hosting like Render.

---

#### Request

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `[BASE_URL]/kyc/vendor/signature` | Generates a signed upload ticket for Cloudinary. |

#### Headers

| Header | Example Value | Description |
| --- | --- | --- |
| `Authorization` | `Bearer <access_token>` | **Required**. Only authenticated vendors can request signatures. |

---

#### Workflow

1. **Timestamp Generation**: The server generates a Unix timestamp to ensure the signature is time-sensitive and cannot be reused indefinitely.
2. **Parameter Mapping**: The system prepares the required upload parameters (e.g., `folder: "kyc"`).
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
  "folder": "kyc",
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

-----

## Vendor KYC & Onboarding APIs

This documentation covers the two methods for vendor identity and profile verification: (1) initiating the full KYC process via a Dojah Widget, and (2) updating the basic profile information (Mini-KYC).

-----

### 1\. Full KYC: Get Widget URL

This authenticated endpoint is used to generate a secure, personalized URL for the vendor to launch the full Know Your Customer (KYC) identity verification widget.

#### GET `[BASE_URL]/kyc/vendor`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `[BASE_URL]/kyc/vendor` | Generates a unique, pre-signed URL to launch the Dojah identity verification widget. |

#### Headers

| Key | Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <JWT_Token>` | Required for user authentication and identifying the vendor. |

#### Request Body

None.

#### Workflow

1.  **Authentication**: The request is validated, and the `user` object (containing `ID` and `Role`) is extracted from the JWT token in the context.
2.  **Configuration Check**: The system validates that necessary environment variables (`DOJAH_WIDGET_URL`, `DOJAH_WIDGET_ID`) are set.
3.  **URL Generation**: A final widget URL is constructed by appending the `widget_id` and passing the authenticated vendor's `user_id` and `role` as metadata. This metadata is critical for the subsequent webhook processing.

#### Responses

| Status Code | Description |
| :--- | :--- |
| `200 OK` | Successfully generated and returned the final widget URL. |
| `500 Internal Server Error` | Authentication error, missing environment variables, or invalid URL configuration. |

**Success Body**

```json
{
  "message": "https://widget.dojah.io/v1/kyc?widget_id=abc...&metadata[user_id]=vnd-12345..."
}
```

-----

### 2\. Mini-KYC: Update Vendor Profile

### POST `[BASE_URL]/kyc/vendor`

This endpoint allows vendors/agents to submit or update their onboarding details. Like the student KYC, this endpoint has been migrated from multipart forms to a **JSON-based workflow**. The vendor is responsible for uploading their profile image to Cloudinary on the client side and providing the metadata in the request.

---

#### Request

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `[BASE_URL]/kyc/vendor` | Creates or updates an onboarding record for the authenticated vendor. |

#### Headers

| Header | Value | Description |
| --- | --- | --- |
| `Authorization` | `Bearer <access_token>` | **Required**. |
| `Content-Type` | `application/json` | **Required**. |

#### Expected Payload (Body)

The request body uses pointers to allow for partial updates. If a field is omitted from the JSON, the existing database value remains unchanged.

| Field | Type | Description |
| --- | --- | --- |
| `residence_address` | `string` | The physical address of the vendor/agent. |
| `about_me` | `string` | A professional bio or description of the agency. |
| `profile_img` | `object` | Cloudinary metadata object (URL and Public ID). |

**Example JSON Payload:**

```json
{
  "address": "12, Admiralty Way, Lekki Phase 1, Lagos",
  "about_me": "Specializing in luxury student apartments and off-campus housing.",
  "profile_img": {
    "url": "https://res.cloudinary.com/demo/image/upload/v5678/vendor_profile.jpg",
    "public_id": "ufinda/vendors/vnd_987_pic"
  }
}

```

---

#### Workflow Logic

The backend follows a **"Check then Act"** pattern to handle the transition between initial onboarding and profile maintenance.

1. **Identity Verification**: Extracts the `UserID` from the secure JWT context.
2. **Payload Parsing**: Uses `ShouldBindJSON` to map the request to a struct. Pointers ensure that only provided fields are processed.
3. **State Detection**:
* Queries the `vendor_kyc` table for an existing entry.
* **If Found**: Triggers an **Update (PATCH)** operation.
* **If Not Found**: Triggers a **Creation (POST)** operation.


4. **Data Persistence**: Communicates with PostgREST to save the data. Any failures at this stage are logged to the `kyc_log` table for auditing.

---

#### Responses

#### Success `200 OK`

**Body:**

```json
{
  "message": "kyc created successfully" 
  // or "kyc updated successfully"
}

```

#### Errors

| Status Code | Description |
| --- | --- |
| `400 Bad Request` | **Binding Error**: The JSON structure is invalid or data types do not match. |
| `401 Unauthorized` | **Auth Error**: No valid bearer token provided. |
| `500 Internal Server Error` | **System Error**: Occurs if the database is unreachable or the `kyc_log` entry fails. |

-----

## 🌐 Real-Time Status via WebSocket

After the vendor launches the Dojah widget (using the URL from the first endpoint), the final result of the KYC process is communicated back to the client in real-time using a WebSocket connection.

### WebSocket Endpoint

| Protocol | Endpoint | Description |
| :--- | :--- | :--- |
| `ws` in `devt` and `wss` in `prod` | `wss://[BASE_URL]/ws?user_id=<VENDOR_ID>` | Connects the client to a real-time channel associated with the specific vendor. |

### Connection Process

1.  **Client Connects**: The vendor's client application establishes a WebSocket connection, using the vendor's unique identifier (`<VENDOR_ID>`) as a query parameter.
2.  **Server Registers**: Your Go backend's `hub` registers the client ID and holds the connection open.
3.  **Client Waits**: The client enters a waiting state (e.g., displaying a "Verifying..." loader).
4.  **Status Push**: Once the Dojah webhook is received and processed by your backend, the `HandleVerificationPayload` function pushes the final status object to this WebSocket connection.

### Potential Response Messages

The client will receive a single JSON object (the `KYCStatusUpdate` payload) once the verification process is complete.

| Field | Type | Description |
| :--- | :--- | :--- |
| `user_id` | `string` | The ID of the vendor whose status is being updated. |
| `final_status` | `string` | The final status determined by the business logic. |
| `message` | `string` | A user-friendly message to display to the vendor. |

#### Example Payloads

| `final_status` | `message` | Notes |
| :--- | :--- | :--- |
| **`SUCCESS`** | `"User KYC successfully verified."` | Verification passed all external and internal checks. |
| **`PENDING_MANUAL_REVIEW`** | `"Verification requires manual review. Please contact support to complete your KYC."` | KYC completed, but internal checks (e.g., name mismatch) require a human review. |
| **`FAILED`** | `"Verification incomplete or failed internal checks."` | Verification failed the external provider's rules or failed your custom checks entirely. |
| **`SYSTEM_ERROR`** | `"KYC result determined but failed to save to database. Contact support."` | Critical infrastructure failure (e.g., database write failure). The user should be instructed to contact support. |

-----

### GET `[BASE_URL]/kyc/vendor/profile`

This endpoint retrieves the complete professional profile for the authenticated vendor or agent. It aggregates account details from the `users` table with business-specific onboarding data from the `vendor_kyc` table.

---

#### Request

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `[BASE_URL]/kyc/vendor/profile` | Fetches the authenticated vendor's business profile and KYC data. |

#### Headers

| Header | Value | Description |
| --- | --- | --- |
| `Authorization` | `Bearer <access_token>` | **Required** to identify the vendor. |

---

#### Workflow

1. **Identity Extraction**: The handler retrieves the vendor's details from the trusted context provided by the `VendorAuthMiddleware`.
2. **Resource Embedding**: The system executes a specialized query that joins the `users` and `vendor_kyc` tables using the `fk_vendor_kyc` constraint.
3. **Data Aliasing**: To maintain a consistent API structure across the **ufinda** ecosystem, the vendor-specific data is aliased to the `kyc_data` key.
4. **Logging**: Any retrieval failures are logged with full context to the `kyc_log` table to help the support team diagnose vendor onboarding issues.

---

#### Success Response `200 OK`

Returns a unified object representing the vendor's public and private profile data.

**Body:**

```json
{
  "first_name": "Samuel",
  "last_name": "Hostels",
  "email": "sam@hostelagent.ng",
  "phone": "+2347098765432",
  "kyc_data": {
    "profile_img": {
      "url": "https://res.cloudinary.com/.../vendor_01.jpg",
      "public_id": "kyc/vendor_sam_pic"
    },
    "residence_address": "45 Ikorodu Road, Lagos",
    "about_me": "Leading agent for off-campus housing near Unilag and Yabatech."
  }
}

```

> **Note:** If the vendor has registered an account but hasn't submitted their business details, `kyc_data` will be `null`.

---

#### Errors

| Status Code | Description |
| --- | --- |
| `401 Unauthorized` | **Missing Token**: The request lacks a valid Bearer token. |
| `403 Forbidden` | **Role Mismatch**: The authenticated user does not have `vendor` or `agent` privileges. |
| `404 Not Found` | **Not Found**: No vendor profile matches the provided authentication token. |
| `500 Internal Server Error` | **Database Failure**: Internal error during record lookup. |

---

## PATCH: Update Vendor Profile

**URL:** `[BASE_URL]/kyc/vendor`

**Method:** `PATCH`

**Auth:** Required (JWT Bearer Token)

This endpoint allows vendors to partially update their profile information. It handles updates across two separate backend layers: the core identity (Username) and the KYC details (Address).

---

### Request Body

The request accepts a JSON object. All fields are **optional**. Only the fields provided will be updated in the database.

| Field | Type | Description |
| --- | --- | --- |
| `username` | `string` | The vendor's unique display name (Max 30 characters). |
| `residence_address` | `string` | The vendor's physical or business address. |

**Example Payload:**

```json
{
  "username": "GreenGarden_01",
  "address": "123 Tech Avenue, Lagos"
}

```

---

### Architecture & Caching Impact

When this endpoint is successfully called, the backend updates the `updated_at` timestamp for the vendor. This change triggers the synchronization flow for all connected clients (Buyers):

1. **WebSocket Sync:** The next message sent by this vendor will include a `new_changes` payload. The mobile client will use this to update the local chat header and cache.
2. **REST Sync:** The next time a buyer calls `GET /chat/rooms` with a `last_sync` timestamp, this vendor’s updated info will be returned in the `new_changes` block.

---

### Responses

#### 200 OK

The profile was updated successfully.

```json
{
  "message": "profile updated successfully"
}

```

#### 400 Bad Request

Occurs if the JSON is malformed or the username violates constraints (e.g., not unique or too long).

```json
{
  "error": "invalid request"
}

```

#### 401 Unauthorized

Occurs if the `Authorization` header is missing or the token is expired.

```json
{
  "error": "user not authenticated"
}

```

#### 500 Internal Server Error

Occurs if there is a database failure during the update process.

```json
{
  "error": "Internal server error"
}

```

---
