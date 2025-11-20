import { StyleSheet } from "react-native";
import { moderateScale, scale, verticalScale } from "@/deps/scale";


export const homeStyles = StyleSheet.create({
    layoutMargin: {
        marginBottom: moderateScale(16)
    },

    filterV: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between"
    },

    eachFilterV: {
        width: scale(175),
        paddingBottom: moderateScale(8)
    },

    scrollV: {
        paddingBottom: verticalScale(300)
    },

    eachSavedFilterV: {
        width: scale(100)
    }
})

