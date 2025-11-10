import Select from "@/components/select";
import { globals, roboto } from "@/styles/globals";
import { modeStyles } from "@/styles/mode";
import { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Secure from "expo-secure-store"
import { router } from "expo-router";
import BackArrow from "@/components/back";


export default function Mode () {

    const [ student, setStudent ] = useState(false)
    const [ agent, setAgent ] = useState(false)
    const [ picked, setPicked ] = useState(true)

    const pickStudent = () => {
        setStudent(true)
        setAgent(false)
        setPicked(false)
    }

    const pickAgent = () => {
        setAgent(true)
        setStudent(false)
        setPicked(false)
    }

    const setMode = async () => {
        if (agent === true) {
            await Secure.setItemAsync("MODE", "vendor")
        }
        if (student === true) {
            await Secure.setItemAsync("MODE", "user")
        }
        router.push("/auth/signup")
    }

    return (
        <SafeAreaView style={[globals.authContainer, globals.container]}>

            <View>
                <BackArrow backFun={() => router.replace("/onboarding")} />
            </View>

            <View style={modeStyles.textView}>
                <Text style={[roboto.titleLargeBold, { height: 24, width: 187}]}>Let's get you started!</Text>
                <Text style={[roboto.bodyLarge, { height: 20, width: 259, color: "#8e8e93" }]}>Are you a</Text>
            </View>

            <View style={modeStyles.selectMode}>
                <Select text={"Student"} selected={student} selectFun={pickStudent} />
                <Select text={"Agent/Vendor"} selected={agent} selectFun={pickAgent} />
                <Select text={"Continue"} selected={true} clickable={picked} selectFun={setMode} />
            </View>
        </SafeAreaView>
    )
}
