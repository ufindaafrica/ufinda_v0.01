import { moderateScale, scale, verticalScale } from "@/deps/scale";
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
        marginBottom: moderateScale(8)
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
        padding: moderateScale(6),
        height: verticalScale(140)
    },

    agentInfo: {
        flexDirection: "row",
        backgroundColor: "#e5e5ea",
        justifyContent: "space-between",
        alignItems: "center",
        height: verticalScale(70),
        borderBottomRightRadius: 14,
        borderBottomLeftRadius: 14
    },

    agentCard: {
        flexDirection: "row",
        padding: moderateScale(8),
        alignItems: "center"
    },

    agentPic: {
        borderRadius: 100,
        marginRight: moderateScale(8),
        height: scale(40),
        width: scale(40)
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
        marginRight: moderateScale(8),
        height: verticalScale(32),
        width: scale(40),
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8
    },

    phoneImg: {
        height: scale(16),
        width: scale(16)
    },

    blackDot: {
        width: 3,
        height: 3,
        alignSelf: "center"
    },

    archiveImg: {
        height: scale(24),
        width: scale(24)
    },

    eachStar: {
        width: 8,
        height: 8
    },

    verifiedAgentImg: {
        width: scale(10),
        height: scale(10)
    },

    mainPlusAmenities: {
        paddingHorizontal: moderateScale(8),
        paddingVertical: moderateScale(16)
    }
})

