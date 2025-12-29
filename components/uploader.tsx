import { moderateScale, verticalScale } from "@/deps/scale";
import { roboto } from "@/styles/globals";
import { Text, View } from "react-native";

type UploaderProps = {
    uploadProgress: number
}

export default function Uploader ({ uploadProgress }: UploaderProps) {

    return (
        <View style={{width: "100%", height: "100%", backgroundColor: 'rgba(252, 252, 252, 0.7)', position: 'absolute', top: verticalScale(32), left: 0, justifyContent: 'center', alignItems: 'center'}}>
            <Text style={[roboto.bodyMediumBold, {paddingBottom: moderateScale(8)}]}>{`Uploading: ${uploadProgress.toString()}%`}</Text>
            <View style={{width: '70%', height: verticalScale(8), backgroundColor: '#cfcfcb', borderRadius: 16}}>
                <View style={{width: `${uploadProgress}%`, height: '100%', backgroundColor: '#008000', borderRadius: 16}}></View>
            </View>
        </View>
    )
}
