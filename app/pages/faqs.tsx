import BackArrow from "@/components/back";
import FaqBox from "@/components/faqbox";
import LineBreak from "@/components/lineBreak";
import { faqs } from "@/constants/texts";
import { moderateScale } from "@/deps/scale";
import { globals, roboto } from "@/styles/globals";
import { idStyles } from "@/styles/id";
import { router } from "expo-router";
import { FlatList, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";


export default function Faqs() {

    return (
        <SafeAreaProvider style={[globals.container, globals.lightContainer]}>
            <SafeAreaView style={[globals.container, globals.lightContainer]}>
                <View style={idStyles.headerV}>
                    <View style={idStyles.firstHeaderV}>
                        <BackArrow backFun={() => router.back()} large />
                        <Text style={roboto.titleLargeBold}>FAQs</Text>
                    </View>
                </View>
                <LineBreak />
                <FlatList
                    data={faqs}
                    renderItem={({ item }) => (
                        <View style={{padding: moderateScale(16), paddingBottom: 0}}>
                            <FaqBox question={item.question} answer={item.answer} />
                        </View>
                    )}
                    keyExtractor={(item, idx) => `${idx} ${item.question}`} />
            </SafeAreaView>
        </SafeAreaProvider>
    )
}

