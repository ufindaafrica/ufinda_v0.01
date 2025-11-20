import { scale, verticalScale } from "@/deps/scale";
import { StyleSheet } from "react-native";


export const errorModalStyles = StyleSheet.create({
    main: {
        height: scale(243),
        width: scale(243),
        justifyContent: 'space-evenly',
        alignItems: 'center',
        backgroundColor: "#f5f5f5",
        borderRadius: 15,
        elevation: 5,
        zIndex: 5
    },

    buttonV: {
        width: scale(76),
        height: verticalScale(44)
    },

    mainV: {
        width: "100%",
        height: "100%",
        position: "absolute",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(240, 240, 240, 0.5)",
    },

    text: {
        overflow: "scroll",
        width: "90%",
        textAlign: "center"
    },

    icon: {
        width: scale(80),
        height: scale(80)
    }
})
