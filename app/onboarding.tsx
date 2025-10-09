import { images } from "@/constants/images";
import { Image, ImageBackground, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


export default function Onboarding () {

    return (
        <SafeAreaView>
            <ImageBackground>
                <Image source={images.uFindaText}></Image>
            </ImageBackground>

            <ImageBackground>
                <Image source={images.on1}></Image>
            </ImageBackground>

            <View>
                <Text>Find Affordable Hostels Nearby</Text>
                <Text>Find affordable, safe, and cozy hostels just around the corner, and book your stay in minutes</Text>
            </View>

            <View>
                <Image source={images.blackDot}></Image>
                <Image source={images.dot}></Image>
                <Image source={images.dot}></Image>
            </View>

            <TouchableOpacity>
                <Text>Get Started</Text>
            </TouchableOpacity>

        </SafeAreaView>
    )
}

