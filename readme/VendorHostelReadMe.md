# HOSTEL APIs: *VENDOR*

## Base URL
The base URL for all API requests:

| Environment | URL |
| :--- | :--- |
| **Production** | `http://ufinda-v0-01.onrender.com` |
| **Local Dev** | `http://localhost:8080` |

-----

### POST `[BASE_URL]/hostels/create`

This endpoint allows verified vendors to create a new hostel listing. It processes hostel details and media (images, videos) asynchronously to provide a fast response. The media is handled by a background worker.

---

### Request

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/hostels/create` | Creates a new hostel listing. |

#### Headers

| Header | Example Value | Description |
| --- | --- | --- |
| `Authorization` | `Bearer <access_token>` | Requires a valid vendor access token. |
| `Content-Type` | `multipart/form-data` | Required for file uploads. |

#### Body (`multipart/form-data`)

| Field | Type | Description | Example / Required Value |
| --- | --- | --- | --- |
| `title` | `string` | Title of the listing (Min 5 chars). | `"Luxury 2 Bedroom Self-Contained"` |
| `total_price` | `number` | Total cost (must be > 0). | `"550000"` |
| `total_hostel_rooms` | `number` | Available rooms in the building. | `"12"` |
| `rent_per_year` | `number` | Annual rent per room. | `"150000"` |
| `location` | `string` | Physical address. | `"Near University Gate, Lagos"` |
| `kitchen_access` | `string` | Type of kitchen available. | **`"personal"`** or **`"public"`** |
| `toilet_access` | `string` | Type of toilet available. | **`"personal"`** or **`"public"`** |
| `landlord_resides` | `string` | If landlord lives there. | `"yes"` or `"no"` |
| `room_type` | `string` | Category of room. | `"self-contain"`, `"single room"`, `room and parlor`, `2 bedroom flat`, `3 bedroom flat`, `room in a flat` |
| `roommates_allowed` | `string` | Policy on roommates. | `"yes"` or `"no"` |
| `description` | `string` | Full details about the hostel. | `"A quiet environment with 24/7 water..."` |
| `hostel_images` | `file[]` | Array of images (Max 3). | `image1.jpg`, `image2.png` |
| `hostel_video` | `file` | A single video file. | `tour_video.mp4` |

---

### Workflow

1. **Authentication & Verification**: The handler verifies the user's session and checks if the `IsVerified` flag is true.
2. **Input Sanitization**: All text inputs are trimmed of leading/trailing whitespace. Numeric strings are converted to `int64` and validated to ensure they are positive values.
3. **Synchronous DB Write**: A new `Hostel` record is created immediately with an auto-generated unique ID. Media fields (`hostel_images`, `hostel_videos`) are initialized as `null`.
4. **Local Staging**: Uploaded files are sniffed for security (MIME type verification) and saved to a temporary local disk directory to keep RAM usage low.
5. **Task Enqueueing**: A background task containing the **file paths** is sent to the Redis queue (Asynq).
6. **Cleanup & Upload**: The background worker picks up the task, uploads the files to Cloudinary, deletes the local temporary files, and updates the database with the final URLs.

---

### Responses

#### Success

| Status Code | Description |
| --- | --- |
| `202 Accepted` | Record created; media processing started. |

**Body**

```json
{
  "message": "Hostel listed. Media is being processed in the background."
}

```

#### Errors

| Status Code | Description | Example Error Message |
| --- | --- | --- |
| `400 Bad Request` | Validation failed or missing fields. | `{"error": "Title is too short or empty."}` |
| `401 Unauthorized` | Not logged in or KYC not verified. | `{"error": "vendor not verified"}` |
| `500 Internal Error` | Server-side failure (DB/Queue). | `{"error": "Internal server error"}` |

---

### PATCH `/hostels/:id`

This endpoint allows an authenticated and verified **Vendor** to update the details of a specific hostel they own. It accepts `multipart/form-data` for partial updates (PATCH-like behavior).

-----

### Request

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `[BASE_URL]/hostel/:id` | Updates an existing hostel record identified by the `:id` URL parameter. |

#### URL Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `:id` | `string` | The unique ID of the hostel to be updated. |

#### Body

The request must be a **`multipart/form-data`** submission. All fields are **optional**; only fields provided will overwrite the existing values.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `total_price` | `string` | The total annual price for the hostel (e.g., total fees). Must be an integer. |
| `rent_per_year` | `string` | The cost of rent per year. Must be an integer. |
| `total_hostel_rooms` | `string` | The total number of rooms in the hostel. Must be an integer. |
| `landlord_resides` | `string` | `yes` or `no` indicating if the landlord resides on the property. |
| `roommates_allowed` | `string` | `yes` or `no`. |
| `description` | `string` | A detailed description of the hostel. |

#### Headers

| Header | Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <access_token>` | **Required** for user authentication. |

-----

### Workflow

1.  **Authentication & Authorization**: The user's ID is retrieved from the context.
2.  **Vendor Verification**: The system verifies that the authenticated user's `Role` is **`vendor`** and that their account is **`IsVerified: true`**. Access is denied if either condition fails.
3.  **Hostel Retrieval**: The existing hostel record is retrieved using the ID from the URL.
4.  **Ownership Check**: The authenticated user's ID is checked against the hostel's `VendorID` to ensure **only the owner** can modify the record.
5.  **Data Update**: All provided form fields are parsed (including conversion of price and room fields to integers) and used to update the corresponding fields in the existing hostel object.
6.  **Database Save**: The modified hostel object is saved to the database.

