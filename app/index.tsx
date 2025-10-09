import { useEffect, useState } from "react";
import Splash from "./splash";
import { Text } from "react-native";
import Home from "./(tabs)/home";

export default function Index() {
  
  const [splashScreen, setSplashScreen] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setSplashScreen(false)
    }, 2000)
  }, []);

  return (
    (splashScreen) ? <Splash /> : <Home />
  );
}
