import { StyleSheet } from "react-native";
import { fonts } from "./globals";

export const idStyles = StyleSheet.create({
    safeV: {
        backgroundColor: "#f5f5f5"
    },

    headerV: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 16,
        alignItems: "center",
        height: 44,
        marginBottom: 16
    },

    firstHeaderV: {
        flexDirection: "row",
        alignItems: "center",
        height: 44
    },

    layoutMargin: {
        marginBottom: 16
    },

    hostelImg: {
        height: "100%",
        width: "100%",
        backgroundColor: "green"
    },

    galleryV: {
        position: "absolute",
        bottom: 10,
        marginHorizontal: 8,
        paddingHorizontal: 5,
        flexDirection: "row",
        backgroundColor: "#f5f5f5",
        justifyContent: "space-between",
        alignItems: "center",
        borderRadius: 4,
        paddingVertical: 3
    },

    picV: {
        height: 210,
        // alignItems: 'center',
        justifyContent: "center"
    },

    swipeV: {
        height: 210
    },

    galleryTxt: {
        paddingHorizontal: 3,
        paddingVertical: 2
    },

    prelimV: {
        padding: 16,
        height: 148,
        paddingBottom: 0
    },

    topPrelimV: {
        padding: 8,
        backgroundColor: "#fcfcfc",
        borderRadius: 16,
        justifyContent: "space-around",
        height: "100%",
        width: "100%",
        marginRight: 16,
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
        width: 128
    },

    thirdTopPrelimVTwo: {
        width: 182
    },

    amenitiesV: {
        alignItems: "center",
        justifyContent: "center",
        width: 68,
        height: 53
    },

    outerAmenitiesV: {
        padding: 16,
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
        padding: 16,
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
        height: 24,
        width: 24
    },

    navArrow: {
        height: 24,
        width: 24,
        position: "absolute",
        justifyContent: 'center',
        alignItems: 'center',
    },

    navImg: {
        height: 24,
        width: 24,
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
        height: 24,
        width: 24
    },

    outerAgentV: {
        padding: 16,
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
        paddingBottom: 50
    },

    cardMargin: {
        marginBottom: 8
    }
})
