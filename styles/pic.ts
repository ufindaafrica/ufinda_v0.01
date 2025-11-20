import { moderateScale, scale, verticalScale } from "@/deps/scale";
import { StyleSheet } from "react-native";

export const picStyles = StyleSheet.create({

    main: {
        marginTop: verticalScale(16)
    },

    pText: {
        marginTop: verticalScale(8),
        width: scale(259),
        color: '#8e8e93'
    },

    imgV: {
        borderWidth: 1.5,
        height: scale(200),
        width: scale(200),
        borderRadius: 150,
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center",
        borderColor: "#101010"
    },

    imgO: {
        backgroundColor: "#f2f2f7",
        height: "95%",
        width: "95%",
        borderRadius: 150,
        justifyContent: "center",
        alignItems: "center"
    },

    fileText: {
        color: "#101010"
    },

    descHeader: {
        flexDirection: "row",
        justifyContent: "space-between"
    },

    descText: {
        color: "#000000"
    },

    descInput: {
        borderWidth: 1,
        borderColor: "#b3b3b3",
        borderRadius: 8,
        marginTop: verticalScale(8),
        height: verticalScale(56),
        textAlignVertical: "top",
        width: "100%",
        flexShrink: 1
    },

    linkText: {
        alignSelf: "center",
        color: "#008000"
    },

    previewImage: {
        height: "100%",
        width: "100%",
        borderRadius: 150
    },

    imgVExtra: {
        marginTop: verticalScale(32),
        borderColor: "#008000",
        borderWidth: 2.14,
        backgroundColor: "#e3f4f1"
    },

    checkImg: {
        height: scale(47),
        width: scale(47)
    },

    completeHeaderV: {
        marginTop: verticalScale(16),
        paddingLeft: moderateScale(16),
        paddingRight: moderateScale(16)
    },

    centerText: {
        textAlign: "center"
    },

    padding: {
        padding: moderateScale(16)
    },

    paddingHorizontal: {
        paddingHorizontal: moderateScale(16)
    },

    completeImgV: {
        borderWidth: 2,
        height: scale(136),
        width: scale(136),
        borderRadius: 150,
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center"
    },

    pTextV: { 
        width: scale(259), 
        alignSelf: "center"
    }

})
