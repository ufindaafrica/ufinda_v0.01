import { useFonts as useRobotoFonts, Roboto_700Bold, Roboto_400Regular } from "@expo-google-fonts/roboto"
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import Onboarding from "./onboarding";
import Splash from "./splash";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Index() {

  const [splashScreen, setSplashScreen] = useState(true)
  const [firstOpen, setFirstOpen] = useState(true)

  const [robotoFontsLoaded] = useRobotoFonts({
    Roboto_700Bold,
    Roboto_400Regular
  })

  useEffect(() => {

    const initOnboarding = async () => {

      const storedFirstOpen = await AsyncStorage.getItem("firstOpen")

      if (storedFirstOpen == null) {
        await AsyncStorage.setItem("firstOpen", "false")
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
    const navigate = async () => {
      if (!splashScreen && firstOpen === false) {
        const auth = await SecureStore.getItemAsync('AUTH')
        const mode = await SecureStore.getItemAsync('MODE')
        if (auth == null) {
          router.replace("/auth/login")
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
