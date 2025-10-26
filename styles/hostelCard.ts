import { StyleSheet } from "react-native";
import { fonts } from "./globals";


export const hostelCardStyles = StyleSheet.create({
    main: {
        flexDirection: "row",
        justifyContent: "space-between",
        padding: 10
    },

    hostelName: {
        fontFamily: fonts.bold,
        fontSize: 24
    },

    textMargin: {
        marginBottom: 5
    },

    address: {
        fontFamily: fonts.regular,
        fontSize: 16,
        color: "#363333"
    },

    price: {
        fontFamily: fonts.bold,
        fontSize: 24
    },

    amenitiesV: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        maxWidth: "90%"
    },

    amenitiesT: {
        color: "#bf7c00"
    },

    card: {
        backgroundColor: "#fffff7",
        elevation: 1,
        borderRadius: 10,
        zIndex: 1,
        borderWidth: 1,
        borderColor: "#e5e5ea"
    },

    thumbnailV: {
        padding: 10
    },

    agentInfo: {
        flexDirection: "row",
        backgroundColor: "#e5e5ea",
        justifyContent: "space-between",
        alignItems: "center"
    },

    agentCard: {
        flexDirection: "row",
        padding: 10,
        alignItems: "center"
    },

    agentPic: {
        borderRadius: 100,
        marginRight: 16,
        height: 50,
        width: 50
    },

    agentName: {
        fontFamily: fonts.bold,
        fontSize: 18
    },

    stars: {
        flexDirection: "row",
        alignItems: "center",
        maxWidth: "55%",
        justifyContent: "space-between"
    },

    verifiedAgent: {
        flexDirection: "row",
        alignItems: "center"
    },

    verifiedAgentT: {
        marginLeft: 5,
        fontFamily: fonts.regular,
        fontSize:10,
        color: "#008000"
    },

    agentMargin: {
        marginBottom: 5
    },

    phoneView: {
        backgroundColor: "#008000",
        marginRight: 10,
        height: 40,
        width: 50,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10
    },

    phoneImg: {
        height: 25,
        width: 25
    }
})

