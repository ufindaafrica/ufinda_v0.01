package vendorhostel
import (
    "github.com/oladev/ufinda_v0.01/internal/db"
)

const MsgServerError = "An unexpected error occurred. Please try again."

type UpdateHostelRequest struct {
    TotalPrice       *int64  `json:"total_price" binding:"omitempty,gt=0"`
    RentPerYear      *int64  `json:"rent_per_year" binding:"omitempty,gt=0"`
    TotalHostelRooms *int    `json:"total_hostel_rooms" binding:"omitempty,gt=0"`
    LandlordResides  *string `json:"landlord_resides" binding:"omitempty"`
    RoommatesAllowed *string `json:"roommates_allowed" binding:"omitempty"`
	PowerSupply		 *string `json:"power_supply"`
    Description      *string `json:"description" binding:"omitempty"`
    RoomType         *string `json:"room_type" binding:"omitempty"`
}

type CreateHostelRequest struct {
	Title            string             `json:"title" binding:"required,min=5"`
	TotalPrice       int64              `json:"total_price" binding:"required,gt=0"`
	RentPerYear      int64              `json:"rent_per_year" binding:"required,gt=0"`
	TotalHostelRooms int                `json:"total_hostel_rooms" binding:"required,gt=0"`
	AvailableRooms int 				`json:"available_rooms"`
	Location         string             `json:"location" binding:"required"`
	Description      string             `json:"description"`
	LandlordResides  string             `json:"landlord_resides"`
	PowerSupply		 string `json:"power_supply"`
	RoomType         string             `json:"room_type"`
	RoommatesAllowed string             `json:"roommates_allowed"`
	KitchenAccess    string             `json:"kitchen_access"`
	ToiletAccess     string             `json:"toilet_access"`
	Images           []db.UploadedFile `json:"images" binding:"required,min=1,max=3"`
	Videos           []db.UploadedFile `json:"videos" binding:"max=1"`
	GeoLocation *db.GeoLocationField 	`json:"geolocation,omitempty"`
}