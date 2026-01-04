package tasks
import (
	"mime/multipart"
	"io"
    "log"
	"net/http"
)


type FileData struct {
	Filename string
	Content  []byte
}

func FilesToBytes(headers []*multipart.FileHeader) []FileData {
	var filesData []FileData

	for _, header := range headers {
		file, err := header.Open()
		if err != nil {
			log.Printf("Failed to open file %s: %v", header.Filename, err)
			continue
		}

		// 1. Sniff the first 512 bytes to verify the ACTUAL content type
		// This prevents someone from renaming "malware.exe" to "photo.jpg"
		buff := make([]byte, 512)
		if _, err := file.Read(buff); err != nil {
			file.Close()
			continue
		}

		// 2. Reset the file pointer so ReadAll gets the entire file content
		if _, err := file.Seek(0, io.SeekStart); err != nil {
			log.Printf("Failed to seek file %s: %v", header.Filename, err)
			file.Close()
			continue
		}

		// 3. Check MIME type against allowed list
		contentType := http.DetectContentType(buff)
		if !isAllowedType(contentType) {
			log.Printf("Security Block: File %s is not a valid media type (%s)", header.Filename, contentType)
			file.Close()
			continue
		}

		// 4. Read file into memory
		data, err := io.ReadAll(file)
		file.Close()
		if err != nil {
			log.Printf("Failed to read file %s: %v", header.Filename, err)
			continue
		}

		filesData = append(filesData, FileData{
			Filename: header.Filename,
			Content:  data,
		})
	}
	return filesData
}

func isAllowedType(mimeType string) bool {
    allowed := map[string]bool{
        "image/jpeg": true,
        "image/png":  true,
        "image/webp": true,
        "video/mp4":  true,
        "video/quicktime": true,
    }
    return allowed[mimeType]
}

