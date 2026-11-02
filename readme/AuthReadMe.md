## Base URL
The base URL for all API requests:

| Environment | URL |
| :--- | :--- |
| **Test** | `https://ufinda-v0-01.onrender.com` |
| **Production** | `https://ufinda-v0-01-2prv.onrender.com` |
| **Local Dev** | `http://localhost:8080` |

-----

## Email SignUp API
### POST `[BASE_URL]/auth/email/signup`

This endpoint registers a new user by creating a pending account and sending a one-time password (OTP) to their email address for verification.

-----

### Request

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `[BASE_URL]/auth/email/signup` | Creates a new pending user account and initiates email verification. |

#### Body

The request body must be a JSON object containing the user's registration details.

```json
{
  "email": "user@example.com",
  "password": "yourpassword123",
  "firstName": "John",
  "role": "user/vendor",
  "username": "if the role is vendor else omit",
  "lastName": "Doe",
  "phone": "+15551234567"
}
```

#### Headers

No special headers are required.

-----

### Workflow

1.  **Validation**: The endpoint first validates the request body.
2.  **Existing User Check**: It checks if an account with the provided email already exists, either as a fully created user or a pending user.
3.  **Password Hashing**: The provided password is securely hashed using `bcrypt`.
4.  **OTP Generation**: A unique six digits One-Time Password (OTP) is generated for email verification. This OTP is valid for **15 minutes**.
5.  **Pending Account Creation**: The new user's details, including the hashed password and OTP, are stored as a pending account in the database.
6.  **Email Delivery**: The OTP is sent to the user's email address.

-----

### Responses

#### Success

| Status Code | Description |
| :--- | :--- |
| `201 Created` | The pending user account was successfully created and the OTP was sent. The user can now proceed to verify their email. |

**Body**

```json
{
  "message": "OTP sent to your email, please verify."
}
```

#### Errors

| Status Code | Description |
| :--- | :--- |
| `400 Bad Request` | The request body is invalid or malformed, or the user's email is already registered. The response body will contain a specific error message. |
| `500 Internal Server Error` | An unexpected server error occurred (e.g., database connection issues, failed password hashing, or failed OTP generation/delivery). |

-----

## Resend OTP API

### POST `[BASE_URL]/auth/resend-otp`

This endpoint generates and dispatches a fresh one-time password (OTP) to a pending user's email address. It ensures that the user has not already completed registration (preventing conflict with active accounts) and updates the pending record with a new 15-minute expiration timestamp.

---

### Request

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `[BASE_URL]/auth/resend-otp` | Generates and sends a new OTP for account verification. |

#### Body

```json
{
  "email": "user@example.com"
}

```

#### Headers

* `Content-Type: application/json`

---

### Workflow

1. **Input Validation**: The endpoint binds and validates the JSON request body.
2. **Active Account Check**: It queries the database to see if an active user account already exists for the email address. If found, it returns an `ACCOUNT_ALREADY_EXISTS` error (`409`).
3. **Pending Account Lookup**: It verifies that the user exists in the pending registration store. If not found, it returns a `USER_NOT_FOUND` error (`404`).
4. **OTP Generation**: A new cryptographic OTP is generated.
5. **Expiration & Record Update**: It updates the pending user record with the new OTP and a fresh expiration time set to 15 minutes in the future.
6. **Email Dispatch**: It sends the new OTP via email to the user (`200 OK`).

---

### Responses

