import { StyleSheet } from "react-native";
import { fonts } from "./globals";

export const picStyles = StyleSheet.create({

    main: {
        marginTop: 16
    },

    pText: {
        marginTop: 8,
        width: 259,
        color: '#8e8e93'
    },

    imgV: {
        borderWidth: 1.5,
        height: 200,
        width: 200,
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
        marginTop: 8,
        height: 56,
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
        marginTop: 32,
        borderColor: "#008000",
        borderWidth: 2.14,
        backgroundColor: "#e3f4f1"
    },

    checkImg: {
        height: 47,
        width: 47
    },

    completeHeaderV: {
        marginTop: 16,
        paddingLeft: 16,
        paddingRight: 16
    },

    centerText: {
        textAlign: "center"
    },

    padding: {
        padding: 16
    },

    paddingHorizontal: {
        paddingHorizontal: 16
    },

    completeImgV: {
        borderWidth: 2,
        height: 136,
        width: 136,
        borderRadius: 150,
        justifyContent: "center",
        alignItems: "center",
        alignSelf: "center"
    },

    pTextV: { 
        width: 259, 
        alignSelf: "center"
    }

})
