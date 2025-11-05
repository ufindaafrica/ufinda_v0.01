import { Image, TouchableOpacity } from "react-native"
import { images } from "@/constants/images"
import { backStyles } from "@/styles/componentStyles/back"

type BackArrowProps = {
    backFun: (value: any) => void
}

export default function BackArrow({ backFun }: BackArrowProps) {

    return (
        <TouchableOpacity onPress={backFun} style={backStyles.arrowV}>
            <Image source={images.arrowBack} style={backStyles.img} />
        </TouchableOpacity>
    )
}
