# HOSTEL APIs: *VENDOR*

## Base URL
The base URL for all API requests:

| Environment | URL |
| :--- | :--- |
| **Production** | `http://ufinda-v0-01.onrender.com` |
| **Local Dev** | `http://localhost:8080` |

-----

### POST `[BASE_URL]/hostel/create`

This endpoint allows verified vendors to create a new hostel listing. It processes hostel details and media (images, videos) asynchronously to provide a fast response. The media is handled by a background worker.

-----

### Request

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `[BASE_URL]/hostels/create` | Creates a new hostel listing. |

#### Body

The request body must be sent as `multipart/form-data`.

| Field | Type | Description |
| :--- | :--- | :--- |
| `total_price` | `string` | The total cost of the hostel. |
| `title` | `string` | The title of the hostel which length must be greater than 5. |
| `total_hostel_rooms` | `string` | The number of rooms available in the hostel. |
| `rent_per_year` | `string` | The annual rent for a room. |
| `location` | `string` | The physical location of the hostel. |
| `landlord_resides` | `string` | Indicates if the landlord lives on the property. |
| `room_type` | `string` | The type of room (e.g., single, shared). |
| `roommates_allowed` | `string` | Indicates if roommates are permitted. |
| `kitchen_access` | `string` | Indicates if kitchen access is provided. |
| `toilet_access` | `string` | Indicates if toilet access is provided. |
| `description` | `string` | A detailed description of the hostel. |
| `hostel_images` | `file[]` | An array of image files for the hostel. Max size 50MB. |
| `hostel_video` | `file[]` | An array of video files for the hostel. Max size 50MB. |

#### Headers

This endpoint requires an `Authorization` header with a valid vendor access token.

| Header | Example Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <access_token>` | The vendor's current access token. |

-----

### Workflow

1.  **Authorization**: The endpoint verifies the user's authentication and role. It checks if the user is a `vendor` and if their KYC (Know Your Customer) is verified.
2.  **Form Data Parsing**: It parses the `multipart/form-data` request, converting text fields like `total_price` and `total_hostel_rooms` to their correct data types.
3.  **Hostel Record Creation**: A new hostel record is created in the database using the provided details. The media file fields are initially left empty.
4.  **Asynchronous Media Processing**: The image and video files are extracted from the request. A background task is created and enqueued to handle the media uploads and updates the hostel record with the new media URLs.
5.  **Quick Response**: A `202 Accepted` response is returned to the client immediately. This signals that the request was successful and media processing is underway.

-----

### Responses

#### Success

| Status Code | Description |
| :--- | :--- |
| `202 Accepted` | The hostel listing was successfully created, and media is being processed asynchronously. |

**Body**

```json
{
  "message": "Hostel listing created. Media is being processed in the background."
}
```

#### Errors

| Status Code | Description |
| :--- | :--- |
| `400 Bad Request` | The request is invalid due to a missing or invalid field, or the file size limit (50MB) is exceeded. |
| `401 Unauthorized` | The access token is invalid, missing, or the user is not a verified vendor. |
| `404 Not Found` | The authenticated user's ID is not found in the database. |
| `500 Internal Server Error` | An unexpected server error occurred (e.g., a database connection issue or a problem retrieving user data). |

--------

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