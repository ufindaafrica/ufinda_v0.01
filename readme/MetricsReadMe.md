# METRICS APIS

## Base URL
The base URL for all API requests:

| Environment | URL |
| :--- | :--- |
| **Test** | `https://ufinda-v0-01.onrender.com` |
| **Production** | `https://ufinda-v0-01-2prv.onrender.com` |
| **Local Dev** | `http://localhost:8080` |

-----

## Submit Vendor Rating

Used when a buyer wants to leave a star rating and a text review for a vendor.

* **Endpoint:** `POST [BASE_URL]/metrics/rating`
* **Authentication:** Required (Bearer Token)
* **Constraints:** * A vendor **cannot** rate themselves.
* A user can only rate a specific vendor **once** (Duplicate attempts return a conflict).



### Request Payload (JSON)

| Field | Type | Description |
| --- | --- | --- |
| `vendor_id` | `string` | The unique ID of the vendor being rated. |
| `score` | `int` | Rating score (typically 1-5). |
| `review` | `string` | The text feedback from the user. |

**Example Request:**

```json
{
  "vendor_id": "vnd-613797",
  "score": 5,
  "review": "Excellent service, the vendor was very professional!"
}

```

### Potential Responses

| Status Code | Reason | JSON Response |
| --- | --- | --- |
| **201 Created** | Success | `{"message": "rating submitted successfully"}` |
| **403 Forbidden** | Self-Rating | `{"error": "action not allowed"}` |
| **409 Conflict** | Duplicate | `{"error": "You have already submitted a rating for this vendor."}` |
| **400 Bad Request** | Missing Data | `{"error": "invalid request"}` |

---

## Record Profile View

Used to track when a user opens a vendor's profile page. This helps vendors see their engagement metrics.

* **Endpoint:** `PUT [BASE_URL]/metrics/profile_view/:vendor_id`
* **Authentication:** Required (Bearer Token)
* **Parameter Type:** **Path Parameter** (The ID is part of the URL).

### Potential Responses

| Status Code | Reason | JSON Response |
| --- | --- | --- |
| **200 OK** | Success | `{"message": "view set for user"}` |
| **409 Conflict** | Already Tracked | `{"error": "View already set for user"}` |
| **401 Unauthorized** | Not Logged In | `{"error": "user not authenticated"}` |

---

This documentation covers the **Metrics Retrieval** endpoints. These allow vendors to track their performance and allow buyers to see vendor credibility via ratings.

---

## Get My Profile Views

Returns the total number of times the authenticated vendor's profile has been viewed.

* **Endpoint:** `GET [BASE_URL]/metrics/profile_views`
* **Authentication:** **Required** (Bearer Token)
* **Target Audience:** Vendors (checks the `id` of the logged-in user).

### Success Response (200 OK)

```json
{
  "profile_views": 124
}

```

### Error Responses

| Status Code | Description |
| --- | --- |
| **401 Unauthorized** | Missing or invalid authentication token. |
| **500 Internal Server Error** | Database connection issue or query failure. |

---

## Get Vendor Rating & Stats

Returns the current average rating and the total number of reviews for a specific vendor.

* **Endpoint:** `GET [BASE_URL]/metrics/rating/:vendor_id`
* **Authentication:** **Not Required** (Publicly accessible).
* **Parameter Type:** **Path Parameter** (`vendor_id`).

### Success Response (200 OK)

```json
{
  "current_rating": 4.8,
  "total_ratings": 56
}

```

> **Note:** If a vendor has no ratings yet, the system returns `0.0` for the rating and `0` for total ratings rather than an error.

### Error Responses

| Status Code | Description |
| --- | --- |
| **500 Internal Server Error** | Failed to retrieve data from the metrics table. |

---
