import { moderateScale, scale, verticalScale } from "@/deps/scale";
import { StyleSheet } from "react-native";

export const filterStyles = StyleSheet.create({
    visibleV: {
        flexDirection: "row",
        width: "100%",
        justifyContent: 'space-between',
        backgroundColor: "#fcfcfc",
        alignItems: "center",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#c7c7cc"
    },

    activeV: {
        borderColor: "#000000"
    },

    text: {
        padding: moderateScale(10),
        color: "#546881"
    },

    img: {
        marginRight: moderateScale(5),
        width: scale(16),
        height: scale(16),
        opacity: 0.5
    },

    activeImg: {
        opacity: 1
    },

    visibleDropDown: {
        width: "100%",
        justifyContent: 'space-between',
        backgroundColor: "#fcfcfc",
        borderRadius: 15,
        elevation: 5,
        position: "absolute"
    },

    input: {
        width: "100%"
    },

    activeFilterText: {
        color: "#000000"
    }

})
