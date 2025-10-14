## KYC API
### POST `/kyc/user`

This endpoint is used by an authenticated user to submit or update their Know Your Customer (KYC) details. It supports submitting a **multipart form** which includes both text fields and an optional profile image file.

-----

### Request

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/kyc` | Creates a new KYC record or updates an existing one for the authenticated user. |

#### Body

The request must be a **`multipart/form-data`** submission. Text fields are optional, but any provided field will be saved.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `level` | `string` | User's academic level (e.g., "100", "200"). |
| `dept` | `string` | User's department. |
| `faculty` | `string` | User's faculty. |
| `matric` | `string` | User's matriculation number. |
| `about_me` | `string` | A short biography or description about the user. |
| `profile_pic` | `file` | The user's profile image file. If provided, the image is uploaded to Cloudinary. |

#### Headers

| Header | Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <access_token>` | **Required** for user authentication. |
| `Content-Type` | `multipart/form-data` | **Required** for file and form field submission. |

-----

### Workflow

1.  **Authentication & Authorization**: The user's ID is retrieved from the context. Only users with the `Role: "user"` are authorized to access this endpoint.
2.  **Data Extraction & File Upload**: The endpoint extracts text fields and the optional `profile_pic` file from the multipart form.
      * If a file is provided, it's uploaded to Cloudinary. Errors during file upload are logged, but the rest of the KYC submission proceeds.
3.  **Existence Check**: The system checks the database for an existing KYC record linked to the authenticated `UserID`.
4.  **Creation or Update**:
      * **If KYC Found**: Performs an **Update (PATCH)**, saving all non-empty fields and the new profile image data (if uploaded).
      * **If KYC Not Found**: Performs a **Creation (POST)**, generating a unique KYC ID, setting `IsStudent = true` if all student-related fields are present, and creating the new record.
5.  **User Verification Update**: Upon successful KYC creation or update, the user's primary account record (`is_verified`) is updated to **`true`**.

-----

### Responses

#### Success

| Status Code | Description |
| :--- | :--- |
| `200 OK` | The KYC data was successfully created or updated. |

**Body**

```json
{
  "message": "KYC created successfully" 
  // or "KYC updated successfully"
}
```

#### Errors

| Status Code | Description |
| :--- | :--- |
| `400 Bad Request` | Invalid User ID format retrieved from the context (internal middleware error). |
| `403 Forbidden` | The authenticated user does not have the required role (`Role != "user"`). |
| `404 Not Found` | The authenticated user's account could not be found in the database. |
| `500 Internal Server Error` | An unexpected server error occurred (e.g., database error fetching user or KYC, failure to generate unique ID, or failure to save/update KYC data). |

-----