import BackArrow from "@/components/back";
import Input from "@/components/input";
import Select from "@/components/select";
import { globals } from "@/styles/globals";
import { signupStyles } from "@/styles/signup";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


export default function SignUp() {

    return (
        <SafeAreaView style={[signupStyles.main]}>

            <BackArrow />

            <View>
                <Text style={signupStyles.headerText}>Create Account</Text>
                <Text style={signupStyles.pText}>Please enter your personal details to complete your profile</Text>
            </View>

            <View style={signupStyles.firstInputLine}>
                <View style={signupStyles.eachName}>
                    <Input label="First Name" hint="john" />
                </View>
                <View style={signupStyles.break}></View>
                <View style={signupStyles.eachName}>
                    <Input label="Last Name" hint="doe" />
                </View>
            </View>

            <Input label="Email" hint="email@email.com" />

            <Input label="Phone" hint="2349012345678" />

            <Input label="Password" hint="********" />

            <Input label="Confirm Password" hint="********" />

            <View style={signupStyles.continueView}>
                <Select text="Continue" selected={true} selectFun={() => null} />
            </View>

            <View style={signupStyles.policyView}>
                <Text>By registering, you have accepted our </Text>
                <Text>terms and conditions</Text>
                <Text> and our </Text>
                <Text>data policy.</Text>
            </View>

        </SafeAreaView>
    )
}
