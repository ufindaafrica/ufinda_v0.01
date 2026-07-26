// SplashScreen.preventAutoHideAsync()

import { Roboto_400Regular, Roboto_700Bold, useFonts as useRobotoFonts } from "@expo-google-fonts/roboto";
import { router, SplashScreen } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import Onboarding from "./onboarding";
import Splash from "./splash";

export default function Index() {

  const [splashScreen, setSplashScreen] = useState(true)
  const [firstOpen, setFirstOpen] = useState(true)
  const [appReady, setAppReady] = useState(false)

  const [robotoFontsLoaded] = useRobotoFonts({
    Roboto_700Bold,
    Roboto_400Regular
  })

  useEffect(() => {

    const initOnboarding = async () => {

      const storedFirstOpen = await SecureStore.getItemAsync("firstOpen")

      if (storedFirstOpen == null) {
        await SecureStore.setItemAsync("firstOpen", "false")
      } else {
        setFirstOpen(false)
      }

      setAppReady(true)

      setTimeout(() => {
        setSplashScreen(false)
      }, 2000)

    }

    initOnboarding();

  }, []);

  useEffect(() => {
    if (robotoFontsLoaded && appReady) SplashScreen.hideAsync()
  }, [robotoFontsLoaded, appReady])

  useEffect(() => {
    const navigate = async () => {
      if (!splashScreen && firstOpen === false) {
        const auth = await SecureStore.getItemAsync('ACCESS_TOKEN')
        const mode = await SecureStore.getItemAsync('ROLE')
        if (auth == null) {
          console.log("auth null")
          router.replace("/auth/login")
          // router.replace("/auth/vendorOtp")
          // router.replace("/(tabs)/profile")
          // router.replace("/(vendor)/profile")
        } else {
          if (mode === "user") router.replace("/(tabs)/home")
          else router.replace("/(vendor)/dashboard")
        }
      }
    }

    navigate()
  }, [splashScreen, firstOpen]);


  if (!robotoFontsLoaded || firstOpen === null) return null


  if (splashScreen) return <Splash />
  if (firstOpen) return <Onboarding />

}

// firstOpen? go to onboarding which goes to sign up
// subsequentOpen but not signedIn? go to login which has a link to sign up just in case
