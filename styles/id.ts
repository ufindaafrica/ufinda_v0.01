import { StyleSheet } from "react-native";
import { fonts } from "./globals";

export const idStyles = StyleSheet.create({
    safeV: {
        backgroundColor: "#f5f5f5",
        flex: 1
    },

    headerV: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 24
    },

    firstHeaderV: {
        flexDirection: "row",
        alignItems: "center"
    },

    headerTxt: {
        fontFamily: fonts.bold,
        fontSize: 24,
        paddingLeft: 32
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
        marginHorizontal: 16,
        paddingHorizontal: 5,
        flexDirection: "row",
        backgroundColor: "#f5f5f5",
        justifyContent: "space-between",
        alignItems: "center",
        borderRadius: 5
    },

    picV: {
        height: "100%",
        backgroundColor: 'pink'
    },

    swipeV: {
        height: "30%"
    },

    galleryTxt: {
        fontFamily: fonts.regular,
        paddingHorizontal: 3,
        paddingVertical: 2
    },

    prelimV: {
        padding: 14,
        height: "22%"
    },

    topPrelimV: {
        padding: 16,
        backgroundColor: "#fffff7",
        borderRadius: 15,
        justifyContent: "space-between",
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
        fontFamily: fonts.regular,
    },

    boldTxt: {
        fontFamily: fonts.bold,
        fontSize: 18
    },

    redTxt: {
        color: "red"
    },

    thirdTopPrelimV: {
        width: "48%"
    }


})
