package db

import (
	"time"
)

type User struct {
	ID string `json:"id,omitempty"`
	FirebaseID string `json:"firebase_id,omitempty"`
	FirstName string `json:"first_name" binding:"required"`
	LastName string `json:"last_name" binding:"required"`
	Email string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
	Phone string `json:"phone" binding:"required"`
	AboutMe string `json:"about_me"`
	ProfileImg string `json:"profile_img"`
	AuthProvider string `json:"auth_provider"`
	CreatedAt time.Time `json:"created_at,omitempty"`
	UpdatedAt time.Time `json:"updated_at,omitempty"`
}

type PendingUser struct {
	ID string `json:"id,omitempty"`
	Email string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
	FirstName string `json:"first_name" binding:"required"`
	LastName string `json:"last_name" binding:"required"`
	Phone string `json:"phone" binding:"required"`
	OTP string `json:"otp" binding:"required"`
	CreatedAt time.Time `json:"created_at,omitempty"`
	ExpiresAt time.Time `json:"expire_at,omitempty"`
}

type UserKYC struct {
	ID string `json:"id,omitempty"`
	UserID string `json:"user_id" binding:"required"`
	NIN string `json:"nin" binding:"required"`
	NINImg string `json:"nin_img" binding:"required"`
	Level string `json:"level" binding:"required"`
	Faculty string `json:"faculty" binding:"required"`
	Dept string `json:"dept" binding:"required"`
	Matric string `json:"matric" binding:"required"`
	Status string `json:"status,omitempty"`
	CreatedAt time.Time `json:"created_at,omitempty"`
	UpdatedAt time.Time `json:"updated_at,omitempty"`
}

type SecurityLog struct {
	ID string `json:"id,omitempty"`
	UserID string `json:"user_id"`
	Log string `json:"log" binding:"required"`
	Level string `json:"level" binding:"required"`
	CreatedAt string `json:"created_at,omitempty"`
}

type Hostel strunt {
	ID string `json:"id" binding:"required"`
	TotalPrice bigint `json:"total_price" binding:"required"`
	Location string `json:"location" binding:"required"`
	RoomType string `json:"room_type" binding:"required"`
	RentPerYear string `json:"rent_per_year" binding:"required"`
	LandlordResides bool `json:"landlord_resides" binding:"required"`
	TotalHostelRooms int `json:"total_hostel_rooms"`
	RoommatesAllowed bool `json:"roommates_allowed" binding:"required"`
	KitchenAccess string `json:"kitchen_access" binding:"required"`
	ToiletAccess bool `json:"toilet_access" binding:"required"`
	Description string `json:"description" binding:"required"`
	CreatedAt time.Time `json:"created_at" binding:"required"`
	UpdatedAt time.Time `json:"updated_at" binding:"required"`
}