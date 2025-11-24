import { moderateScale, scale } from "@/deps/scale";
import { StyleSheet } from "react-native";


export const circleProgressStyles = StyleSheet.create({
    main: {
        aspectRatio: 1,
        width: scale(80)
    },

    txtView: {
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        height: "100%",
        flexDirection: "row"
    },

    color: {
        color: '#008000'
    },

    bottomT: {
        paddingTop: moderateScale(4)
    }
})

export const otherStyles = {
    circle: {
        stroke: "#008000",
        fill: "transparent",
        strokeWidth: scale(5)
    },

    txt: {
        x: "50%",
        y: "50%",
        textAnchor: "middle",
        alignmentBaseline: "middle",
    }
}
