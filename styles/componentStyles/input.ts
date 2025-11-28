import { StyleSheet } from "react-native";
import { fonts } from "../globals";
import { moderateScale, scale, verticalScale } from "@/deps/scale";


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
        paddingRight: moderateScale(5),
        height: verticalScale(44)
    },

    focusedInputBox: {
        borderColor: "#006000"
    },

    label: {
        paddingBottom: moderateScale(4)
    },

    noLabel: {
        paddingBottom: 0,
        display: "none"
    },

    invalidInputBox: {
        borderColor: "#bf0000"
    },

    icon: {
        height:scale(20),
        width: scale(20)
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
