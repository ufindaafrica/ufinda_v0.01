package tasks
import (
	"mime/multipart"
	"io"
	"os"
	"fmt"
	"net/http"
	"time"
	"path/filepath"
)


type FileData struct {
	Filename string
	Content  []byte
}

func SaveFilesToDisk(headers []*multipart.FileHeader) ([]string, error) {
    var paths []string
    
    // Create temp directory if it doesn't exist
    tempDir := "/tmp/media/uploads"
    os.MkdirAll(tempDir, os.ModePerm)

    for _, header := range headers {
        file, err := header.Open()
        if err != nil { return nil, err }
        
        buff := make([]byte, 512)
        file.Read(buff)
        file.Seek(0, io.SeekStart)
        
        if !isAllowedType(http.DetectContentType(buff)) {
            file.Close()
            continue
        }

        // Generate a unique filename to avoid collisions
        uniqueName := fmt.Sprintf("%d-%s", time.Now().UnixNano(), header.Filename)
        dst := filepath.Join(tempDir, uniqueName)

        // Save file to disk
        out, err := os.Create(dst)
        if err != nil {
            file.Close()
            return nil, err
        }
        
        _, err = io.Copy(out, file)
        file.Close()
        out.Close()
        
        if err != nil { return nil, err }
        paths = append(paths, dst)
    }
    return paths, nil
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