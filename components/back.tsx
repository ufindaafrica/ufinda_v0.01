import { Image } from "react-native"
import { images } from "@/constants/images"
import { backStyles } from "@/styles/componentStyles/back"


export default function BackArrow() {

    return (
        <Image source={images.arrowBack} style={backStyles.img} />
    )
}
