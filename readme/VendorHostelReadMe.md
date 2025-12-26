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
| `room_type` | `string` | Category of room. | `"Self-Contain"`, `"Flat"` |
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

### PATCH `/hostel/:id`

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
| `landlord_resides` | `string` | Boolean-like string indicating if the landlord resides on the property. |
| `roommates_allowed` | `string` | Boolean-like string indicating if roommates are permitted. |
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