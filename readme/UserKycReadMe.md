## KYC API: *USER*

## Base URL
The base URL for all API requests:

| Environment | URL |
| :--- | :--- |
| **Production** | `http://ufinda-v0-01.onrender.com` |
| **Local Dev** | `http://localhost:8080` |
-----

### GET `/kyc/user/signature`

This endpoint provides the necessary security credentials for the client (frontend) to upload media directly to **Cloudinary**. This prevents your backend from handling large file bytes, ensuring high performance and stability on limited-RAM hosting like Render.

---

#### Request

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `[BASE_URL]/kyc/user/signature` | Generates a signed upload ticket for Cloudinary. |

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

---

### POST `/kyc/user`

This endpoint allows authenticated users to submit or update their Know Your Customer (KYC) details. It has been updated to accept a **JSON payload** instead of a multipart form. The profile image must now be uploaded by the client to Cloudinary beforehand, with the metadata sent in the request.

---

#### Request

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/kyc/user` | Creates or updates a KYC record for the authenticated user. |

#### Headers

| Header | Value | Description |
| --- | --- | --- |
| `Authorization` | `Bearer <access_token>` | **Required**. |
| `Content-Type` | `application/json` | **Required**. |

#### Expected Payload (Body)

The request body must be a JSON object. All fields are optional to allow for partial updates, but should be included for the initial creation.

| Field | Type | Description |
| --- | --- | --- |
| `level` | `string` | User's academic level (e.g., "100", "400"). |
| `dept` | `string` | User's department. |
| `faculty` | `string` | User's faculty. |
| `matric` | `string` | User's matriculation number. |
| `about_me` | `string` | A short biography or description. |
| `profile_img` | `object` | An object containing Cloudinary metadata (see below). |

**`profile_img` Object Structure:**
| Field | Type | Description |
| :--- | :--- | :--- |
| `url` | `string` | The direct secure URL of the uploaded image. |
| `public_id` | `string` | The Cloudinary Public ID for the image asset. |

**Example JSON Payload:**

```json
{
  "level": "400",
  "dept": "Computer Science",
  "faculty": "Science",
  "matric": "19/52HA044",
  "about_me": "Tech enthusiast and final year student.",
  "profile_img": {
    "url": "https://res.cloudinary.com/demo/image/upload/v1234/profile.jpg",
    "public_id": "ufinda/users/v123_profile"
  }
}

```

---

#### Workflow

1. **Authentication**: The user's ID and role are retrieved from the JWT token via middleware.
2. **JSON Binding**: The handler binds the JSON body to a Go struct using pointers. This allows the system to distinguish between a field being "null/missing" (no action) and a field being sent (update action).
3. **Existence Check**: Checks if a KYC record already exists for the `UserID`.
4. **Logic Branching**:
* **If Record Exists**: Performs a **PATCH** (Update). Only the fields provided in the JSON payload are modified.
* **If No Record Exists**: Performs a **POST** (Create). The system sets `IsStudent = true` if `level` and `matric` are provided.


5. **Verification Status**: Upon success, the user's primary account attribute `is_verified` is automatically set to `true`.

---

#### Responses

#### Success `200 OK`

Returned when the data is successfully saved to the database.

**Body:**

```json
{
  "message": "KYC created successfully" 
  // or "KYC updated successfully"
}

```

#### Errors

| Status Code | Description |
| --- | --- |
| `400 Bad Request` | **Invalid JSON**: The payload is malformed or types are incorrect. |
| `401 Unauthorized` | **Missing/Invalid Token**: User is not logged in. |
| `500 Internal Server Error` | **Database Error**: Failure to find, create, or update the KYC record in the database. |

---
