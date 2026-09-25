
package main
import (
	"github.com/oladev/ufinda_v0.01/internal/db/notification"
	"fmt"
)

func main() {
	token := "ExponentPushToken[gWCHRfGt7WlmjF-6ql5b0X]"
	title := "ufinda Test"
	body := "Hi Ella, this is a test msg body from Ola"
	chatID := "azcfojclrfldedfeiufei"
	if err := notifdb.SendPushNotification(token, title, body, chatID); err != nil {
		fmt.Printf("error sending notification: %v/n", err)
	}
	
}