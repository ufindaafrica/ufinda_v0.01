import { moderateScale, scale, verticalScale } from "@/deps/scale";
import { StyleSheet } from "react-native";
import { colors } from "./globals";


export const chatStyles = StyleSheet.create({
    chatOptionsV: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        width: scale(287), 
        alignSelf: 'center', 
        marginBottom: verticalScale(8) 
    },

    padding: {
        padding: moderateScale(16)
    },

    eachOption: { 
        width: scale(55), 
        height: verticalScale(30), 
        alignItems: 'center', 
        justifyContent: 'center',
        borderRadius: 4 
    },

    activated: { 
        backgroundColor: '#008000' 
    }, 

    paddingTop: {
        paddingTop: verticalScale(10)
    },

    laptopV: { 
        width: scale(54), 
        height: scale(54),
        borderRadius: 16
    },

    imageV: {
        borderRadius: 8
    },

    profileImg: { 
        width: scale(24), 
        height: scale(24), 
        borderRadius: 50, 
        borderWidth: 1, 
        borderColor: '#ffffff', 
        position: 'absolute', 
        bottom: -3, 
        right: -3 
    },

    nullPic: {
        backgroundColor: '#be7c00',
        justifyContent: 'center',
        alignItems: 'center'
    },

    scrollV: {
        paddingBottom: moderateScale(150)
    },

    eachChatV: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
    },

    chatRightV: { 
        width: scale(288), 
        flexDirection: 'row', 
        justifyContent: 'space-between' 
    },

    tickV: {
        flexDirection: 'row', 
        gap: 4
    },

    tick: {
        width: scale(16), 
        height: scale(16)
    },

    unread: {
        width: scale(16), 
        height: scale(16), 
        backgroundColor: '#008000', 
        alignSelf: 'flex-end', 
        borderRadius: 50, 
        alignItems: 'center', 
        justifyContent: 'center', 
        marginTop: 4
    }
})
