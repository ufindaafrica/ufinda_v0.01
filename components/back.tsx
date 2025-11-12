import { Image, TouchableOpacity } from "react-native"
import { images } from "@/constants/images"
import { backStyles } from "@/styles/componentStyles/back"

type BackArrowProps = {
    backFun: (value: any) => void,
    large?: boolean
}

export default function BackArrow({ backFun, large }: BackArrowProps) {

    return (
        <TouchableOpacity onPress={backFun} style={backStyles.arrowV}>
            <Image source={images.arrowBack} style={[large ? backStyles.large : backStyles.img]} />
        </TouchableOpacity>
    )
}
