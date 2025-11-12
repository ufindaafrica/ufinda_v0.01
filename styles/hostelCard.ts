import { StyleSheet } from "react-native";


export const hostelCardStyles = StyleSheet.create({
    main: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    hostelName: {
        color: "#000000"
    },

    textMargin: {
        marginBottom: 8
    },

    address: {
        color: "#8e8e93"
    },

    amenitiesV: {
        flexDirection: "row",
        flexWrap: "wrap",
    },

    amenitiesT: {
        color: "#bf7c00"
    },

    card: {
        backgroundColor: "#fcfcfc",
        elevation: 0.5,
        borderRadius: 16,
        zIndex: 0.5,
        borderWidth: 1,
        borderColor: "#e5e5ea"
    },

    thumbnailV: {
        padding: 6,
        height: 140
    },

    agentInfo: {
        flexDirection: "row",
        backgroundColor: "#e5e5ea",
        justifyContent: "space-between",
        alignItems: "center",
        height: 70,
        borderBottomRightRadius: 14,
        borderBottomLeftRadius: 14
    },

    agentCard: {
        flexDirection: "row",
        padding: 8,
        alignItems: "center"
    },

    agentPic: {
        borderRadius: 100,
        marginRight: 8,
        height: 40,
        width: 40
    },

    stars: {
        flexDirection: "row",
        alignItems: "center",
        maxWidth: "50%",
        justifyContent: "space-between"
    },

    verifiedAgent: {
        flexDirection: "row",
        alignItems: "center"
    },

    verifiedAgentT: {
        marginLeft: 4,
        color: "#008000"
    },

    agentMargin: {
        marginBottom: 4
    },

    phoneView: {
        backgroundColor: "#008000",
        marginRight: 8,
        height: 32,
        width: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8
    },

    phoneImg: {
        height: 16,
        width: 16
    },

    blackDot: {
        width: 3,
        height: 3,
        alignSelf: "center"
    },

    archiveImg: {
        height: 24,
        width: 24
    },

    eachStar: {
        width: 8,
        height: 8
    },

    verifiedAgentImg: {
        width: 10,
        height: 10
    },

    mainPlusAmenities: {
        paddingHorizontal: 8,
        paddingVertical: 16
    }
})

