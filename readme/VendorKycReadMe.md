
## Vendor KYC & Onboarding APIs

This documentation covers the two methods for vendor identity and profile verification: (1) initiating the full KYC process via a Dojah Widget, and (2) updating the basic profile information (Mini-KYC).

-----

### 1\. Full KYC: Get Widget URL

This authenticated endpoint is used to generate a secure, personalized URL for the vendor to launch the full Know Your Customer (KYC) identity verification widget.

#### GET `[BASE_URL]/kyc/vendor`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `[BASE_URL]/kyc/vendor` | Generates a unique, pre-signed URL to launch the Dojah identity verification widget. |

#### Headers

| Key | Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <JWT_Token>` | Required for user authentication and identifying the vendor. |

#### Request Body

None.

#### Workflow

1.  **Authentication**: The request is validated, and the `user` object (containing `ID` and `Role`) is extracted from the JWT token in the context.
2.  **Configuration Check**: The system validates that necessary environment variables (`DOJAH_WIDGET_URL`, `DOJAH_WIDGET_ID`) are set.
3.  **URL Generation**: A final widget URL is constructed by appending the `widget_id` and passing the authenticated vendor's `user_id` and `role` as metadata. This metadata is critical for the subsequent webhook processing.

#### Responses

| Status Code | Description |
| :--- | :--- |
| `200 OK` | Successfully generated and returned the final widget URL. |
| `500 Internal Server Error` | Authentication error, missing environment variables, or invalid URL configuration. |

**Success Body**

```json
{
  "message": "https://widget.dojah.io/v1/kyc?widget_id=abc...&metadata[user_id]=vnd-12345..."
}
```

-----

### 2\. Mini-KYC: Update Vendor Profile

This endpoint allows an authenticated vendor to update their basic profile information, which is considered the "Mini-KYC" or onboarding profile setup. This uses a `multipart/form-data` request as it handles file uploads.

#### POST `[BASE_URL]/kyc/vendor`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `[BASE_URL]/kyc/vendor` | Creates or updates the vendor's basic profile, including address, 'about me', and a profile image. |

#### Headers

| Key | Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <JWT_Token>` | Required for user authentication. |
| `Content-Type` | `multipart/form-data` | Required for file upload. |

#### Form Fields

| Key | Type | Description |
| :--- | :--- | :--- |
| `address` | `string` | The vendor's physical address. |
| `about_me` | `string` | A brief description about the vendor. |
| `profile_img` | `file` | The vendor's profile picture file (optional). |

#### Workflow

1.  **Authentication**: The vendor is authenticated via JWT.
2.  **Data Extraction**: Data (`address`, `about_me`, `profile_img`) is extracted from the `multipart/form-data` request.
3.  **Image Upload**: If a `profile_img` is present, it is uploaded to Cloudinary (or similar) and the resulting `URL` and `PublicID` are stored. Image upload errors are logged but **do not prevent** the rest of the profile update from proceeding.
4.  **Database Operation**:
      * **Find**: The system checks if a KYC record already exists for the vendor.
      * **Update**: If a record is found, only the provided fields (`address`, `about_me`, `profile_img`) are updated.
      * **Create**: If no record is found, a new `VendorKYC` record is created with the provided profile data.

#### Responses

| Status Code | Description |
| :--- | :--- |
| `200 OK` | The profile information was successfully updated or created. |
| `401 Unauthorized` | User token is missing or invalid. |
| `500 Internal Server Error` | A database error occurred during the fetch, create, or update process. |

**Success Body**

```json
{
  "message": "kyc updated successfully" 
  // or "kyc created successfully"
}
```

-----

## 🌐 Real-Time Status via WebSocket

After the vendor launches the Dojah widget (using the URL from the first endpoint), the final result of the KYC process is communicated back to the client in real-time using a WebSocket connection.

### WebSocket Endpoint

| Protocol | Endpoint | Description |
| :--- | :--- | :--- |
| `WS` | `ws://[BASE_URL]/ws?user_id=<VENDOR_ID>` | Connects the client to a real-time channel associated with the specific vendor. |

### Connection Process

1.  **Client Connects**: The vendor's client application establishes a WebSocket connection, using the vendor's unique identifier (`<VENDOR_ID>`) as a query parameter.
2.  **Server Registers**: Your Go backend's `hub` registers the client ID and holds the connection open.
3.  **Client Waits**: The client enters a waiting state (e.g., displaying a "Verifying..." loader).
4.  **Status Push**: Once the Dojah webhook is received and processed by your backend, the `HandleVerificationPayload` function pushes the final status object to this WebSocket connection.

### Potential Response Messages

The client will receive a single JSON object (the `KYCStatusUpdate` payload) once the verification process is complete.

| Field | Type | Description |
| :--- | :--- | :--- |
| `user_id` | `string` | The ID of the vendor whose status is being updated. |
| `final_status` | `string` | The final status determined by your business logic. |
| `message` | `string` | A user-friendly message to display to the vendor. |

#### Example Payloads

| `final_status` | `message` | Notes |
| :--- | :--- | :--- |
| **`SUCCESS`** | `"User KYC successfully verified."` | Verification passed all external and internal checks. |
| **`PENDING_MANUAL_REVIEW`** | `"Verification requires manual review. Please contact support to complete your KYC."` | KYC completed, but internal checks (e.g., name mismatch) require a human review. |
| **`FAILED`** | `"Verification incomplete or failed internal checks."` | Verification failed the external provider's rules or failed your custom checks entirely. |
| **`SYSTEM_ERROR`** | `"KYC result determined but failed to save to database. Contact support."` | Critical infrastructure failure (e.g., database write failure). The user should be instructed to contact support. |

-----
