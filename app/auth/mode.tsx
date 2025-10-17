import BackArrow from "@/components/back";
import Select from "@/components/select";
import { globals } from "@/styles/globals";
import { modeStyles } from "@/styles/mode";
import { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Secure from "expo-secure-store"
import { router } from "expo-router";


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
            await Secure.setItemAsync("MODE", "agent")
        }
        if (student === true) {
            await Secure.setItemAsync("MODE", "student")
        }
        router.push("/auth/signup")
    }

    return (
        <SafeAreaView style={[globals.authContainer, globals.container]}>

            <BackArrow />

            <View style={modeStyles.textView}>
                <Text style={modeStyles.headerText}>Let's get you started!</Text>
                <Text style={modeStyles.pText}>Are you a</Text>
            </View>

            <View style={modeStyles.selectMode}>
                <Select text={"Student"} selected={student} selectFun={pickStudent} />
                <Select text={"Agent/Vendor"} selected={agent} selectFun={pickAgent} />
            </View>

            <View style={modeStyles.selectMode}>
                <Select text={"Continue"} selected={true} clickable={picked} selectFun={setMode} />
            </View>
        </SafeAreaView>
    )
}
