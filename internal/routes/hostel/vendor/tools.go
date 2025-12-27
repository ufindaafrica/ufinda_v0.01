package vendorhostel

const MsgServerError = "An unexpected error occurred. Please try again."

type UpdateHostelRequest struct {
    TotalPrice       *int64  `form:"total_price" binding:"omitempty,gt=0"`
    RentPerYear      *int64  `form:"rent_per_year" binding:"omitempty,gt=0"`
    TotalHostelRooms *int    `form:"total_hostel_rooms" binding:"omitempty,gt=0"`
    LandlordResides  *string `form:"landlord_resides" binding:"omitempty,oneof=yes no"`
    RoommatesAllowed *string `form:"roommates_allowed" binding:"omitempty,oneof=allowed 'not allowed'"`
    Description      *string `form:"description" binding:"omitempty,min=10"`
    RoomType         *string `form:"room_type" binding:"omitempty"`
}