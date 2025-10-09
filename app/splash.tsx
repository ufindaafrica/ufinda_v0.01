import { splashStyle } from "@/styles/splash";
import { Image, ImageBackground, Text, View } from "react-native";
import { images } from "../constants/images";

export default function Splash() {
    return (
        <View style={splashStyle.mainview}>
            <ImageBackground style={splashStyle.logoview}>
                <Image source={images.logo}></Image>
            </ImageBackground>
        </View>
    )
}
