import Select from "@/components/select";
import { images } from "@/constants/images";
import { picStyles } from "@/styles/pic";
import { router } from "expo-router";
import { Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FinishReg() {

    return (
        <SafeAreaView>
            <View style={[picStyles.imgV, picStyles.imgVExtra]}>
                <Image source={images.largeCheck} style={picStyles.checkImg} />
            </View>

            <View style={picStyles.completeHeaderV}>
                <Text style={[picStyles.headerText, picStyles.centerText]}>Profile Complete</Text>
                <Text style={[picStyles.pText, picStyles.centerText]}>Your account has been created and profile completed.</Text>
            </View>

            <View style={picStyles.completeHeaderV}>
                <Select text="Continue" selected selectFun={() => router.replace("/(tabs)/home")} />
            </View>
        </SafeAreaView>
    )
}
