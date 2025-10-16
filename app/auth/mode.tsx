import BackArrow from "@/components/back";
import Select from "@/components/select";
import { images } from "@/constants/images";
import { globals } from "@/styles/globals";
import { modeStyles } from "@/styles/mode";
import { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


export default function Mode () {

    const [ student, setStudent ] = useState(false)
    const [ agent, setAgent ] = useState(false)

    const pickStudent = () => {
        setStudent(true)
        setAgent(false)
    }

    const pickAgent = () => {
        setAgent(true)
        setStudent(false)
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
                <Select text={"Continue"} selected={true} clickable={false} />
            </View>
        </SafeAreaView>
    )
}
