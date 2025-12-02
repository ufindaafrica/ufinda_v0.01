import { images } from "@/constants/images";
import { dashboardStyles } from "@/styles/dashboard";
import { router } from "expo-router";
import { Image, TouchableOpacity } from "react-native";


export default function Plus() {

    return (
        <TouchableOpacity style={dashboardStyles.plusV} onPress={() => router.push("/vendorPages/newHostel")}>
            <Image source={images.plus} style={dashboardStyles.plusImg} />
        </TouchableOpacity>
    )
}
