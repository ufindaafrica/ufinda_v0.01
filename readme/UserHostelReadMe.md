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
| `price_min` | `string` | Minimum annual rent. |
| `price_max` | `string` | Maximum annual rent. |
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

### POST `/hostels/:id`

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
