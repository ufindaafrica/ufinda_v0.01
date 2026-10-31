# uFinda API Response Standards

All APIs across the uFinda backend strictly adhere to a unified JSON response envelope. Mobile applications should parse responses based on the top-level **`status`** and **`code`** fields.

---

## 1. Universal Response Envelope Schema

### Success Response (`2xx`)
```json
{
  "status": "success",
  "message": "Human-readable description of the outcome",
  "data": { ... }
}

```

### Error Response (`4xx`, `5xx`)

```json
{
  "status": "error",
  "code": "MACHINE_READABLE_ENUM_CODE",
  "message": "User-facing message safe to display in toasts or alerts",
  "data": { ... } // Optional auxiliary data (e.g., payment status payloads)
}

```

---

## 2. Standardized Error Registry

Mobile developers should write switch-cases or condition handlers based on the **`code`** string, *not* the text message.

| Error Code | HTTP Status | Default Message | Description / Mobile Action |
| --- | --- | --- | --- |
| `BAD_REQUEST` | `400` | Invalid request payload. Please check your input. | Sent when JSON binding or validation fails. |
| `USER_NOT_FOUND` | `404` | No account found with this email. Please sign up to continue. | Triggers mobile app navigation to the **Sign Up** screen. |
| `ACCOUNT_ALREADY_EXISTS` | `409` | An account with this email already exists. Please log in. | Triggers mobile app navigation to the **Login** screen. |
| `INVALID_OTP` | `400` | The OTP entered is incorrect. Please check and try again. | Highlights the OTP input box in red for retry. |
| `OTP_EXPIRED` | `400` | Your OTP has expired. Please request a new code. | Enables the **Resend OTP** button. |
| `PAYMENT_REQUIRED` | `402` | An onboarding fee is required to activate your account. | Launches the **Paystack WebView / In-App Browser**. |
| `UNAUTHORIZED` | `401` | Unauthorized access. Please log in again. | Clears local tokens and redirects to Login. |
| `RATE_LIMIT_EXCEEDED` | `429` | Too many attempts. Please wait a moment before trying again. | Displays the wait time left and blocking out requests until rate limit is over
| `SERVER_ERROR` | `500` | An unexpected error occurred. Please try again. | Displays a generic server error toast. |

---
