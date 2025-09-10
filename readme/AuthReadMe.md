# AUTH APIs: *USER*

## Email SignUp API
### POST `/auth/email/signup`

This endpoint registers a new user by creating a pending account and sending a one-time password (OTP) to their email address for verification.

-----

### Request

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/email/signup` | Creates a new pending user account and initiates email verification. |

#### Body

The request body must be a JSON object containing the user's registration details.

```json
{
  "email": "user@example.com",
  "password": "yourpassword123",
  "firstName": "John",
  "role": "user/vendor",
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
4.  **OTP Generation**: A unique One-Time Password (OTP) is generated for email verification. This OTP is valid for **15 minutes**.
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
### POST `/auth/otp/resend`

This endpoint allows a user to request a new One-Time Password (OTP) if the previous one has expired or was not received.

-----

### Request

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/otp/resend` | Requests a new OTP for a pending user account. |

#### Body

The request body must be a JSON object containing the email address of the user.

```json
{
  "email": "user@example.com"
}
```

#### Headers

No special headers are required.

-----

### Workflow

1.  **User Status Check**: The endpoint first checks if the user's account is already active. If so, a `400` error is returned. It then verifies that a pending user account exists for the provided email.
2.  **OTP Generation**: A new OTP is generated and its expiration time is set to 15 minutes from the current time.
3.  **Update Database**: The pending user's record in the database is updated with the new OTP and its expiration time.
4.  **Email Delivery**: The new OTP is sent to the user's email address.

-----

### Responses

#### Success

| Status Code | Description |
| :--- | :--- |
| `200 OK` | The new OTP was successfully sent to the user's email. |

**Body**

```json
{
  "message": "otp resent successfully"
}
```

#### Errors

| Status Code | Description |
| :--- | :--- |
| `400 Bad Request` | The request body is invalid, or a user with the provided email is either already verified or does not exist as a pending user. |
| `500 Internal Server Error` | An unexpected server error occurred (e.g., database connection issues, failed OTP generation, or failed email delivery). |

-----

## Verify OTP API
### POST `/auth/verify-otp`

This endpoint verifies a user's email address using a one-time password (OTP). A pending user account is converted into a fully active user account upon successful verification.

-----

### Request

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/verify-otp` | Verifies a pending user's account with an OTP. |

#### Body

The request body must be a JSON object containing the user's email and the OTP received via email.

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

#### Headers

No special headers are required.

-----

### Workflow

1.  **Input Validation**: The endpoint validates the request body.
2.  **User Status Check**: It first checks to ensure the user is not already a fully verified user. It then verifies that a pending account exists for the provided email.
3.  **OTP Validation**: The provided OTP is matched against the one stored in the pending user record. If the OTP is incorrect or has expired (**15-minute validity**), the request is denied.
4.  **Account Creation**: Upon successful OTP verification, a new active user account is created in the database with the details from the pending account.
5.  **Cleanup**: The pending user record is then deleted from the database to maintain data integrity.

-----

### Responses

#### Success

| Status Code | Description |
| :--- | :--- |
| `200 OK` | The email verification was successful, and the user's account is now active. |

**Body**

```json
{
  "message": "verification successful"
}
```

#### Errors

| Status Code | Description |
| :--- | :--- |
| `400 Bad Request` | The request body is invalid, the user is already verified, or a pending account with the provided email does not exist. |
| `401 Unauthorized` | The provided OTP is invalid or has expired. |
| `500 Internal Server Error` | An unexpected server error occurred (e.g., database issues, failure to create a new user record). |

-----

## Email Login API
### POST `/auth/email/login`

This endpoint allows a user to log in with their email and password. It validates user credentials, generates a new access and refresh token pair, and implements a security mechanism to prevent brute-force attacks.

-----

### Request

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/email/login` | Authenticates a user and issues new tokens. |

#### Body

The request body must be a JSON object containing the user's login credentials.

```json
{
  "email": "user@example.com",
  "password": "yourpassword123"
}
```

#### Headers

No special headers are required.

-----

### Security and Rate Limiting

The endpoint employs a Redis-based rate-limiting system to prevent brute-force login attempts.

  * **Failed Attempts Counter**: Each failed login attempt for a specific email address increments a counter stored in Redis.
  * **Account Lockout**: After **5 failed attempts**, the account is temporarily locked. Subsequent login attempts will receive a `429 Too Many Requests` error.
  * **Timeout**: The lockout automatically expires after **20 minutes**, at which point the counter is reset.
  * **Reset on Success**: A successful login clears the failed attempt counter, allowing the user to try again if they've made failed attempts in the past.

-----

### Responses

#### Success

| Status Code | Description |
| :--- | :--- |
| `200 OK` | The login was successful. The response body contains the new access and refresh tokens. |

**Body**

```json
{
  "access_token": "eyJhbGciOiJIUzI1Ni...",
  "refresh_token": "eyJhbGciOiJIUzI1Ni..."
}
```

#### Errors

| Status Code | Description |
| :--- | :--- |
| `400 Bad Request` | The request body is invalid or malformed. |
| `401 Unauthorized` | The user could not be authenticated due to an invalid email or password. |
| `429 Too Many Requests` | The account is locked due to too many failed login attempts. The response includes the remaining lockout time. |
| `500 Internal Server Error` | An unexpected server error occurred (e.g., database connection issues, error validating password). |

-----

## Logout API
### POST `/auth/logout`

This endpoint allows a user to securely log out by invalidating their access and refresh tokens. Both tokens are added to a blacklist, making them unusable for future requests.

-----

### Request

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/logout` | Revokes the current session's tokens and logs the user out. |

#### Headers

This endpoint requires two headers to be provided.

| Header | Example Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <access_token>` | The user's current access token. |
| `X-Refresh-Token` | `Refresh <refresh_token>` | The user's current refresh token. |

#### Body

No request body is required.

-----

### Workflow

1.  **Token Extraction**: The access token and refresh token are extracted from the `Authorization` and `X-Refresh-Token` headers, respectively.
2.  **Token Validation**: Both tokens are validated to ensure they are legitimate and not expired. If a token is invalid, the request is logged and a `500` error is returned.
3.  **Token Revocation**: Upon successful validation, the unique ID (JTI) of both tokens is added to a Redis-based blacklist. The blacklist entries are set to expire at the same time as their corresponding tokens, ensuring a self-cleaning mechanism.
4.  **Client-Side Cleanup**: After a successful logout, the client application is expected to delete the tokens from its local storage.

-----

### Responses

#### Success

| Status Code | Description |
| :--- | :--- |
| `200 OK` | The tokens were successfully revoked and the user is logged out. |

**Body**

```json
{
  "message": "Logged out successfully"
}
```

#### Errors

| Status Code | Description |
| :--- | :--- |
| `400 Bad Request` | The `X-Refresh-Token` header was not provided. |
| `500 Internal Server Error` | An unexpected server error occurred (e.g., an invalid token was provided, or there was a failure to connect to the database). |

-----

## Refresh Token API
### POST `/auth/token/refresh`

This endpoint allows a client to obtain a new access token and refresh token pair using a valid refresh token. This process, known as token rotation, enhances security by invalidating the old refresh token after a successful refresh.

-----

### Request

| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/auth/refresh` | Requests a new pair of access and refresh tokens. |

#### Headers

This endpoint requires a single header.

| Header | Example Value | Description |
|:---|:---|:---|
| `X-Refresh-Token` | `Refresh <refresh_token>` | The user's current refresh token. |

#### Body

No request body is required.

-----

### Workflow

1.  **Token Extraction**: The refresh token is extracted from the `X-Refresh-Token` header.
2.  **Token Validation**: The token is validated to ensure it's a legitimate and active refresh token.
3.  **Blacklist Check**: The token's unique ID (JTI) is checked against a blacklist to ensure it hasn't been used before.
4.  **Token Rotation**: Upon successful validation, the server generates a new access token and a new refresh token. The old refresh token is then immediately added to a Redis-based blacklist, making it unusable for any future requests.
5.  **Session Management**: This process effectively revokes the old refresh token and provides the client with a new one, improving session security by detecting and preventing token reuse.

-----

### Responses

#### Success

| Status Code | Description |
|:---|:---|
| `200 OK` | A new access token and refresh token pair were successfully generated and returned. |

**Body**

```json
{
  "access_token": "eyJhbGciOiJIUzI1Ni...",
  "refresh_token": "eyJhbGciOiJIUzI1Ni..."
}
```

#### Errors

| Status Code | Description |
|:---|:---|
| `400 Bad Request` | The `X-Refresh-Token` header was not provided. |
| `401 Unauthorized` | The refresh token is invalid (e.g., expired, malformed) or has already been used. |
| `500 Internal Server Error` | An unexpected server error occurred (e.g., a database connection failed). |

-----

# KYC APIs: *USER*
### POST `/kyc/user`

This endpoint handles the submission of user KYC (Know Your Customer) information, including personal details and an identification document. The process verifies the user's identity and prevents duplicate submissions.

-----

### Request

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/kyc/user` | Submits KYC information and an identification document. |

#### Body

The request body must be sent as `multipart/form-data`.

| Field | Type | Description |
| :--- | :--- | :--- |
| `email` | `string` | The user's email address (passed as a URL query parameter). |
| `level` | `string` | The user's academic level. |
| `dept` | `string` | The user's academic department. |
| `nin` | `string` | The user's National Identification Number (NIN). |
| `faculty` | `string` | The user's academic faculty. |
| `matric` | `string` | The user's matriculation number. |
| `file` | `file` | The user's NIN document (image or PDF). |

#### Headers

This endpoint requires an `Authorization` header with a valid access token.

| Header | Example Value | Description |
| :--- | :--- | :--- |
| `Authorization` | `Bearer <access_token>` | The user's current access token. |

-----

### Workflow

1.  **Authorization**: The endpoint first verifies that the user is authenticated and that the email provided in the query parameter matches the email in the JWT claims of the access token. Any mismatch is logged as a security event.
2.  **User Status Check**: It checks if a user account exists for the provided email.
3.  **KYC Status Check**: It checks the user's current KYC status.
      * If KYC is already `pending`, `verified`, or `failed` (and a new submission is not allowed), an error is returned.
4.  **Document Upload**: The NIN document (`file`) is extracted from the form data and uploaded to the server's storage system.
5.  **KYC Record Creation**: A new KYC record is created in the database with the provided details and the URL of the uploaded document.

-----

### Responses

#### Success

| Status Code | Description |
| :--- | :--- |
| `200 OK` | The KYC information was successfully uploaded and is now awaiting verification. |

**Body**

```json
{
  "message": "Kyc uploaded successfully"
}
```

#### Errors

| Status Code | Description |
| :--- | :--- |
| `400 Bad Request` | The request is invalid due to a missing query parameter, invalid form data, a non-existent user, or an attempt to resubmit KYC when it's already pending, verified, or has failed (and requires a different action). |
| `401 Unauthorized` | The access token is invalid or the email in the token does not match the email in the request. |
| `500 Internal Server Error` | An unexpected server error occurred (e.g., database connection issues, file upload failures). |