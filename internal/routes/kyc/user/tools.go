package userkyc
import (
	"github.com/oladev/ufinda_v0.01/internal/db"
)

const MsgServerError = "An unexpected error occurred. Please try again."

type UserKYCRequest struct {
    Level      *string            `json:"level"`
    Dept       *string            `json:"dept"`
    Faculty    *string            `json:"faculty"`
    Matric     *string            `json:"matric"`
    AboutMe    *string            `json:"about_me"`
    Address *string `json:"address"`
    ProfileImg *db.UploadedFile `json:"profile_img"` 
}