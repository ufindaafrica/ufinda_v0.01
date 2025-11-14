import { images } from "@/constants/images";
import { dashboardStyles } from "@/styles/dashboard";
import { Image, TouchableOpacity } from "react-native";


export default function Plus() {

    return (
        <TouchableOpacity style={dashboardStyles.plusV}>
            <Image source={images.plus} style={dashboardStyles.plusImg} />
        </TouchableOpacity>
    )
}
