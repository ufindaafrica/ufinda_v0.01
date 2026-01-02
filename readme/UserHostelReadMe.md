# HOSTEL APIs: *USER*

## Base URL

The base URL for all API requests:

| Environment | URL |
| --- | --- |
| **Production** | `https://ufinda-v0-01.onrender.com` |
| **Local Dev** | `http://localhost:8080` |

---

### Shared Data Structure: `EnrichedHostel`

Most retrieval endpoints return an "Enriched" hostel object which includes nested **`vendor_info`**.

**Expected Payload Example:**

```json
{
  "id": "hst-77291",
  "total_price": 500000,
  "rent_per_year": 450000,
  "location": "Lagos Island",
  "room_type": "Self Contain",
  "vendor_info": {
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+2348012345678",
    "vendor_metrics": {
      "current_rating": 4.8,
      "total_ratings": 25
    },
    "vendor_kyc": {
      "profile_img": {
          "url": "",
          "public_id": ""
      }
    }
  }
}

```

---

### GET `/hostels/all`

Retrieves all available hostels. Results are paginated and sorted by the most recently created.

#### Query Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `limit` | `string` | `10` | Number of items per page. |
| `page` | `string` | `1` | Current page number. |

#### Responses

* **200 OK**: Returns an array of `EnrichedHostel` objects.
* **500 Internal Server Error**: Database connectivity or decoding failure.

---

### GET `/hostels/search`

Performs a filtered search across the hostel database.

#### Query Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `q` | `string` | Full-text search term (location, description, etc). |
| `price_min` | `string` | Minimum total psckage. |
| `price_max` | `string` | Maximum total package. |
| `type` | `string` | Room type (e.g., "single room"). |
| `limit` | `string` | Results per page. |
| `page` | `string` | Current page. |

---

### GET `/hostels/:id`

Retrieves the full details of a specific hostel by its unique identifier.

#### URL Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `:id` | `string` | The unique Hostel ID. |

#### Responses

* **200 OK**: Returns a single `EnrichedHostel` object.
* **404 Not Found**: Hostel ID does not exist.

---

### GET `/hostels/:id/similar`

Retrieves hostels similar to the one specified (usually based on room type and price range).

#### URL Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `:id` | `string` | The ID of the hostel to compare against. |

#### Query Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `limit` | `int` | `10` | Number of similar hostels to return. |
| `page` | `int` | `1` | Pagination page. |

---

### POST `/hostels/fav/:id`

Adds a specific hostel to the authenticated user's favorites list.

#### Headers

| Header | Value | Description |
| --- | --- | --- |
| `Authorization` | `Bearer <token>` | **Required**. Valid user access token. |

#### Responses

* **200 OK**:
```json
{ "message": "successfully added to favorites" }

```


* **401 Unauthorized**: User is not logged in.
* **500 Internal Server Error**: Database failure while saving favorite.

---

### GET `[BASE_URL]/hostels/fav`

Retrieves a list of all hostels favorited by the currently authenticated user.

#### Authentication

* **Required**: A valid user session/token must be provided (handled via middleware).

#### Responses

* **200 OK**: Returns an array of `EnrichedHostel` objects.
* **401 Unauthorized**: User is not authenticated.
* **500 Internal Server Error**: Failed to retrieve data from the database.

---

### DELETE `[BASE_URL]/hostels/fav/:id`

Removes a specific hostel from the authenticated user's favorites list.

#### URL Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `:id` | `string` | The unique ID of the hostel to be removed. |

#### Authentication

* **Required**: Users can only delete items from their own favorites list.

#### Responses

* **200 OK**: Returns a success message: `{"message": "hostel successfully removed from favorites"}`.
* **401 Unauthorized**: User not authenticated.
* **500 Internal Server Error**: Database operation failed.

---

### GET `[BASE_URL]/hostels/vendor/:vendor_id`

Retrieves all hostels managed or listed by a specific agent/vendor.

#### URL Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| `:vendor_id` | `string` | The unique identifier of the agent/vendor. |

#### Authentication

* **Required**: Requires an authenticated user session to view agent listings.

#### Responses

* **200 OK**: Returns an array of `EnrichedHostel` objects belonging to the specified agent.
* **400 Bad Request**: Invalid user context or type.
* **401 Unauthorized**: User not authenticated.
* **500 Internal Server Error**: Server encountered an error fetching the agent's hostels.

---
