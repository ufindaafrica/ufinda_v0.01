package userproduct

type ProductInfo struct {
	SellerID string `json:"seller_id"`
	Title string `json:"title`
	Price int64 `json:"price"`
	Condition string `json:"condition"`
	IsAvailable bool `json:"is_available"`
}