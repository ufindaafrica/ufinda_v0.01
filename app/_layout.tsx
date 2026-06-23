import { WebSocketProvider } from "@/contexts/chatSocket"
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler"
import * as Notifications from "expo-notifications"
import { usePostJobStore } from "@/stores/postJobStore"
import { resumePendingJobIfAny } from "@/services/postHostelJob"
import { router } from "expo-router"
import { useEffect } from "react"
import JobStatusBar from "@/components/jobStatusBar";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true
    })
  })

export default function RootLayout() {

  const { status, progress, errorText, reset } = usePostJobStore()

  useEffect(() => { resumePendingJobIfAny() }, [])

  return <WebSocketProvider>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{ headerShown: false }}
      />
      <JobStatusBar
    status={status}
    progress={progress}
    errorText={errorText}
    onDismiss={() => { reset(); if (status === "success") router.replace("/dashboard") }}
/>
    </GestureHandlerRootView>
  </WebSocketProvider>
}
