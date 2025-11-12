import { StyleSheet } from "react-native";
import { fonts } from "../globals";

export const thumbnailStyles = StyleSheet.create({
    main: {
        backgroundColor: "#b3b3b3",
        height: 140,
        borderRadius: 16,
        padding: 10,
    },

    txt: {
        color: "#593a00",
        backgroundColor: "#fff6e6",
        paddingVertical: 4,
        borderRadius: 6,
        paddingHorizontal: 8,
        textAlign: "center",
        textAlignVertical: "center"
    },

    unavailable: {
        opacity: 0
    },

    txtV: {
        flexDirection: "row",
        justifyContent: "space-between"
    },

    bgStyle: {
        borderRadius: 16,
        resizeMode: "cover"
    }
})
