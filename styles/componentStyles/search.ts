import { StyleSheet } from "react-native";
import { moderateScale, scale, verticalScale } from "@/deps/scale";


export const searchStyles = StyleSheet.create({
    main: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#e5e5ea",
        borderRadius: 30,
        height: verticalScale(44),
        width: "100%"
    },

    img: {
        marginLeft: moderateScale(5),
        height: scale(16), 
        width: scale(16)
    },

    text: {
        width: "90%"
    }
})
