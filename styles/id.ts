import { moderateScale, scale, verticalScale } from "@/deps/scale";
import { StyleSheet } from "react-native";

export const idStyles = StyleSheet.create({
    safeV: {
        backgroundColor: "#f5f5f5"
    },

    headerV: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: moderateScale(16),
        alignItems: "center",
        height: verticalScale(44),
        marginBottom: moderateScale(16)
    },

    firstHeaderV: {
        flexDirection: "row",
        alignItems: "center",
        height: verticalScale(44)
    },

    layoutMargin: {
        marginBottom: moderateScale(16)
    },

    hostelImg: {
        height: "100%",
        width: "100%",
        backgroundColor: "green"
    },

    galleryV: {
        position: "absolute",
        bottom: moderateScale(10),
        marginHorizontal: moderateScale(8),
        paddingHorizontal: moderateScale(5),
        flexDirection: "row",
        backgroundColor: "#f5f5f5",
        justifyContent: "space-between",
        alignItems: "center",
        borderRadius: 4,
        paddingVertical: 3
    },

    picV: {
        height: verticalScale(210),
        // alignItems: 'center',
        justifyContent: "center"
    },

    swipeV: {
        height: verticalScale(210)
    },

    galleryTxt: {
        paddingHorizontal: 3,
        paddingVertical: 2
    },

    prelimV: {
        padding: moderateScale(16),
        height: verticalScale(148),
        paddingBottom: 0
    },

    shortprelimV: {
        height: verticalScale(100)
    },

    topPrelimV: {
        padding: 8,
        backgroundColor: "#fcfcfc",
        borderRadius: 16,
        justifyContent: "space-around",
        height: "100%",
        width: "100%",
        marginRight: moderateScale(16),
    },

    firstTopPrelimV: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },

    regTxt: {
        color: "#000000"
    },

    redTxt: {
        color: "red"
    },

    thirdTopPrelimVOne: {
        width: scale(128)
    },

    thirdTopPrelimVTwo: {
        width: scale(182)
    },

    amenitiesV: {
        alignItems: "center",
        justifyContent: "center",
        width: scale(68),
        height: verticalScale(53)
    },

    outerAmenitiesV: {
        padding: moderateScale(16),
        paddingBottom: 0
    },

    innerAmenitiesV: {
        backgroundColor: "#fcfcfc",
        flexDirection: "row",
        justifyContent: "space-around",
        flexWrap: "wrap",
        padding: 8,
        alignItems: "center",
        borderRadius: 16
    },

    detailsV: {
        padding: 8,
        backgroundColor: "#fcfcfc",
        borderRadius: 15,
        flexDirection: "row",
        flexWrap: "wrap",
    },

    outerDetailsV: {
        padding: moderateScale(16),
        borderRadius: 15,
        paddingBottom: 0
    },

    detTxtV: {
        padding: 5,
        width: "50%",
    },

    detHeaderTxt: {
        paddingBottom: 1,
        color: '#000000'
    },

    detLabelTxt: {
        color: "#8e8e93"
    },

    moreImg: {
        height: scale(24),
        width: scale(24)
    },

    navArrow: {
        height: scale(24),
        width: scale(24),
        position: "absolute",
        justifyContent: 'center',
        alignItems: 'center',
    },

    navImg: {
        height: scale(24),
        width: scale(24),
    },

    arrowLeftMargin: {
        marginLeft: 8,
        left: 0
    },

    arrowRightMargin: {
        marginRight: 8,
        right: 0
    },

    disabledArrow: {
        opacity: 0.5
    },

    galleryImg: {
        height: 11,
        width: 11
    },

    archiveImg: {
        height: scale(24),
        width: scale(24)
    },

    outerAgentV: {
        padding: moderateScale(16),
        paddingBottom: 0
    },

    innerAgentV: {
        borderRadius: 16,
        backgroundColor: "#fcfcfc"
    },

    facilitiesListV: {
        flexDirection: 'row',
        flexWrap: 'wrap', 
        gap: 8,
        marginTop: 8
    },

    innerFacilitiesV: {
        padding: 8
    },

    scrollV: {
        paddingBottom: verticalScale(50)
    },

    cardMargin: {
        marginBottom: 8
    }
})
