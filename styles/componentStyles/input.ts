import { StyleSheet } from "react-native";
import { fonts } from "../globals";


export const inputStyles = StyleSheet.create({

    gen: {
        fontFamily: fonts.regular,
        width: "100%"
    },

    genIcon: {
        width: "90%"
    },

    inputV: {
        width: "100%",
        borderWidth: 1,
        borderRadius: 10,
        color: "#008000",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingRight: 5
    },

    focusedInputBox: {
        borderColor: "#008000"
    },

    label: {
        fontSize: 16,
        fontFamily: fonts.regular,
        paddingBottom: 3
    },

    invalidInputBox: {
        borderColor: "#bf0000"
    },

    icon: {
        height: 20,
        width: 20
    }

})
