import { moderateScale, scale, verticalScale } from "@/deps/scale";
import { StyleSheet } from "react-native";


export const newHostelStyles = StyleSheet.create({
    headerV: {
        padding: moderateScale(16),
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },

    moreV: {
        width: scale(44),
        height: scale(44),
        justifyContent: "center",
        alignItems: "center"
    },

    moreImg: {
        width: scale(24),
        height: scale(24)
    },

    inputV: {
        padding: moderateScale(16),
        paddingBottom: 0
    },

    hostelImgV: {
        flexDirection: "row",
        gap: scale(8)
    },

    addHostelV: {
        width: scale(56),
        height: scale(56),
        backgroundColor: "#f2f2f7",
        borderRadius: 4,
        borderWidth: 1,
        borderColor: "#e5e5ea",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 2
    },

    plusImg: {
        height: scale(24),
        width: scale(24)
    },

    imgCaptionV: {
        flexDirection: "row",
        marginTop: scale(8)
    },

    alertCircle: {
        width: scale(12),
        height: scale(12),
        marginRight: 4
    },

    scrollV: {
        paddingBottom: verticalScale(100)
    },

    hostelImg: {
        width: scale(56),
        height: scale(56),
        resizeMode: "cover",
        borderRadius: 4
    },

    paddingBottom: {
        paddingBottom: moderateScale(16)
    },

    descriptionV: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },

    padding: {
        padding: moderateScale(16)
    },

    paddingBottomSmall: { 
        paddingBottom: verticalScale(6)
    },

    topAdView: {  
        height: verticalScale(143), 
    },

    gap: { 
        gap: scale(8) 
    },

    adOption: { 
        width: scale(80),
        height: verticalScale(32) 
    },

    bottomAdView: { 
        height: verticalScale(87), 
        marginVertical: verticalScale(8), 
    },

    adView: {
        justifyContent: "space-between",
        width: "100%", 
        padding: moderateScale(13), 
        borderWidth: 1, 
        borderRadius: 8,
        borderColor: "#e5e5ea",  
    },

    selectedAdView: {
        borderWidth: 2, 
        borderColor: "#008000", 
    }
})
