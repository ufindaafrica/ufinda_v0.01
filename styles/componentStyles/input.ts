import { StyleSheet } from "react-native";
import { fonts } from "../globals";


export const inputStyles = StyleSheet.create({

    gen: {
        fontFamily: fonts.regular
    },

    inputBox: {
        width: "100%",
        borderWidth: 1,
        borderRadius: 10,
        color: "#008000",
    },

    focusedInputBox: {
        borderColor: "#008000"
    },

    label: {
        fontSize: 16,
        fontFamily: fonts.regular,
        paddingBottom: 3
    },

})
