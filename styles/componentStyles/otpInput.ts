import { StyleSheet } from "react-native";
import { fonts } from "../globals";


export const otpInputStyles = StyleSheet.create({
    main: {
        height: 50,
        width: 50,
        borderWidth: 1,
        borderColor: "#c7c7cc",
        borderRadius: 10,
        fontSize: 32,
        textAlign: "center",
        textAlignVertical: "center",
        justifyContent: "center",
        alignContent: "center",
        alignItems: "center",
        fontFamily: fonts.regular
    },

    focusedMain: {
        borderWidth: 1.5,
        borderColor: "#b3b3b3"
    }

})
