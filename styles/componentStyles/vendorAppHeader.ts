import { StyleSheet } from "react-native";
import { useReducedMotion } from "react-native-reanimated";


export const vendorAppHeader = StyleSheet.create({
    main: {
        flexDirection: "row",
        width: "100%",
        justifyContent: "space-between",
        backgroundColor: '#fcfcfc',
        padding: 16
    },

    blackTxt: {
        color: "#000000"
    },

    greenTxt: {
        color: "#008000",
        paddingRight: 4,
    },

    greenImg: {
        width: 16,
        height: 16
    },

    bellImg: {
        width: 24,
        height: 24
    },

    roundV: {
        width: 44,
        height: 44,
        borderRadius: 50
    },

    bellButton: {
        backgroundColor: "#f5f5f5",
        marginRight: 8,
        justifyContent: "center",
        alignItems: "center"
    },

    postV: {
        flexDirection: "row",
        paddingTop: 8,
        alignItems: "center"
    },

    rightV: {
        flexDirection: "row"
    }
    
})
