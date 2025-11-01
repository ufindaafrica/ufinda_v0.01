import { images } from "@/constants/images";
import { errorModalStyles } from "@/styles/componentStyles/errorModal";
import { Image, Text, TouchableOpacity, View } from "react-native";
import Select from "./select";

type ErrorModalProps = {
    text: string,
    errorFun: (value: any) => void,
    correct?: boolean
}

export default function ErrorModal({ text, errorFun, correct }: ErrorModalProps) {

    return (
        <View style={errorModalStyles.mainV}>
            <View style={errorModalStyles.main}>
                <Image source={correct ? images.correctIcon : images.errorIcon} />
                <Text style={errorModalStyles.text}>{text}</Text>
                <View style={errorModalStyles.buttonV}>
                    <Select text="Okay" selected selectFun={errorFun} />
                </View>
            </View>
        </View>
    )
}