-----

### Responses

#### Success

| Status Code | Description |
| :--- | :--- |
| `200 OK` | The hostel details were successfully updated. |

**Body**

```json
{
  "message": "Hostel updated successfully."
}
```

#### Errors

| Status Code | Description |
| :--- | :--- |
| `400 Bad Request` | Invalid format provided for numerical fields (`total_price`, `rent_per_year`, `total_hostel_rooms`). |
| `401 Unauthorized` | User is not authenticated, is not a **Vendor**, or is a Vendor but is **not KYC verified**. |
| `403 Forbidden` | The authenticated user is trying to update a hostel that they do not own. |
| `404 Not Found` | The authenticated user's account or the specified hostel (`:id`) could not be found. |
| `500 Internal Server Error` | An unexpected server error occurred (e.g., database error fetching user/hostel, or failure to update the hostel record). |

----

### DELETE `/hostels/:id`

This endpoint allows an authenticated and verified **Vendor** to permanently delete a hostel listing that they own. This action also triggers the removal of all associated media (images and videos) from Cloudinary.

---

### Request

| Method | Endpoint | Description |
| --- | --- | --- |
| `DELETE` | `[BASE_URL]/hostels/:id` | Deletes a specific hostel record and its associated media assets. |

#### URL Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `:id` | `string` | The unique ID of the hostel listing to be deleted. |

#### Body

No request body is required for this endpoint.

#### Headers

| Header | Value | Description |
| --- | --- | --- |
| `Authorization` | `Bearer <access_token>` | **Required** for user authentication. |

---

### Workflow

1. **Authentication & Verification**: The system retrieves the user from the context and verifies they are a **Vendor** with a **Verified (KYC)** account.
2. **Hostel Retrieval**: The system fetches the existing hostel record from the database using the provided `:id`.
3. **Ownership Check**: The system confirms that the `VendorID` of the hostel matches the ID of the authenticated user. If a mismatch is detected, a security log is generated and access is denied.
4. **Asset Identification**: The system retrieves the `PublicID` and `URL` for all images and videos associated with the hostel from the database.
5. **Cloudinary Cleanup**: The system loops through the identified assets and deletes them from Cloudinary storage to free up space and maintain data integrity.
6. **Database Deletion**: Once the media cleanup is initiated, the hostel record is permanently removed from the database.

---

### Responses

#### Success

| Status Code | Description |
| --- | --- |
| `200 OK` | The hostel listing and its associated media were successfully deleted. |

**Body**

```json
{
  "message": "listing deleted successfully"
}

```

#### Errors

| Status Code | Description |
| --- | --- |
| `401 Unauthorized` | User is not authenticated, or the vendor is not KYC verified. |
| `403 Forbidden` | The authenticated user does not own the hostel listing (Security Log triggered). |
| `404 Not Found` | The specified hostel ID does not exist in the database. |
| `500 Internal Server Error` | An unexpected error occurred while fetching media IDs or performing the database deletion. |

---

### GET `/hostels/agents`

This endpoint allows an authenticated **Vendor** (Agent) to retrieve a list of all hostel listings they have created. It returns the full details of each hostel associated with the vendor's unique ID.

---

### Request

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `[BASE_URL]/hostels/agents` | Fetches all hostel listings belonging to the authenticated vendor. |

#### URL Parameters

No URL parameters are required. The system identifies the vendor automatically using the authentication token.

#### Body

No request body is required for this endpoint.

#### Headers

| Header | Value | Description |
| --- | --- | --- |
| `Authorization` | `Bearer <access_token>` | **Required** to identify the vendor and their associated listings. |

---

### Workflow

1. **Authentication**: The system retrieves the user object from the request context (populated by the middleware).
2. **Context Validation**: The system ensures the authenticated user is of the correct type (`*db.User`).
3. **Database Query**: Using the `VendorID` extracted from the authenticated user's profile, the system queries the `hostels` table for all matching records.
4. **Error Handling**:
* If no records are found, the system returns a `404 Not Found` specifically noting that no hostels are listed for this vendor.
* If a database error occurs, the error is logged, and a `500 Internal Server Error` is returned.


5. **Data Return**: On success, the complete list of hostel objects (including pricing, location, and media URLs) is returned as a JSON array.

---

### Responses

#### Success

| Status Code | Description |
| --- | --- |
| `200 OK` | A list of hostels was successfully retrieved. |

**Body (Array of Objects)**

```json
[
  {
    "id": "hostel-123",
    "vendor_id": "vnd-456",
    "title": "Modern Executive Self-Contain",
    "total_price": 450000,
    "location": "Unilag Road, Yaba",
    "hostel_images": [...],
    "hostel_videos": [...]
    // ... other hostel fields
  }
]

```

#### Errors

| Status Code | Description |
| --- | --- |
| `401 Unauthorized` | The access token is missing, invalid, or expired. |
| `404 Not Found` | No hostel listings were found associated with this specific vendor account. |
| `500 Internal Server Error` | An unexpected error occurred while querying the database. |

---
