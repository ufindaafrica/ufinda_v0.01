import { Inter_300Light, Inter_400Regular, Inter_700Bold, useFonts } from "@expo-google-fonts/inter";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import Otp from "./auth/otp";
import Onboarding from "./onboarding";
import Splash from "./splash";
import Mode from "./auth/mode";

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
        router.replace("/auth/mode")
        // router.replace("/auth/otp")
        // router.replace("/auth/login")
        // router.replace("/(tabs)/home")
        // router.replace("/auth/pic")
      } else {
        // router.replace("/(tabs)/home")
        // router.replace("/auth/mode")
      }
    }
  }, [splashScreen, firstOpen]);

  
  if (!fontsLoaded || firstOpen === null) return null

  
  if (splashScreen) return <Splash />
  if (firstOpen) return <Onboarding />
  // return <Mode />
  // return <Otp/>

}

// firstOpen? go to onboarding which goes to sign up
// subsequentOpen but not signedIn? go to login which has a link to sign up just in case
