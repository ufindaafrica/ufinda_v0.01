import { moderateScale, scale } from "@/deps/scale";
import { StyleSheet } from "react-native";


export const vendorAppHeader = StyleSheet.create({
    main: {
        flexDirection: "row",
        width: "100%",
        justifyContent: "space-between",
        backgroundColor: '#fcfcfc',
        padding: moderateScale(16)
    },

    blackTxt: {
        color: "#000000"
    },

    greenTxt: {
        color: "#008000",
        paddingRight: moderateScale(4),
    },

    greenImg: {
        width: scale(16),
        height: scale(16)
    },

    bellImg: {
        width: scale(24),
        height: scale(24)
    },

    roundV: {
        width: scale(44),
        height: scale(44),
        borderRadius: 50
    },

    bellButton: {
        backgroundColor: "#f5f5f5",
        marginRight: moderateScale(8),
        justifyContent: "center",
        alignItems: "center"
    },

    postV: {
        flexDirection: "row",
        paddingTop: moderateScale(8),
        alignItems: "center"
    },

    rightV: {
        flexDirection: "row"
    }
    
})
