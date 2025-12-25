# PRODUCT APIs: *VENDOR*

## Base URL

The base URL for all API requests:

| Environment | URL |
| --- | --- |
| **Production** | `http://ufinda-v0-01.onrender.com` |
| **Local Dev** | `http://localhost:8080` |

---

### POST `[BASE_URL]/product/list`

This endpoint allows verified vendors to list a new product. It creates the product record and offloads media (images and video) processing to a background worker to ensure a high-performance, non-blocking response.

---

### Request

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `[BASE_URL]/product/list` | Creates a new product listing. |

#### Body

The request body must be sent as `multipart/form-data`.

| Field | Type | Description |
| --- | --- | --- |
| `title` | `string` | The name/title of the product. |
| `price` | `string` | The price of the product (supports commas, e.g., "200,000"). |
| `category` | `string` | The category **slug** (e.g., "laptops", "mobile-phones"). |
| `description` | `string` | A detailed description of the product. |
| `attributes` | `string (JSON)` | A JSON string of dynamic product specifications (e.g., `{"RAM": "16GB"}`). |
| `product_images` | `file[]` | One or more image files. **Required.** |
| `product_video` | `file` | A single video file. **Optional.** |

#### Headers

This endpoint requires an `Authorization` header with a valid vendor access token.

| Header | Example Value | Description |
| --- | --- | --- |
| `Authorization` | `Bearer <access_token>` | The vendor's current access token. |

---

### Workflow

1. **Authorization**: Verifies the vendor's session and checks if the vendor is **KYC verified**. Non-verified vendors are blocked from listing products.
2. **Data Sanitization**: Automatically strips commas from the `price` string and converts it to a 64-bit integer. It also validates that at least one image is provided.
3. **Unique ID Generation**: Generates a unique `productID` and checks the database to ensure no collisions exist.
4. **Database RPC**: Executes a database stored procedure (`create_product_by_slug`) to resolve the category slug into a UUID and create the initial product record.
5. **Asynchronous Media Processing**: Files are converted to byte data and enqueued via **Asynq**. A background worker handles the Cloudinary upload and updates the product record with final URLs.
6. **Quick Response**: Returns a `202 Accepted` status immediately after the database record is initiated and the task is enqueued.

---

### Responses

#### Success

| Status Code | Description |
| --- | --- |
| `202 Accepted` | The product was successfully listed, and media is being processed in the background. |

**Body**

```json
{
  "message": "Product listed. Media is being processed in the background."
}

```

#### Errors

| Status Code | Description |
| --- | --- |
| `400 Bad Request` | Missing images, invalid price format, or malformed multipart data. |
| `401 Unauthorized` | Invalid access token or the vendor is not KYC verified. |
| `500 Internal Server Error` | Database connection failure or failure to generate a unique product ID. |

-----