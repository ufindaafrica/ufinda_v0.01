import { scale, verticalScale } from "@/deps/scale";
import { StyleSheet } from "react-native";


export const singleChatStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center'
    },

    jCenter: {
        justifyContent: 'space-between'
    },

    gap: {
        gap: 8
    },

    bottomPadding: {
        paddingBottom: 4
    },

    headerRight: {
        width: scale(64),
        height: verticalScale(44)
    },

    img: {
        width: scale(24), 
        height: scale(24)
    },
    
    encrypted: {
        textAlign: 'center', 
        backgroundColor: '#fcfcfc', 
        padding: 4, 
        width: 179, 
        alignSelf: 'center', 
        borderRadius: 8
    },

    smallImg: {
        width: scale(18),
        height: scale(18)
    },

    kAView: { 
        flex: 1, 
        backgroundColor: '#f5f5f5', 
        justifyContent: 'space-between', 
        padding: 16 
    },

    messageBox: { 
        padding: 8, 
        borderRadius: 30, 
        flexGrow: 1
    },

    messageBoxHeight: {
        height: verticalScale(44)
    },
    
    sendView: {
        width: scale(44), 
        height: scale(44), 
        borderRadius: 44, 
        backgroundColor: '#008000', 
        justifyContent: "center", 
        alignItems: "center"
    },

    message: {
        padding: 8, 
        backgroundColor: '#008000', 
        maxWidth: '80%', 
        alignSelf: 'flex-end', 
        marginTop: 4, 
        height: verticalScale(46), 
        verticalAlign: 'middle', 
        borderRadius: 24, 
        borderTopRightRadius: 18, 
        borderBottomRightRadius: 8
    },

    reversed: {
        padding: 8, 
        backgroundColor: '#fcfcfc', 
        maxWidth: '80%', 
        alignSelf: 'flex-start', 
        marginTop: 4, 
        height: verticalScale(46), 
        verticalAlign: 'middle', 
        borderRadius: 24, 
        borderTopLeftRadius: 18, 
        borderBottomLeftRadius: 8
    },

    timeText: {
        alignSelf: "flex-end", 
        paddingTop: 4
    },

    reversedTime: {
        alignSelf: "flex-start", 
        paddingTop: 4
    }
})
