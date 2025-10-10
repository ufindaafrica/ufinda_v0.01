import { useEffect, useState } from "react";
import Splash from "./splash";
import Home from "./(tabs)/home";
import * as SecureStore from "expo-secure-store";
import Onboarding from "./onboarding";
import { Inter_300Light, Inter_400Regular, Inter_700Bold, useFonts } from "@expo-google-fonts/inter";

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

  if (!fontsLoaded || firstOpen === null) return null

  return (
    (splashScreen) ? <Splash /> : (firstOpen) ? <Onboarding /> : <Home />
  );
}
