import BackArrow from "@/components/back";
import Input from "@/components/input";
import { globals } from "@/styles/globals";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


export default function SignUp () {

    return (
        <SafeAreaView style={[globals.container, globals.authContainer]}>

            <BackArrow />

            <View>
                <Text>Create Account</Text>
                <Text>Please enter your personal details to complete your profile</Text>
            </View>

            <View>
                <Input label="First Name:" />
            </View>

        </SafeAreaView>
    )
}
