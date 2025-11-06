import { StyleSheet } from "react-native";
import { fonts } from "../globals";


export const inputStyles = StyleSheet.create({

    gen: {
        width: "100%"
    },

    genIcon: {
        width: "90%"
    },

    inputV: {
        width: "100%",
        borderWidth: 1,
        borderColor: "#c7c7cc",
        borderRadius: 10,
        color: "#006000",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingRight: 5,
        height: 44
    },

    focusedInputBox: {
        borderColor: "#006000"
    },

    label: {
        paddingBottom: 4
    },

    invalidInputBox: {
        borderColor: "#bf0000"
    },

    icon: {
        height: 20,
        width: 20
    },

    txtColor: {
        color: "#000000"
    },

    invalidTxtColor: {
        color: "#bf0000"
    },

    validTxtColor: {
        color: "#008000"
    }

})
