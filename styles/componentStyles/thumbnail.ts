import { StyleSheet } from "react-native";
import { fonts } from "../globals";

export const thumbnailStyles = StyleSheet.create({
    main: {
        backgroundColor: "#b3b3b3",
        height: 170,
        borderRadius: 10,
        padding: 10
    },

    txt: {
        fontFamily: fonts.light,
        color: "#593a00",
        backgroundColor: "#fff6e6",
        padding:5,
        borderRadius: 10
    },

    txtV: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignContent: "center"
    }
})
