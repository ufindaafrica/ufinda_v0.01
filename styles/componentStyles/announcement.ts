import { moderateScale, scale, verticalScale } from "@/deps/scale";
import { StyleSheet } from "react-native";


export const announcementStyles = StyleSheet.create({
    main: {
        width: "100%",
        height: verticalScale(104),
        borderWidth: 2,
        borderRadius: 16,
        borderColor: "#008000",
        justifyContent: 'space-between',
        padding: moderateScale(16),
        flexDirection: "row"
    },

    activeMain: {
        backgroundColor: "#008000",
        borderWidth: 0
    },

    touch: {
        width: scale(44),
        height: scale(44),
        borderRadius: 30,
        backgroundColor: "#fcfcfc",
        justifyContent: "center",
        alignItems: "center",
        alignContent: "center",
        alignSelf: "center"
    },

    activeTouch: {
        backgroundColor: '#008000'
    },

    img: {
        width: scale(24),
        height: scale(24)
    }
})
