import { moderateScale, scale, verticalScale } from "@/deps/scale";
import { StyleSheet } from "react-native";


export const dashboardStyles = StyleSheet.create({

    plusImg: {
        width: scale(35),
        height: scale(35)
    },

    padding: {
        padding: moderateScale(16)
    },

    scrollV: { 
        paddingVertical: moderateScale(16), 
        paddingBottom: moderateScale(100) 
    },

    listingsV: {
        flexDirection: "row", 
        flexWrap: "wrap", 
        justifyContent: "space-between", 
        rowGap: verticalScale(8) 
    },

    eachListing: {
        height: verticalScale(174), 
        width: scale(175), 
        borderWidth: 1, 
        borderColor: "#f2f2f7", 
        borderRadius: 16, 
        padding: moderateScale(16),
        justifyContent: "space-between"
    },

    outerRemV: { 
        width: scale(143), 
        height: verticalScale(8), 
        backgroundColor: "#f2f2f7", 
        borderRadius: 30, 
        marginTop: moderateScale(16)
    },

    postedT: { 
        color: "#546881", 
        paddingTop: 4
    },

    remEntireV: {
        flexDirection: "row", 
        alignItems: "flex-end"
    },

    remT: { 
        color: "#546881", 
        paddingBottom: 3
    },

    innerRemV: {
        height: "100%", 
        backgroundColor: '#008000', 
        borderRadius: 30
    },

    metricImg: {
        width: scale(32),
        height: scale(32),
        alignSelf: "center"
    },

    metricT: {
        color: '#008000',
        alignSelf: 'flex-end'
    }
})

export const plusVStyles = (insets: {bottom: number}) => StyleSheet.create({
    plusV: {
        backgroundColor: "#d9ecd9",
        width: scale(64),
        height: scale(64),
        borderRadius: 45,
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        bottom: moderateScale(16) + insets.bottom,
        right: moderateScale(16),
        zIndex: 2,
        elevation: 2
    },
})
