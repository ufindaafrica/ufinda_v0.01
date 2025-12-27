package hosteltasks
import (
	"github.com/oladev/ufinda_v0.01/internal/tasks"
)


const (
	TypeHostelMediaUpload = "hostel:media:upload"
)


// defines the data for the background media upload task.
type HostelMediaUploadPayload struct {
	HostelID       string
	VendorID 	   string
	ImageFilesData []tasks.FileData
	VideoFilesData []tasks.FileData
}

