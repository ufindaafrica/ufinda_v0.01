import { moderateScale, scale, verticalScale } from "@/deps/scale";
import { StyleSheet } from "react-native";


export const adsStyles = StyleSheet.create({
    headerV: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: 'center'
    },

    blackText: {
        color: "#000000"
    },

    greenText: {
        color: "#008000"
    },

    greyText: {
        color: "#8e8e93"
    },

    bellV: {
        width: scale(40),
        height: scale(40),
        backgroundColor: "#f5f5f5",
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 30
    },

    bellImg: {
        width: scale(24),
        height: (24)
    },

    background: {
        backgroundColor: '#fcfcfc'
    },

    layoutMarginSmall: {
        marginBottom: moderateScale(8)
    },

    rightText: {
        textAlign: "right"
    },

    eachAd: {
        height: verticalScale(130),
        padding: moderateScale(16),
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#e5e5ea",
        width: "100%"
    },

    scrollV: {
        paddingBottom: moderateScale(100)
    },

    dotImg: {
        width: scale(4),
        height: scale(4)
    },

    leftV: {
        justifyContent: "space-between",
        height: "100%"
    },

    amenitiesV: {
        flexDirection: "row",
        alignItems: 'center',
        gap: scale(8)
    }

})
