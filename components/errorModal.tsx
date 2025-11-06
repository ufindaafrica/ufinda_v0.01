import { images } from "@/constants/images";
import { errorModalStyles } from "@/styles/componentStyles/errorModal";
import { Image, Text, TouchableOpacity, View } from "react-native";
import Select from "./select";
import { roboto } from "@/styles/globals";

type ErrorModalProps = {
    text: string,
    errorFun: (value: any) => void,
    correct?: boolean
}

export default function ErrorModal({ text, errorFun, correct }: ErrorModalProps) {

    return (
        <View style={errorModalStyles.mainV}>
            <View style={errorModalStyles.main}>
                <Image source={correct ? images.correctIcon : images.errorIcon} style={errorModalStyles.icon} />
                <Text style={[errorModalStyles.text, roboto.bodyMedium]}>{text}</Text>
                <View style={errorModalStyles.buttonV}>
                    <Select text="Okay" selected selectFun={errorFun} />
                </View>
            </View>
        </View>
    )
}
