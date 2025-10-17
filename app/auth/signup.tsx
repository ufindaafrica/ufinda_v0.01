import BackArrow from "@/components/back";
import Input from "@/components/input";
import Select from "@/components/select";
import { signupStyles } from "@/styles/signup";
import { KeyboardAvoidingView, Platform, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useRef } from "react";


export default function SignUp() {

    

    return (
        <SafeAreaView style={signupStyles.main}>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >

                <KeyboardAwareScrollView
                    // contentContainerStyle={{ paddingBottom: keyboardVisible ? 200 : 0}}
                    // contentContainerStyle={{ height: "100%"}}
                    contentContainerStyle={{
                        flexGrow: 1, paddingBottom: 40
                    }}
                    style={{ flex: 1 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    enableOnAndroid={true}
                    extraScrollHeight={150}
                >

                    <BackArrow />

                    <View style={signupStyles.layoutPadding}>
                        <Text style={signupStyles.headerText}>Create Account</Text>
                        <Text style={signupStyles.pText}>Please enter your personal details to complete your profile</Text>
                    </View>

                    <View style={[signupStyles.firstInputLine, signupStyles.layoutPadding]}>
                        <View style={signupStyles.eachName}>
                            <Input label="First Name" hint="john" />
                        </View>
                        <View style={signupStyles.break}></View>
                        <View style={signupStyles.eachName}>
                            <Input label="Last Name" hint="doe" />
                        </View>
                    </View>

                    <View style={signupStyles.formPadding}>
                        <Input label="Email" hint="email@email.com" />
                    </View>

                    <View style={signupStyles.formPadding}>
                        <Input label="Phone" hint="2349012345678" />
                    </View>

                    <View style={signupStyles.formPadding}>
                        <Input label="Password" hint="********" />
                    </View>

                    <View style={signupStyles.formPadding}>
                        <Input label="Confirm Password" hint="********" />
                    </View>

                    <View style={signupStyles.layoutPadding}>
                        <View style={signupStyles.continueView}>
                            <Select text="Continue" selected={true} selectFun={() => null} />
                        </View>
                    </View>

                    <View style={signupStyles.formPadding}>
                        <View style={signupStyles.policyView}>
                            <Text style={signupStyles.policyText}>By registering, you have accepted our </Text>
                            <Text style={signupStyles.policyText}>terms and conditions</Text>
                            <Text style={signupStyles.policyText}> and our </Text>
                            <Text style={signupStyles.policyText}>data policy.</Text>
                        </View>
                    </View>

                    {/* {
                        keyboardVisible ? <View style={{ height: 300 }}></View> : null
                    } */}


                </KeyboardAwareScrollView>

            </KeyboardAvoidingView>

        </SafeAreaView>
    )
}