All responses follow the unified envelope standard (See [RESPONSES.md](https://github.com/ufindaafrica/ufinda_v0.01/blob/backend-devt/readme/RESPONSES.md)).

#### Success (`200 OK`)

```json
{
  "status": "success",
  "message": "otp resent successfully"
}

```

#### Error Responses

| HTTP Status | Error `code` | Default Message | Scenario |
| --- | --- | --- | --- |
| `404 Not Found` | `USER_NOT_FOUND` | No account found with this email. Please sign up to continue. | Email address does not exist in pending records. |
| `409 Conflict` | `ACCOUNT_ALREADY_EXISTS` | An account with this email already exists. Please log in. | User is already fully registered and verified. |
| `500 Internal Server Error` | `SERVER_ERROR` | An unexpected error occurred. Please try again. | JSON binding error, OTP generation failure, database update error, or email dispatch failure. |

----

## Verify OTP API

### POST `[BASE_URL]/auth/verify-otp`

This endpoint verifies a user's email address using a one-time password (OTP). Upon successful verification, a pending user account is converted into a fully active user account.

If the user is a student who has not yet paid their onboarding fee, the endpoint returns a payment required status (`402`) with the user's details so the mobile app can immediately launch the Paystack checkout flow.

---

### Request

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `[BASE_URL]/auth/verify-otp` | Verifies a pending user's account with an OTP. |

#### Body

```json
{
  "email": "user@example.com",
  "otp": "123456"
}

```

#### Headers

* `Content-Type: application/json`

---

### Workflow

1. **Input Validation**: The endpoint validates the JSON request body.
2. **Duplicate Check**: It checks if an active user account already exists. If so, it returns an `ACCOUNT_ALREADY_EXISTS` error (`409`).
3. **Pending Account Lookup**: It looks up the pending user record. If not found, it returns a `USER_NOT_FOUND` error (`404`).
4. **OTP & Expiration Check**: It verifies that the OTP matches and has not expired. Mismatches or expired codes return `400 Bad Request` (`INVALID_OTP` / `OTP_EXPIRED`).
5. **Account Provisioning**: A unique `UserID` is generated, and the user is moved from the pending store to the active database table.
6. **Cleanup & Notification**: The pending user record is deleted, and a welcome email is dispatched asynchronously.
7. **Payment & Authorization Check**:
* **Vendors/Agents** or **Students who have paid their booking fee** receive JWT authentication tokens immediately (`200 OK`).
* **Students who have NOT paid their booking fee** receive a `402 Payment Required` response containing their `id` and `role` to trigger the Paystack onboarding flow.



---

### Responses

All responses follow the unified envelope standard (See [RESPONSES.md](https://github.com/ufindaafrica/ufinda_v0.01/blob/backend-devt/readme/RESPONSES.md)).

#### Success (`200 OK`) — Fully Authenticated Users (Agents & Paid Students)

```json
{
  "status": "success",
  "message": "verification successful",
  "data": {
    "is_paid": true,
    "access_token": "eyJhbGciOiJIUzI1Ni...",
    "refresh_token": "eyJhbGciOiJIUzI1Ni...",
    "id": "usr-895659",
    "role": "vendor"
  }
}

```

#### Payment Required (`402 Payment Required`) — Unpaid Students

```json
{
  "status": "error",
  "code": "PAYMENT_REQUIRED",
  "message": "Verification successful. Onboarding payment required.",
  "data": {
    "is_paid": false,
    "id": "usr-895659",
    "role": "user"
  }
}

```

#### Error Responses

| HTTP Status | Error `code` | Default Message | Scenario |
| --- | --- | --- | --- |
| `400 Bad Request` | `BAD_REQUEST` | Invalid request payload. Please check your input. | Malformed JSON structure. |
| `400 Bad Request` | `INVALID_OTP` | The OTP entered is incorrect. Please check and try again. | OTP string mismatch. |
| `400 Bad Request` | `OTP_EXPIRED` | Your OTP has expired. Please request a new code. | Code past its expiration timestamp. |
| `404 Not Found` | `USER_NOT_FOUND` | No account found with this email. Please sign up to continue. | Email not found in pending records. |
| `409 Conflict` | `ACCOUNT_ALREADY_EXISTS` | An account with this email already exists. Please log in. | User already verified and active. |
| `500 Internal Server Error` | `SERVER_ERROR` | An unexpected error occurred. Please try again. | Database failure or ID generation error. |

-----

## Email Login API

### POST `[BASE_URL]/auth/login`

This endpoint authenticates an existing user using their email address and password. It includes a Redis-based rate limiter that tracks failed login attempts and enforces a temporary lockout after 5 consecutive failures.

Upon successful authentication, the endpoint checks the user's payment status, beta status, and role. Vendors, beta users, and users who have paid their booking fee receive JWT authentication tokens immediately. Unpaid students receive a payment required status (`402`) to trigger the Paystack onboarding flow.

---

### Request

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `[BASE_URL]/auth/login` | Authenticates a user with email and password credentials. |

#### Body

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

```

#### Headers

* `Content-Type: application/json`

---

### Workflow

1. **Input Validation**: The endpoint binds and validates the JSON request body against the login schema. If binding fails, it returns a `BAD_REQUEST` error (`400`).
2. **User Lookup**: It queries the database for an active user account matching the provided email address. If the email is not found, it returns a `USER_NOT_FOUND` error (`404`).
3. **Rate Limiting Check**: It checks Redis for the current count of failed login attempts for the email. If attempts have reached or exceeded 5, it logs a security event and returns a `429 Too Many Requests` status with the remaining lockout duration.
4. **Password Verification**: It compares the provided password hash against the stored user password.
* **On Mismatch**: It increments the Redis failed attempt counter (setting a 15-minute TTL on the first failure) and returns a `401 Unauthorized` error.
* **On Match**: It clears the login attempt counter from Redis.


5. **Fee & Role Evaluation**: It checks whether the user is a beta user, a vendor, or has paid their onboarding/booking fee.
6. **Token Generation or Payment Prompt**:
* **Authorized Users (Vendors, Beta Users, & Paid Students)**: Generates and returns JWT access and refresh tokens along with user metadata (`200 OK`).
* **Unpaid Students**: Returns a `402 Payment Required` response (`PAYMENT_REQUIRED`) to initiate the payment checkout flow.



---

### Responses

All responses follow the unified envelope standard (See [RESPONSES.md](https://github.com/ufindaafrica/ufinda_v0.01/blob/backend-devt/readme/RESPONSES.md)).

#### Success (`200 OK`) — Authenticated Users (Vendors, Beta, & Paid Students)

```json
{
  "status": "success",
  "message": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1Ni...",
    "refresh_token": "eyJhbGciOiJIUzI1Ni...",
    "role": "vendor",
    "id": "usr-895659"
  }
}

```

#### Payment Required (`402 Payment Required`) — Unpaid Students

```json
{
  "status": "error",
  "code": "PAYMENT_REQUIRED",
  "message": "An onboarding fee is required to activate your account.",
}

```

#### Too Many Requests (`429 Too Many Requests`) — Rate Limit Exceeded

```json
{
  "error": "Too many login attempts. Please try again in 10 minutes"
}

```

#### Error Responses

| HTTP Status | Error `code` | Default Message | Scenario |
| --- | --- | --- | --- |
| `400 Bad Request` | `BAD_REQUEST` | Invalid request payload. Please check your input. | Malformed JSON structure or validation failure. |
| `401 Unauthorized` | `UNAUTHORIZED` | Unauthorized access. Please log in again. | Incorrect password provided. |
| `404 Not Found` | `USER_NOT_FOUND` | No account found with this email. Please sign up to continue. | Email address does not exist in active records. |
| `402 Payment Required` | `PAYMENT_REQUIRED` | An onboarding fee is required to activate your account. | Student login successful, but booking fee is unpaid. |
| `429 Too Many Requests` | `RATE_LIMIT_EXCEEDED` | Too many login attempts. Please try again in X minutes | 5 consecutive failed login attempts reached. |
| `500 Internal Server Error` | `SERVER_ERROR` | An unexpected error occurred. Please try again. | Database failure, Redis error, or token generation failure. |

----

## Logout API

### POST `[BASE_URL]/auth/logout`

This endpoint terminates the user's current active session by invalidating and blacklisting both their access and refresh tokens in Redis. It performs a soft check on the access token and a strict check on the refresh token, safely handling already blacklisted tokens for security auditing.

---

### Request

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `[BASE_URL]/auth/logout` | Revokes access and refresh tokens to log the user out. |

#### Headers

* `Authorization: Bearer <access_token>`
* `X-Refresh-Token: Refresh <refresh_token>` *(Required)*

---

### Workflow

1. **Token Extraction**: The endpoint extracts the `Authorization` and `X-Refresh-Token` headers. If the refresh token header is missing, it returns a `BAD_REQUEST` error (`400`).
2. **Access Token Validation**: It performs a "soft" validation of the access token. Even if expired, the logout process continues to ensure the session's refresh token is properly revoked.
3. **Refresh Token Validation**: It validates the refresh token to identify the session. If the token is invalid or the session has expired, it returns an `UNAUTHORIZED` error (`401`).
4. **Blacklist Check**: It checks if the refresh token JTI is already blacklisted in Redis. If already blacklisted, it logs a security warning and returns a success response (`200 OK`).
5. **TTL Calculation**: It computes the remaining expiration durations for both tokens to set precise time-to-live (TTL) bounds in the Redis blacklist store.
6. **Token Revocation**: It revokes both tokens in Redis and returns a success response (`200 OK`).

---

### Responses

All responses follow the unified envelope standard (See [RESPONSES.md](https://github.com/ufindaafrica/ufinda_v0.01/blob/backend-devt/readme/RESPONSES.md)).

#### Success (`200 OK`) — Logged Out Successfully

```json
{
  "status": "success",
  "message": "Logged out successfully"
}

```

#### Success (`200 OK`) — Already Logged Out (Blacklisted Token Reuse)

```json
{
  "status": "success",
  "message": "Already logged out",
}

```

#### Error Responses

| HTTP Status | Error `code` | Default Message | Scenario |
| --- | --- | --- | --- |
| `400 Bad Request` | `BAD_REQUEST` | Invalid request payload. Please check your input. | Missing `X-Refresh-Token` header. |
| `401 Unauthorized` | `UNAUTHORIZED` | Unauthorized access. Please log in again. | Invalid or expired refresh token. |
| `500 Internal Server Error` | `SERVER_ERROR` | An unexpected error occurred. Please try again. | Redis blacklist check failure or token revocation error. |

-----

## Refresh Token API

### POST `[BASE_URL]/auth/token/refresh`

This endpoint issues a fresh pair of access and refresh tokens using a valid, non-expired refresh token. It implements token rotation security by checking if the incoming refresh token has been blacklisted, logging security events if reused, and revoking the old refresh token upon issuing a new pair.

---

### Request

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `[BASE_URL]/auth/token/refresh` | Rotates and issues new access and refresh tokens. |

#### Headers

* `X-Refresh-Token: Refresh <refresh_token>` *(Required)*

---

### Workflow

1. **Header Check**: The endpoint checks for the `X-Refresh-Token` header. If missing, it returns a `BAD_REQUEST` error (`400`).
2. **Token Validation**: It validates the cryptographic signature and expiration of the refresh token. If invalid, it returns an `UNAUTHORIZED` error (`401`).
3. **Blacklist & Reuse Detection**: It checks Redis to see if the refresh token JTI has already been used or blacklisted.
* **If Blacklisted**: It logs a security audit event and rejects the request with an `UNAUTHORIZED` error (`401`) to protect against token reuse/compromise.


4. **Token Generation**: It generates a brand new access and refresh token pair for the user.
5. **Old Token Revocation**: It revokes the old refresh token by adding its JTI to the Redis blacklist with its remaining time-to-live.
6. **Success Response**: It returns the new token pair along with user metadata (`200 OK`).

---

### Responses

All responses follow the unified envelope standard (See [RESPONSES.md](https://github.com/ufindaafrica/ufinda_v0.01/blob/backend-devt/readme/RESPONSES.md)).

#### Success (`200 OK`) — Tokens Refreshed Successfully

```json
{
  "status": "success",
  "message": "Tokens refreshed successfully",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1Ni...",
    "refresh_token": "eyJhbGciOiJIUzI1Ni...",
    "id": "usr-895659",
    "role": "vendor"
  }
}

```

#### Error Responses

| HTTP Status | Error `code` | Default Message | Scenario |
| --- | --- | --- | --- |
| `400 Bad Request` | `BAD_REQUEST` | Invalid request payload. Please check your input. | Missing `X-Refresh-Token` header. |
| `401 Unauthorized` | `UNAUTHORIZED` | Unauthorized access. Please log in again. | Invalid signature, expired refresh token, or blacklisted token reuse attempt. |
| `500 Internal Server Error` | `SERVER_ERROR` | An unexpected error occurred. Please try again. | Token validation failure, Redis blacklist check error, token generation failure, or revocation error. |

-----

## DELETE ACCOUNT API
### DELETE `/auth/account/delete`

This endpoint allows an authenticated user to permanently delete their own account. It handles the deletion of associated assets (like profile images) before confirming account deletion in the database.

-----

### Request

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `DELETE` | `/auth/account/delete` | Permanently deletes the authenticated user's account and associated assets. |

#### Body

No request body is required.

#### Headers

| Header | Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <access_token>` | **Required** for user authentication. |

-----

### Workflow

1.  **Authentication & ID Retrieval**: The endpoint retrieves the user's ID from the request context, which is set by the authentication middleware.
2.  **User Verification**: The full user record is fetched to verify existence and check the user's role.
3.  **Asset Cleanup**:
      * If the user has a kyc record, the system attempts to find their KYC record.
      * If a KYC record exists and contains a **Profile Image Public ID**, the corresponding image asset is deleted from Cloudinary (including forced CDN cache invalidation). Errors during KYC fetch (excluding `ErrorKYCNotFound`) or asset deletion are logged and cause a `500` error return.
4.  **Account Deletion**: The final authenticated user record is deleted from the primary database.
5.  **Confirmation**: A success message is returned to the client.

-----

### Responses

#### Success

| Status Code | Description |
| :--- | :--- |
| `200 OK` | The user account and all associated data/assets were successfully deleted. |

**Body**

```json
{
  "message": "account deleted successfully"
}
```

#### Errors

| Status Code | Description |
| :--- | :--- |
| `401 Unauthorized` | User not authenticated. |
| `400 Bad Request` | An invalid user ID type was found in the context (middleware error). |
| `404 Not Found` | The authenticated user's account could not be found in the database. |
| `500 Internal Server Error` | An unexpected server error occurred (e.g., **database error**, **asset deletion failure**, or **KYC ID generation failure**). |

-----

### Forget Password API

This endpoint allows a user to initiate the password reset process by submitting their email address.

#### POST `[BASE_URL]/auth/forget-pwd`

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `[BASE_URL]/auth/forget-pwd` | Initiates the process to send a secure password reset link to the user's email. |

#### Request Body

The request body must be a JSON object containing the user's registered email address.

```json
{
  "email": "user@example.com"
}
```

#### Workflow

1.  **Validation**: The endpoint validates the request body for a valid email format.
2.  **User Check (Silent Success)**: It attempts to find a created user account associated with the email.
      * *If the user is **not found**,* it returns a generic success message to prevent user enumeration attacks.
      * *If the user is **found**,* it proceeds to token generation.
3.  **Token Generation**: A cryptographically secure, unique token is generated.
4.  **Token Storage**: The new token is stored in the database along with the `UserID` and an expiry time of **15 minutes**.
5.  **Email Delivery**: The secure password reset link (containing the generated token) is sent to the user's email address.

#### Responses

| Status Code | Description |
| :--- | :--- |
| `200 OK` | The process was initiated successfully, and a reset link has been sent to the email address on file (if it exists). |
| `400 Bad Request` | The request body is invalid or malformed. |
| `500 Internal Server Error` | An unexpected server error occurred (e.g., failed to generate the token, failed to save the token, or failed email delivery). |

**Success Body**

A generic success message is returned whether the email is found or not for security purposes.

```json
{
  "message": "A password reset link has been sent to your email address."
}
```

-----

## Reset Password API

### POST `[BASE_URL]/auth/reset-pwd`

This endpoint allows a user to reset their account password using a valid password reset token. It verifies the token's existence and expiration, hashes the new password securely using bcrypt, deletes the used token to prevent reuse, and updates the user's record in the database.

---

### Request

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `[BASE_URL]/auth/reset-pwd` | Resets a user's password using a reset token. |

#### Body

```json
{
  "token": "reset_token_string_here",
  "new_password": "NewSecurePassword123!"
}

```

#### Headers

* `Content-Type: application/json`

---

### Workflow

1. **Input Validation**: The endpoint validates the JSON request body against the reset password schema. If validation fails, it returns a `BAD_REQUEST` error (`400`).
2. **Token Lookup**: It queries the database for the provided reset token. If not found, it returns an invalid or expired token error (`410 Gone`).
3. **Expiration Check**: It checks if the current time has passed the token's expiration timestamp. If expired, it deletes the token and returns an `OTP_EXPIRED` error (`401`).
4. **Password Hashing**: It securely hashes the new password using bcrypt.
5. **Token Deletion**: It deletes the used reset token to ensure single-use enforcement and security.
6. **User Record Update**: It updates the user's profile with the new hashed password and returns a success response (`200 OK`).

---

### Responses

All responses follow the unified envelope standard (See [RESPONSES.md](https://github.com/ufindaafrica/ufinda_v0.01/blob/backend-devt/readme/RESPONSES.md)).

#### Success (`200 OK`) — Password Updated Successfully

```json
{
  "status": "success",
  "message": "Password updated successfully"
}

```

#### Error Responses

| HTTP Status | Error `code` | Default Message | Scenario |
| --- | --- | --- | --- |
| `400 Bad Request` | `BAD_REQUEST` | Invalid request payload. Please check your input. | Malformed JSON structure or missing fields. |
| `401 Unauthorized` | `OTP_EXPIRED` | Your OTP has expired. Please request a new code. | Reset token has passed its expiration time. |
| `410 Gone` | `BAD_REQUEST` | Token is invalid or expired | Reset token does not exist in the database. |
| `500 Internal Server Error` | `SERVER_ERROR` | An unexpected error occurred. Please try again. | Database retrieval error, bcrypt hashing failure, or user update error. |

----

## Forgot Password API

### POST `[BASE_URL]/auth/forget-pwd`

This endpoint initiates a password recovery flow by generating a secure, time-limited reset token and dispatching a password reset link to the user's email address. To prevent user enumeration attacks, it returns a generic success response even if the provided email address does not exist in the system.

---

### Request

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `[BASE_URL]/auth/forget-pwd` | Requests a password reset link for account recovery. |

#### Body

```json
{
  "email": "user@example.com"
}

```

#### Headers

* `Content-Type: application/json`

---

### Workflow

1. **Input Validation**: The endpoint binds and validates the JSON request body against the forgot password schema. If validation fails, it returns a `BAD_REQUEST` error (`400`).
2. **User Lookup**: It queries the database for an active user account matching the email address.
* **If Not Found**: It deliberately returns a generic success message (`200 OK`) to prevent email harvesting/enumeration attacks.


3. **Secure Token Generation**: It generates a cryptographically secure random token.
4. **Token Storage & Expiration**: It persists the reset token linked to the user ID with an expiration time set to 15 minutes in the future.
5. **Email Dispatch**: It sends the password reset link via email to the user and returns a success response (`200 OK`).

---

### Responses

All responses follow the unified envelope standard (See [RESPONSES.md](https://github.com/ufindaafrica/ufinda_v0.01/blob/backend-devt/readme/RESPONSES.md)).

#### Success (`200 OK`) — Reset Link Sent (or Non-existent Email Handled)

```json
{
  "status": "success",
  "message": "A password reset link has been sent to your email address.",
}

```

#### Error Responses

| HTTP Status | Error `code` | Default Message | Scenario |
| --- | --- | --- | --- |
| `400 Bad Request` | `BAD_REQUEST` | Invalid request payload. Please check your input. | Malformed JSON structure or missing email field. |
| `500 Internal Server Error` | `SERVER_ERROR` | An unexpected error occurred. Please try again. | Database retrieval failure, token generation error, database save failure, or email dispatch error. |

----

## Change Password API

### POST `[BASE_URL]/auth/change-pwd`

This endpoint allows an authenticated user to update their account password. It extracts the user ID from the request context (supplied by the authentication middleware), validates that the user's authentication provider is custom (preventing password changes for OAuth/social logins), ensures the new password differs from the current one, and securely hashes and updates the password in the database.

---

### Request

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `[BASE_URL]/auth/change-pwd` | Updates the password for an authenticated user. |

#### Headers

* `Authorization: Bearer <access_token>` *(Required)*
* `Content-Type: application/json`

#### Body

```json
{
  "new_password": "NewSecurePassword456!"
}

```

---

### Workflow

1. **Context Extraction**: The endpoint extracts the authenticated user's ID from the Gin context.
2. **User Lookup**: It retrieves the user record from the database by ID. If retrieval fails, it returns a `SERVER_ERROR` (`500`).
3. **Input Validation**: It binds and validates the JSON body containing the new password. If validation fails, it returns a `BAD_REQUEST` (`400`).
4. **Provider Verification**: It checks if the user's authentication provider (`AuthProvider`) is set to `"custom"`. If not (e.g., social login accounts), it rejects the action with a `403 Forbidden` response (`"Action not allowed"`).
5. **Password Uniqueness Check**: It compares the new password against the existing hashed password using bcrypt. If they match, it returns a `BAD_REQUEST` (`400`) indicating that the new password must be different.
6. **Password Hashing & Update**: It securely hashes the new password with bcrypt, updates the user's record in the database, and returns a success response (`200 OK`).

---

### Responses

All responses follow the unified envelope standard (See [RESPONSES.md](https://github.com/ufindaafrica/ufinda_v0.01/blob/backend-devt/readme/RESPONSES.md)).

#### Success (`200 OK`) — Password Updated Successfully

```json
{
  "status": "success",
  "message": "Password updated successfully"
}

```

#### Error Responses

| HTTP Status | Error `code` | Default Message | Scenario |
| --- | --- | --- | --- |
| `400 Bad Request` | `BAD_REQUEST` | Invalid request payload. Please check your input. | Malformed JSON body or new password matches current password. |
| `403 Forbidden` | `BAD_REQUEST` | Action not allowed | User signed up via an external provider (not custom auth). |
| `500 Internal Server Error` | `SERVER_ERROR` | An unexpected error occurred. Please try again. | Database retrieval error, bcrypt hashing failure, or database update error. |