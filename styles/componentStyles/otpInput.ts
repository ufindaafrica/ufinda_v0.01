import { StyleSheet } from "react-native";
import { fonts } from "../globals";


export const otpInputStyles = StyleSheet.create({
    main: {
        height: 44,
        width: 44,
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
