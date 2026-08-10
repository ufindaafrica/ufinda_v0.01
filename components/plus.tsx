import { images } from "@/constants/images";
import { dashboardStyles, plusVStyles } from "@/styles/dashboard";
import { router } from "expo-router";
import { Image, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";


export default function Plus() {

    const insets = useSafeAreaInsets()
    const styles = plusVStyles(insets)

    return (
        <TouchableOpacity style={styles.plusV} onPress={() => router.push("/vendorPages/newHostel")}>
            <Image source={images.plus} style={dashboardStyles.plusImg} />
        </TouchableOpacity>
    )
}
