import { scale } from "@/deps/scale";
import { StyleSheet } from "react-native";


export const chatAppHeaderStyles = StyleSheet.create({
    main: { 
        flexDirection: 'row', 
        width: '100%', 
        justifyContent: 'space-between', 
        alignItems: 'center' 
    },

    imgV: { 
        width: scale(44), 
        height: scale(44), 
        justifyContent: 'center', 
        alignItems: 'center' 
    },

    img: { 
        width: scale(24), 
        height: scale(24) 
    },

    searchV: {
        width: scale(254)
    }
})
