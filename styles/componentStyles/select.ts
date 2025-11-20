import { moderateScale, scale, verticalScale } from "@/deps/scale";
import { StyleSheet } from "react-native";


export const selectStyles = StyleSheet.create({

    box: {
        width: "100%",
        height: verticalScale(44),
        borderColor: "#008000",
        borderWidth: 1.5,
        borderRadius: 8,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
    },

    text: {
        color: "#008000",
        alignSelf: "center",
        textAlignVertical: "center",
        textAlign: "center"
    },

    activeBox: {
        backgroundColor: "#006000",
        borderWidth: 0
    },

    activeText: {
        color: "#fcfcfc",
        alignSelf: "center"
    },

    clickable: {
        opacity: 0.5,
        borderWidth: 0
    },

    icon: {
        marginRight: moderateScale(8),
        width: scale(16),
        height: scale(16)
    },

    boxWithIcon: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center"
    }
    
})
