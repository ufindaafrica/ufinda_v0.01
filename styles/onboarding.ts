import { StyleSheet } from "react-native";
import { moderateScale, scale, verticalScale } from "@/deps/scale";


export const onboardingStyles = StyleSheet.create({
    container: {
        backgroundColor: "#f5f5f5",
        display: "flex",
        flex: 1,
        justifyContent: "space-evenly",
        alignItems: "center"
    },

    pressable: {
        flex: 1,
        width: "100%",
        height: "100%",
        justifyContent: "space-evenly",
        alignItems: "center"
    },

    logo: {
        backgroundColor: "#fcfcfc",
        width: scale(170),
        height: verticalScale(32),
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 10
    },

    textView: {
        justifyContent: "space-between",
        alignItems: "center"
    },

    header: {
        textAlign: "center",
        color: "#101010",
        width: scale(240),
        height: scale(50),
        alignSelf: 'center'
    },

    regular: {
        textAlign: "center",
        color: "#546881",
        width: scale(278),
        marginTop: scale(16)
    },

    dots: {
        flexDirection: "row",
        width: "8%",
        justifyContent: "space-between"
    },

    button: {
        backgroundColor: "#101010",
        width: "95%",
        height: verticalScale(44),
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        padding: moderateScale(10)
    },

    buttonText: {
        color: "#f5f5f5",
    },

    img: {
        width: scale(170),
        height: verticalScale(31.72)
    },

    onImg: {
        width: scale(390),
        height: verticalScale(420)
    },

    onImg3: {
        alignSelf: "center",
        resizeMode: "center"
    },

    centerImg: {
        alignSelf: "center"
    },

    bottomV: {
        height: verticalScale(198),
        justifyContent: "space-between",
        alignItems: "center",
        width: scale(358),
        paddingHorizontal: moderateScale(16)
    },

    dotImg: {
        width: scale(6),
        height: verticalScale(6)
    }
})
