import BackArrow from "@/components/back";
import Select from "@/components/select";
import { globals } from "@/styles/globals";
import { picStyles } from "@/styles/pic";
import { Link, router } from "expo-router";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


export default function Pic() {

    return (
        <SafeAreaView style={[globals.container, globals.authContainer]}>

            <BackArrow backFun={() => router.replace("/(tabs)/home")} />

            <View style={picStyles.main}>
                <Text style={picStyles.headerText}>One more step</Text>
                <Text style={picStyles.pText}>Now let's communicate your presence, please update your profile.</Text>
            </View>

            <View style={[picStyles.main, picStyles.imgV]}>
                <TouchableOpacity style={picStyles.imgO}>
                    <Text style={picStyles.fileText}>Browse files</Text>
                </TouchableOpacity>
            </View>

            <View style={[picStyles.main]}>
                <View style={picStyles.descHeader}>
                    <Text style={picStyles.descText}>Description</Text>
                    <Text style={picStyles.descText}>0/20</Text>
                </View>
                <TextInput
                    placeholder="Tell us about yourself"
                    placeholderTextColor={"#b3b3b3"}
                    style={picStyles.descInput}
                />
            </View>

            <View style={picStyles.main}>
                <Select text="Continue" selected />
            </View>

            <Link href={"/(tabs)/home"} style={[picStyles.main, picStyles.linkText]}>
                I'll do this later
            </Link>

        </SafeAreaView>
    )
}
