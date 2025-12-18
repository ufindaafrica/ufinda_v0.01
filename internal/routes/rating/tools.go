package rating

type RatingInfo struct {
	Review string `json:"review,omitempty"`
	Score int `json:"score" binding:"required,min=1,max=5"`
	VendorID string `json:"vendor_id" binding:"required"`
}