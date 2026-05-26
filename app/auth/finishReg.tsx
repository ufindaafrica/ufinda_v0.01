import { images } from "@/constants/images";
import { roboto } from "@/styles/globals";
import { picStyles } from "@/styles/pic";
import { router } from "expo-router";
import { getItemAsync } from "@/deps/secureStorage";
import { useEffect } from "react";
import { Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FinishReg() {

    useEffect(() => {
        const getMode = async () => {
            const mode = await getItemAsync("MODE")

            setTimeout(() => {
                if (mode === "vendor") router.push("/(vendor)/dashboard")
                else router.replace("/home")
            }, 3000)
        }

        getMode()

    }, [])

    return (
        <SafeAreaView>
            <View style={[picStyles.completeImgV, picStyles.imgVExtra]}>
                <Image source={images.largeCheck} style={picStyles.checkImg} />
            </View>

            <View style={picStyles.completeHeaderV}>
                <Text style={[picStyles.centerText, roboto.titleMediumBold]}>Profile Complete</Text>
                <View style={picStyles.pTextV}>
                    <Text style={[picStyles.pText, picStyles.centerText, roboto.bodyLarge, picStyles.paddingHorizontal]}>Your account has been created and profile completed</Text>
                </View>
            </View>
        </SafeAreaView>
    )
}
