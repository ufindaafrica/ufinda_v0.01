import { WebSocketProvider } from "@/contexts/chatSocket"
import { Stack } from "expo-router";
import { GestureHandlerRootView} from "react-native-gesture-handler"

export default function RootLayout() {

  return <WebSocketProvider>
    <GestureHandlerRootView style={{ flex: 1}}>
    <Stack
      screenOptions={{ headerShown: false }}
    />
    </GestureHandlerRootView>
    </WebSocketProvider>
}
