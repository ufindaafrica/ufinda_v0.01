import { images } from "@/constants/images";
import { faqType } from "@/constants/texts";
import { moderateScale, scale } from "@/deps/scale";
import { roboto } from "@/styles/globals";
import { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";



export default function FaqBox ({ question, answer } : faqType) {

    const [visible, setVisible] = useState(false)
    
    return (
        <View style={[{width: '100%', borderWidth: 1, borderRadius: 8, padding: moderateScale(16), borderColor: "#000000"}, visible ? {} : {borderColor: '#546881'}]}>
            <TouchableOpacity onPress={() => setVisible(!visible)} style={{flexDirection:'row', justifyContent: 'space-between', alignItems: 'center'}}>
                <Text style={[roboto.bodyMedium, !visible && {color: '#546881'}]}>{question ?? ""}</Text>
                <Image source={visible ? images.arrowUp : images.arrowDown} style={{width: scale(16), height: scale(16)}}/>
            </TouchableOpacity>

            {
                visible && <Text style={[roboto.bodyMedium, {paddingTop: moderateScale(16)}]}>{answer ?? ""}</Text>
            }
        </View>
    )
}

