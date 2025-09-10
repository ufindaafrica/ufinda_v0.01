package hostel

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

// MaxBytesMiddleware creates a middleware to limit request body size.
func MaxBytesMiddleware(maxBytes int64) gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxBytes)
        c.Next()
    }
}
