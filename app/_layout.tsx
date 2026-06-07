import { WebSocketProvider } from "@/contexts/chatSocket"
import { Stack } from "expo-router";
import { GestureHandlerRootView} from "react-native-gesture-handler"
import * as Notifications from "expo-notifications"

export default function RootLayout() {

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true
    })
  })

  return <WebSocketProvider>
    <GestureHandlerRootView style={{ flex: 1}}>
    <Stack
      screenOptions={{ headerShown: false }}
    />
    </GestureHandlerRootView>
    </WebSocketProvider>
}
