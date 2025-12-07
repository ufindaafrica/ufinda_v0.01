# HOSTEL APIs: *USER*

## Base URL
The base URL for all API requests:

| Environment | URL |
| :--- | :--- |
| **Production** | `https://ufinda-v0-01.onrender.com` |
| **Local Dev** | `http://localhost:8080` |

-----

### GET `[BASE_URL]/hostels/all`

This endpoint allows authenticated users to retrieve a list of all hostel listings that are currently marked as available. The query is handled by the internal database API.

-----

### Request

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `[BASE_URL]/hostels/available` | Retrieves a list of available hostels. |

#### Body

None required.

#### Headers

This endpoint requires an `Authorization` header with a valid user access token.

| Header | Example Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <access_token>` | The user's current access token. |

-----

### Workflow

1.  **Authorization**: The endpoint verifies the presence and validity of the user's access token provided in the `Authorization` header. It confirms the request is being made by an authenticated user.
2.  **Internal API Call**: A request is made to the internal database API with a specific filter: `is_available=eq.true`.
3.  **Data Retrieval**: The internal API returns a JSON array containing all matching hostel records.
4.  **Response Handling**: The JSON data is decoded into a Go slice of `Hostel` structs.
5.  **Success Response**: A `200 OK` response is returned to the client with the list of available hostels.

-----

### Responses

#### Success

| Status Code | Description |
| :--- | :--- |
| `200 OK` | The list of available hostel listings was successfully retrieved. |

**Body**

```json
[
  {
    "id": "e2a3c7f0-1b2c-4d3e-8f90-a1b2c3d4e5f6",
    "name": "The Green Anchor",
    "location": "Downtown Area, Sector 4",
    "price": 45.00,
    "is_available": true
  },
  // ... more hostel objects
]
```

#### Errors

| Status Code | Description |
| :--- | :--- |
| `401 Unauthorized` | The access token is **missing or invalid**. Authentication failed. |
| `403 Forbidden` | The user is authenticated but **does not have permission** to view this resource (e.g., if a specific role were required). |
| `500 Internal Server Error` | An unexpected server error occurred (e.g., failure to connect to the database API, a network timeout, or an error processing the retrieved JSON data). |

------

### GET `[BASE_URL]/hostels/search`

This powerful endpoint allows authenticated users to search, filter, sort, and paginate through available hostel listings based on various criteria, including text query, price range, and room type.

-----

### Request

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `[BASE_URL]/hostels/search` | Searches and filters available hostel listings. |

#### Query Parameters

All parameters are optional.

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `q` | `string` | Empty | Full-Text Search (FTS) term. Searches across indexed fields (e.g., description, location, name). |
| `price_min` | `integer` | Empty | Filters hostels where `rent_per_year` is greater than or equal to this value. |
| `price_max` | `integer` | Empty | Filters hostels where `rent_per_year` is less than or equal to this value. |
| `type` | `string` | Empty | Filters by `room_type` (case-insensitive partial match). |
| `sort_by` | `string` | `created_at` | Field to sort the results by (e.g., `price`, `name`). |
| `order` | `string` | `desc` | Sort order: `asc` (ascending) or `desc` (descending). |
| `page` | `integer` | `1` | The page number to retrieve for pagination. |

#### Headers

This endpoint requires an `Authorization` header with a valid user access token.

| Header | Example Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <access_token>` | The user's current access token. |

-----

### Workflow

1.  **Authorization**: The endpoint verifies the validity of the user's access token.
2.  **Parameter Parsing**: It extracts and sanitizes all query parameters (`q`, `price_min`, `sort_by`, `page`, etc.).
3.  **URL Construction**: A dynamic PostgREST URL is built based on the provided parameters, including mandatory filtering for `is_available=eq.true` and setting pagination limits (`limit=20`, `offset=...`).
4.  **Internal API Call**: The constructed URL is used to query the internal database API.
5.  **Response Handling**: The resulting JSON array is decoded into a Go slice of `Hostel` structs.
6.  **Success Response**: A `200 OK` response is returned with the filtered and paginated list of hostels.

-----

### Responses

#### Success

| Status Code | Description |
| :--- | :--- |
| `200 OK` | The filtered list of available hostel listings was successfully retrieved. |

**Body**

```json
[
  {
    "id": "e2a3c7f0-1b2c-4d3e-8f90-a1b2c3d4e5f6",
    "name": "The Green Anchor",
    "location": "Downtown Area, Sector 4",
    "rent_per_year": 5400,
    "room_type": "Shared",
    "is_available": true
  },
  // ... up to 20 hostel objects (DefaultPageSize)
]
```

#### Errors

| Status Code | Description |
| :--- | :--- |
| `401 Unauthorized` | The access token is **missing or invalid**. Authentication failed. |
| `403 Forbidden` | The user is authenticated but **does not have permission** to view this resource (e.g., if a specific role were required). |
| `500 Internal Server Error` | An unexpected server error occurred (e.g., failure to connect to the database API, a network timeout, or an error processing the retrieved JSON data). |

-------

### GET `[BASE_URL]/hostels/:id`

This endpoint allows any authenticated user to retrieve the full details of a single hostel using its unique identifier.

-----

### Request

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `[BASE_URL]/hostels/:id` | Retrieves a single hostel listing by its ID. |

#### Path Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | The unique identifier (ID) of the hostel to retrieve. |

#### Body

None required.

#### Headers

This endpoint requires an `Authorization` header with a valid user access token.

| Header | Example Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <access_token>` | The user's current access token. |

-----

### Workflow

1.  **Authorization**: The endpoint verifies the validity of the user's access token.
2.  **ID Retrieval**: The hostel ID is extracted from the URL path parameter.
3.  **Database Query**: The internal `hosteldb.FindHostelByID` function is called to retrieve the single hostel record.
4.  **Error Handling**: The function checks for the specific **Hostel Not Found** error.
5.  **Success Response**: A `200 OK` response is returned with the hostel's data object.

-----

### Responses

#### Success

| Status Code | Description |
| :--- | :--- |
| `200 OK` | The hostel details were successfully retrieved. |

**Body**

```json
{
  "id": "e2a3c7f0-1b2c-4d3e-8f90-a1b2c3d4e5f6",
  "name": "The Green Anchor",
  "location": "Downtown Area, Sector 4",
  "price": 45.00,
  "room_type": "Single",
  "is_available": true
  // ... all other hostel data fields
}
```

#### Errors

| Status Code | Description |
| :--- | :--- |
| `401 Unauthorized` | The access token is **missing or invalid**. Authentication failed. |
| `403 Forbidden` | The user is authenticated but **does not have permission** to view this resource. |
| `404 Not Found` | The provided `id` does not match any existing hostel record (based on `hosteldb.ErrorHostelNotFound`). |
| `500 Internal Server Error` | An unexpected server error occurred during data fetching (e.g., database connection issue). |

------
