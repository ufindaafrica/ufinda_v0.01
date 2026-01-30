package metrics

type RatingInfo struct {
	Review string `json:"review,omitempty"`
	Score int `json:"score" binding:"required,min=1,max=5"`
	VendorID string `json:"vendor_id" binding:"required"`
}


const MsgServerError = "An unexpected error occurred. Please try again."