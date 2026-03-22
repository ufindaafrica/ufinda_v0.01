package vendorhostel
import (
    "github.com/oladev/ufinda_v0.01/internal/db"
	"github.com/go-playground/validator/v10"
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
	AvailableRooms *int 				`json:"available_rooms" binding:"required,gt=0"`
	Location         string             `json:"location" binding:"required"`
	Description      string             `json:"description"`
	LandlordResides  string             `json:"landlord_resides" binding:"required"`
	PowerSupply		 string `json:"power_supply" binding:"required"`
	RoomType         string             `json:"room_type" binding:"required"`
	RoommatesAllowed string             `json:"roommates_allowed" binding:"required"`
	KitchenAccess    string             `json:"kitchen_access" binding:"required"`
	ToiletAccess     string             `json:"toilet_access" binding:"required"`
	Images           []db.UploadedFile `json:"images" binding:"required,min=1,max=3"`
	Videos           []db.UploadedFile `json:"videos" binding:"max=1"`
	GeoLocation *db.GeoLocationField 	`json:"geolocation,omitempty"`
}



func getErrorMessage(fe validator.FieldError) string {
    switch fe.Field() {
    case "Images":
        return "At least one hostel image is required."
    case "PowerSupply":
        return "Please provide a yes or no for power supply."
    case "LandlordResides":
        return "Please provide a yes or no if landlord resides."
	case "RoommatesAllowed":
		return "Please provide a yes or no if roommates is allowed"
	case "TotalHostelRooms":
		return "Please a valid count of total hostel rooms"
	case "AvailableRooms":
		return "Please a valid count of available rooms"
    }		
    return "Invalid value for " + fe.Field()
}