package userhostel

// import (
// 	"github.com/oladev/ufinda_v0.01/internal/db"
// )

// type HostelReturn struct {
// 	ID               string    `json:"id,omitempty"`
// 	VendorID string `json:"vendor_id"`
// 	TotalPrice       int64    `json:"total_price" binding:"required"`
// 	Location         string    `json:"location" binding:"required"`
// 	RoomType         string    `json:"room_type" binding:"required"`
// 	RentPerYear      int64    `json:"rent_per_year" binding:"required"`
// 	LandlordResides  string      `json:"landlord_resides" binding:"required"`
// 	TotalHostelRooms int       `json:"total_hostel_rooms"`
// 	RoommatesAllowed string      `json:"roommates_allowed" binding:"required"`
// 	KitchenAccess    string    `json:"kitchen_access" binding:"required"`
// 	ToiletAccess     string      `json:"toilet_access" binding:"required"`
//     HostelImages     []db.UploadedFile  `json:"hostel_images"`
//     HostelVideos     []db.UploadedFile  `json:"hostel_videos"`
// 	Description      string    `json:"description"`
// }