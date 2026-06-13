## PRODUCT API: *VENDOR*

This documentation outlines the API structure for managing vendor product listings within the uFinda platform.

---

## Base URL
The base URL for all API requests:

| Environment | URL |
| :--- | :--- |
| **Production** | `http://ufinda-v0-01.onrender.com` |
| **Local Dev** | `http://localhost:8080` |

-----

## 1. Authentication & Security

* **Middleware:** All product endpoints are protected by `UserAuthMiddleware`.
* **Verification:** Only vendors with `is_verified: true` are permitted to list products. Attempting to list as an unverified vendor will result in a `401 Unauthorized` error.

---

## 2. API Endpoints

### Create Product

`POST [BASE_URL]/product/list`

**Description:** Creates a new product or service listing. This endpoint expects a JSON payload containing product metadata, pricing, and media references.

**Request Payload:**

```json
{
  "title": "Professional Plumbing Service",
  "description": "Expert residential plumbing, repairs, and installations.",
  "category": "home-services",
  "price": "15,000",
  "attributes": {
    "warranty": "1 year",
    "emergency_service": true
  },
  "product_images": [
    { "url": "https://res.cloudinary.com/...", "public_id": "image_uuid_1" }
  ],
  "product_video": { "url": "https://res.cloudinary.com/...", "public_id": "video_uuid" }
}

```

**Constraints:**

* `product_images`: Minimum 1, Maximum 3.
* `product_video`: Maximum 1.
* `price`: String format (supports comma-separated values like `"15,000"`).
* `attributes`: Optional JSON object for category-specific data.

**Response (202 Accepted):**

```json
{
  "message": "Product listed successfully",
  "id": "prd-5xxx"
}

```

---

## 3. Implementation Logic

* **Media Handling:** This API follows a **Client-Side Upload** pattern. Before calling this endpoint, the client must upload media files to Cloudinary. The `url` and `public_id` returned by Cloudinary are then passed into this request.
* **ID Generation:** A unique `productID` is generated using a secure random token generator, ensuring uniqueness within the `product_items` table.
* **Price Formatting:** The backend automatically strips commas from the `price` string before converting it to an integer for database storage.
* **Notifications:** Upon successful listing, the system triggers an asynchronous push notification to the vendor confirming that their product is live.

---

## 4. Error Handling

| Status Code | Reason |
| --- | --- |
| **400 Bad Request** | Missing fields, validation errors, or invalid price format. |
| **401 Unauthorized** | Missing token or vendor is not verified. |
| **500 Internal Error** | Database failure or ID generation error. |
| **5XX (Database)** | Database rejected the payload (details provided in response). |

---
