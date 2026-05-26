import { images } from "@/constants/images";
import { appHeaderStyles } from "@/styles/componentStyles/appHeader";
import { roboto } from "@/styles/globals";
import { router } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

type AppHeaderProps = {
    hostel?: boolean,
    shop?: boolean
}

export default function AppHeader({ hostel, shop } : AppHeaderProps) {
    return (
        <View style={appHeaderStyles.main}>
            <TouchableOpacity>
                <Image source={images.menu} style={appHeaderStyles.img} />
            </TouchableOpacity>

            <View style={appHeaderStyles.textV}>
                <TouchableOpacity onPress={() => router.push("/(tabs)/home")} style={[hostel && appHeaderStyles.selectedTextTouch, appHeaderStyles.textTouch]}>
                    <Text style={[appHeaderStyles.text, hostel && appHeaderStyles.selectedText, roboto.bodySmallBold]}>Hostel</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push("/shop/shop")} style={[shop && appHeaderStyles.selectedTextTouch, appHeaderStyles.textTouch]}>
                    <Text style={[appHeaderStyles.text, shop && appHeaderStyles.selectedText, roboto.bodySmallBold]}>Shop</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity>
                <Image source={images.bell} style={appHeaderStyles.img} />
            </TouchableOpacity>
        </View>
    )
}
