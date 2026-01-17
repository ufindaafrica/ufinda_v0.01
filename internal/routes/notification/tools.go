package notif

type pushTokenReq struct {
	DeviceToken string `json:"device_token" binding:"required"`
	DeviceOS string `json:"device_os"`
}

const MsgServerError = "An unexpected error occurred. Please try again."
