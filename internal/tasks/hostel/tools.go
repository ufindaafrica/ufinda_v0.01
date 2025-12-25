package hosteltasks



const (
	TypeHostelMediaUpload = "hostel:media:upload"
)


// defines the data for the background media upload task.
type HostelMediaUploadPayload struct {
	HostelID       string
	VendorID 	   string
	ImagePaths []string
	VideoPaths []string
}

