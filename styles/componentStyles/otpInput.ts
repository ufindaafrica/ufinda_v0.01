import { StyleSheet } from "react-native";
import { fonts } from "../globals";
import { scale, verticalScale } from "@/deps/scale";


export const otpInputStyles = StyleSheet.create({
    main: {
        height: scale(44),
        width: scale(44),
        borderWidth: 1,
        borderColor: "#c7c7cc",
        borderRadius: 8,
        textAlign: "center",
        textAlignVertical: "center",
        justifyContent: "center",
        alignContent: "center",
        alignItems: "center",
        color: "#000000"
    },

    focusedMain: {
        borderWidth: 1.5,
        borderColor: "#101010"
    }

})
