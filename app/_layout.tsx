import JobStatusBar from "@/components/jobStatusBar";
import { WebSocketProvider } from "@/contexts/chatSocket";
import { resumePendingJobIfAny } from "@/services/postHostelJob";
import { usePostJobStore } from "@/stores/postJobStore";
import * as Notifications from "expo-notifications";
import { router, Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

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
    onDismiss={() => { reset(); if (status === "success") {router.replace("/dashboard")} else { if (errorText.includes("vendor not verified")) router.replace("/auth/vendorOtp")}  }}
/>
    </GestureHandlerRootView>
  </WebSocketProvider>
}
