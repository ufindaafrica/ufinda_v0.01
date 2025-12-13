import AppHeader from "@/components/appHeader";
import { images } from "@/constants/images";
import { globals } from "@/styles/globals";
import { homeStyles } from "@/styles/home";
import { Image, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";


export default function Shop() {

    return (
        <SafeAreaProvider>
            <SafeAreaView style={globals.homeContainer}>
                <View style={homeStyles.layoutMargin}>
                    <AppHeader shop />
                </View>
                <View style={{ justifyContent: "center", height: "85%", width: "100%", alignItems: "center" }}>
                    <Image source={images.comingSoon} style={{ width: 243, height: 243 }} />
                </View>
            </SafeAreaView>
        </SafeAreaProvider>
    )
}
