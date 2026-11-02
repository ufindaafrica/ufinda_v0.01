## Base URL
The base URL for all API requests:

| Environment | URL |
| :--- | :--- |
| **Test** | `https://ufinda-v0-01.onrender.com` |
| **Production** | `https://ufinda-v0-01-2prv.onrender.com` |
| **Local Dev** | `http://localhost:8080` |

----

## Confirm User Booking Fee API

### POST `[BASE_URL]/payment/booking-fee`

This endpoint verifies a student's booking fee payment transaction server-side against Paystack using the transaction reference. Upon successful verification, it activates the user's booking fee record in the database, generates authentication JWT tokens, and fully unlocks the user account.

---

### Request

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `[BASE_URL]/payment/booking-fee` | Verifies a Paystack payment reference and activates user onboarding. |

#### Body

```json
{
  "user_id": "usr-895659",
  "reference": "T1234567890abcdef"
}

```

#### Headers

* `Content-Type: application/json`

---

### Workflow

1. **Input Validation**: The endpoint binds and validates the JSON request body ensuring `reference` and `user_id` are provided. If invalid, it returns a `BAD_REQUEST` error (`400`).
2. **User Lookup**: It retrieves the user record from the database using the provided `user_id`. If not found, it returns a `USER_NOT_FOUND` error (`404`).
3. **Paystack Verification Request**: It makes a secure server-side `GET` request to the Paystack API (`/transaction/verify/{reference}`) using the secret key to verify the transaction status.
4. **Transaction Status Confirmation**: It checks the Paystack response to confirm that the transaction status is genuinely successful (`success`). If declined or failed, it returns a `BAD_REQUEST` error (`400`).
5. **Booking Fee Activation**: It constructs the booking fee record with the verified amount (in kobo) and updates the payment database (`ActivateBookingFee`).
6. **Token Generation & Success Response**: It generates JWT access and refresh tokens and returns them along with `is_paid: true` and user metadata (`200 OK`).

---

### Responses

All responses follow the unified envelope standard (See [RESPONSES.md](https://github.com/ufindaafrica/ufinda_v0.01/blob/backend-devt/readme/RESPONSES.md)).

#### Success (`200 OK`) — Booking Fee Confirmed & User Activated

```json
{
  "status": "success",
  "message": "Booking fee confirmed successfully",
  "data": {
    "is_paid": true,
    "access_token": "eyJhbGciOiJIUzI1Ni...",
    "refresh_token": "eyJhbGciOiJIUzI1Ni...",
    "id": "usr-895659",
    "role": "user"
  }
}

```

#### Error Responses

| HTTP Status | Error `code` | Default Message | Scenario |
| --- | --- | --- | --- |
| `400 Bad Request` | `BAD_REQUEST` | Invalid request payload. 'reference' and 'user_id' are required. | Malformed JSON or missing required fields. |
| `400 Bad Request` | `BAD_REQUEST` | Transaction verification failed or payment was not successful. | Paystack verification failed, invalid reference, or payment declined. |
| `404 Not Found` | `USER_NOT_FOUND` | No account found with this email. Please sign up to continue. | User ID does not exist in the database. |
| `500 Internal Server Error` | `SERVER_ERROR` | An unexpected error occurred. Please try again. | Paystack network failure, JSON decoding error, database activation failure, or token generation error. |