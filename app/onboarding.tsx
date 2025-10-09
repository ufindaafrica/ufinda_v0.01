import { images } from "@/constants/images";
import { onboardingStyles } from "@/styles/onboarding";
import { Image, ImageBackground, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


export default function Onboarding () {

    return (
        <SafeAreaView style={onboardingStyles.container}>
            
            <ImageBackground style={onboardingStyles.logo}>
                <Image source={images.uFindaText}></Image>
            </ImageBackground>

            <ImageBackground>
                <Image source={images.on1}></Image>
            </ImageBackground>

            <View style={onboardingStyles.textView}>
                <Text style={onboardingStyles.header}>Find Affordable Hostels Nearby</Text>
                <Text style={onboardingStyles.regular}>Find affordable, safe, and cozy hostels just around the corner, and book your stay in minutes</Text>
            </View>

            <View style={onboardingStyles.dots}>
                <Image source={images.blackDot}></Image>
                <Image source={images.dot}></Image>
                <Image source={images.dot}></Image>
            </View>

            <TouchableOpacity style={onboardingStyles.button}>
                <Text style={onboardingStyles.buttonText}>Get Started</Text>
            </TouchableOpacity>

        </SafeAreaView>
    )
}

