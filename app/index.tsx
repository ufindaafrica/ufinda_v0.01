import { useEffect, useState } from "react";
import Splash from "./splash";
import * as SecureStore from "expo-secure-store";
import Onboarding from "./onboarding";
import { Inter_300Light, Inter_400Regular, Inter_700Bold, useFonts } from "@expo-google-fonts/inter";
import { router } from "expo-router";
import Mode from "./auth/mode";
import Otp from "./auth/otp";

export default function Index() {

  const [splashScreen, setSplashScreen] = useState(true)
  const [firstOpen, setFirstOpen] = useState(true)

  const [fontsLoaded] = useFonts({
    Inter_700Bold,
    Inter_400Regular,
    Inter_300Light,
  })

  useEffect(() => {

    const initOnboarding = async () => {

      const storedFirstOpen = await SecureStore.getItemAsync("firstOpen")

      if (storedFirstOpen == null) {
        await SecureStore.setItemAsync("firstOpen", "false")
      } else {
        setFirstOpen(false)
      }

      setTimeout(() => {
        setSplashScreen(false)
      }, 2000)

    }

    initOnboarding();

  }, []);

  useEffect(() => {
    if (!splashScreen && firstOpen === false) {
      if (SecureStore.getItem("AUTH") == null) {
        // router.replace("/auth/mode")
        router.replace("/auth/otp")
      } else {
        router.replace("/(tabs)/home")
      }
    }
  }, [splashScreen, firstOpen]);

  
  if (!fontsLoaded || firstOpen === null) return null

  
  if (splashScreen) return <Splash />
  if (firstOpen) return <Onboarding />
  // return <Mode />
  return <Otp/>

}
