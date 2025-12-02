import { moderateScale, scale, verticalScale } from "@/deps/scale";
import { StyleSheet } from "react-native";


export const drawerStyles = StyleSheet.create({
    main: { 
        backgroundColor: 'rgb(0, 0, 0, 0.4)', 
        width: "100%", 
        position: "absolute", 
        top: 0, 
        left: 0 
    },

    animated: {
        width: "100%", 
        backgroundColor: "white", 
        position: "absolute", 
        bottom: 0, 
        borderTopLeftRadius: 16, 
        borderTopRightRadius: 16, 
        padding: moderateScale(16) 
    },

    img: { 
        width: scale(40), 
        height: scale(40), 
        alignSelf: 'flex-end' 
    }, 

    titleTxt: { 
        paddingBottom: moderateScale(16), 
        textAlign: 'center' 
    },

    drawerPadding: { 
        paddingBottom: moderateScale(16) 
    },

    optionsRow: { 
        borderBottomWidth: 1, 
        borderColor: "#e5e5ea", 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        height: verticalScale(44) 
    }
})

