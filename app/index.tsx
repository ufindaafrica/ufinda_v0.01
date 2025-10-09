import { useEffect, useState } from "react";
import Splash from "./splash";
import Home from "./(tabs)/home";
import * as SecureStore from "expo-secure-store"
import Onboarding from "./onboarding";
import { Roboto_300Light, Roboto_400Regular, Roboto_700Bold, useFonts } from "@expo-google-fonts/roboto"

export default function Index() {

  const [splashScreen, setSplashScreen] = useState(true)
  const [firstOpen, setFirstOpen] = useState(true)
  const storedFirstOpen = SecureStore.getItem("firstOpen")

  const [fontsLoaded] = useFonts({
    Roboto_400Regular,
    Roboto_700Bold,
    Roboto_300Light
  })

  useEffect(() => {

    if (storedFirstOpen == null) {
      SecureStore.setItem("firstOpen", "false")
    } else {
      setFirstOpen(false)
    }

    setTimeout(() => {
      setSplashScreen(false)
    }, 2000)
  }, []);

  return (
    // (splashScreen) ? <Splash /> : (firstOpen) ? <Onboarding /> : <Home />

    <Onboarding />
  );
}
