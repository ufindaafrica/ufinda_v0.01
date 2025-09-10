# HOSTEL APIs: *VENDOR*

### POST `/hostel/create`

This endpoint allows verified vendors to create a new hostel listing. It processes hostel details and media (images, videos) asynchronously to provide a fast response. The media is handled by a background worker.

-----

### Request

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/hostel/create` | Creates a new hostel listing. |

#### Body

The request body must be sent as `multipart/form-data`.

| Field | Type | Description |
| :--- | :--- | :--- |
| `total_price` | `string` | The total cost of the hostel. |
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
| `hostel_videos` | `file[]` | An array of video files for the hostel. Max size 50MB. |

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

### PATCH `/hostels/:id`

This endpoint allows a verified vendor to update an existing hostel listing. It ensures that only the owner of a hostel can modify its details.

-----

### Request

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `PUT` | `/hostels/:id` | Updates a hostel listing by its ID. |

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | The unique ID of the hostel to update. This should be a UUID. |

#### Body

The request body must be sent as `multipart/form-data`. You only need to send the fields you want to update.

| Field | Type | Description |
| :--- | :--- | :--- |
| `total_price` | `string` | The new total cost of the hostel. |
| `total_hostel_rooms` | `string` | The new number of rooms available. |
| `rent_per_year` | `string` | The new annual rent. |
| `location` | `string` | The new physical location. |
| `landlord_resides` | `string` | New value for whether the landlord lives on the property. |
| `room_type` | `string` | The new type of room. |
| `roommates_allowed` | `string` | New value for whether roommates are permitted. |
| `kitchen_access` | `string` | New value for whether kitchen access is provided. |
| `toilet_access` | `string` | New value for whether toilet access is provided. |
| `description` | `string` | The new detailed description. |

#### Headers

This endpoint requires an `Authorization` header with a valid vendor access token.

| Header | Example Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <access_token>` | The vendor's current access token. |

-----

### Workflow

1.  **Authorization and Ownership Check**: The endpoint first validates the user's access token to ensure they are a **verified vendor**. It then checks if the **authenticated user's ID matches the `VendorID`** of the hostel record being updated. This prevents a vendor from updating another's hostel.
2.  **Hostel Retrieval**: The endpoint retrieves the existing hostel record from the database using the ID provided in the URL.
3.  **Partial Update**: It iterates through the received form data. Only fields that are present in the request body are used to update the corresponding fields in the hostel record. Missing fields are ignored, allowing for partial updates.
4.  **Database Update**: The updated hostel record is saved back to the database.

-----

### Responses

#### Success

| Status Code | Description |
| :--- | :--- |
| `200 OK` | The hostel listing was successfully updated. |

**Body**

```json
{
  "message": "Hostel updated successfully."
}
```

#### Errors

| Status Code | Description |
| :--- | :--- |
| `400 Bad Request` | The hostel ID in the URL is not a valid UUID, or a provided form field has an invalid format (e.g., `total_price` is not a number). |
| `401 Unauthorized` | The access token is invalid, missing, or the user is not a verified vendor. |
| `403 Forbidden` | The authenticated user is a verified vendor but does not own the hostel they are trying to update. |
| `404 Not Found` | The specified hostel ID does not exist in the database. |
| `500 Internal Server Error` | An unexpected server error occurred (e.g., a database connection issue or an invalid user ID type in the context). |

-----

### DELETE `/hostels/:id`

This endpoint allows a verified vendor to delete one of their hostel listings. The process securely deletes the hostel record and all associated media (images and videos) from the server and cloud storage.

-----

### Request

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `DELETE` | `/hostels/:id` | Deletes a hostel listing and its associated media. |

#### Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | The unique ID of the hostel to be deleted. This should be a UUID. |

#### Headers

This endpoint requires an `Authorization` header with a valid vendor access token.

| Header | Example Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <access_token>` | The vendor's current access token. |

-----

### Workflow

1.  **Authorization and Ownership Check**: The endpoint first verifies the user's access token to ensure they are a **verified vendor**. It then retrieves the specified hostel record and performs a crucial check: it verifies that the **authenticated user's ID matches the `VendorID`** of the hostel record. This prevents unauthorized deletion of listings.
2.  **Media Deletion**: Before deleting the hostel record, the endpoint retrieves the public IDs of all associated images and videos. It then uses these public IDs to delete the media files from the cloud storage provider (Cloudinary). Errors during media deletion are logged but do not prevent the database record from being deleted.
3.  **Hostel Record Deletion**: Finally, the endpoint proceeds to delete the hostel record from the database.

-----

### Responses

#### Success

| Status Code | Description |
| :--- | :--- |
| `200 OK` | The hostel listing and its associated media were successfully deleted. |

**Body**

```json
{
  "message": "listing deleted successfully"
}
```

#### Errors

| Status Code | Description |
| :--- | :--- |
| `400 Bad Request` | The hostel ID in the URL is not a valid UUID format. |
| `401 Unauthorized` | The access token is invalid, missing, or the user is not a verified vendor. |
| `403 Forbidden` | The authenticated user is a verified vendor but does not own the hostel they are trying to delete. |
| `404 Not Found` | The specified hostel ID does not exist in the database or the user is not found. |
| `500 Internal Server Error` | An unexpected server error occurred (e.g., a database connection issue, an invalid user ID in the context, or a failure to delete the database record). |