import BackArrow from "@/components/back";
import ErrorModal from "@/components/errorModal";
import Input from "@/components/input";
import LineBreak from "@/components/lineBreak";
import Loader from "@/components/loader";
import Select from "@/components/select";
import { moderateScale } from "@/deps/scale";
import { toast } from "@/deps/toast";
import { getStudentInfo, getVendorInfo } from "@/services/getStudentInfo";
import { patchHostel } from "@/services/updateHostel";
import { globals, roboto } from "@/styles/globals";
import { idStyles } from "@/styles/id";
import { signupStyles } from "@/styles/signup";
import { router, useLocalSearchParams } from "expo-router";
import { getItem, getItemAsync } from "expo-secure-store";
import { useEffect, useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaProvider, SafeAreaView, useSafeAreaFrame } from "react-native-safe-area-context";


export default function UpdateHostel() {

    const { id, hostel } = useLocalSearchParams()
    const idString = Array.isArray(id) ? id[0] : id
    const hostelDets = JSON.parse(Array.isArray(hostel) ? hostel[0] : hostel)

    console.log(hostelDets)

    const [landlordResides, setLandlordResides] = useState(hostelDets?.landlord_resides)
    const [roommatesAllowed, setRoommatesAllowed] = useState(hostelDets?.roommates_allowed)
    const [description, setDescription] = useState(hostelDets?.description)
    const [powerSupply, setPowerSupply] = useState(hostelDets?.power_supply)
    const [availableRooms, setAvailableRooms] = useState(hostelDets?.available_rooms.toString())


    const [loaderVisible, setLoaderVisible] = useState(false)
    const [errorModal, setErrorModal] = useState(false)
    const [errorText, setErrorText] = useState("")


    const validateBooleanInput = (text: string) => {
        return (text.replace(/\s/g, '').toLowerCase() === "yes" || text.replace(/\s/g, '').toLowerCase() === "no")
    }

    const validateDescLength = (text: string) => {
        return (text.length >= 10)
    }

    const updateHostel = async () => {
        if (hostelDets?.landlord_resides == landlordResides && hostelDets?.roommates_allowed == roommatesAllowed && hostelDets?.description == description && hostelDets?.power_supply == powerSupply && hostelDets?.available_rooms == Number(availableRooms)) {
            toast("no changes")
            router.back()
            return
        }

        if (!validateBooleanInput(landlordResides)) {
            toast("Landlord Resides should be yes or no")
            return
        }

        if (!validateBooleanInput(roommatesAllowed)) {
            toast("Roommates Allowed should be yes or no")
            return
        }

        if (!validateBooleanInput(powerSupply)) {
            toast("Power Supply should be yes or no")
            return
        }

        if (!validateDescLength(description)) {
            toast("Description is too short.")
            return
        }

        const newHostelData = {
            landlord_resides: landlordResides.replace(/\s/g, '').toLowerCase(),
            roommates_allowed: roommatesAllowed.replace(/\s/g, '').toLowerCase(),
            description: description.trim(),
            power_supply: powerSupply.replace(/\s/g, '').toLowerCase(),
            available_rooms: Number(availableRooms),
            is_available: Number(availableRooms) > 0 ? true : false
        }

        setLoaderVisible(true)

        const editHostel = await patchHostel(newHostelData, hostelDets?.id)

        setLoaderVisible(false)


        if (editHostel[0] != "200") {
            setErrorText(editHostel[1])
        } else {
            toast("Update Complete")
            router.replace({ pathname: "/hostel/[id]", params: { id: String(hostelDets?.id)} })
            return
        }

        return

    }

    useEffect(() => {
        if (errorText != "") {
            setErrorModal(true)
        } else {
            setErrorModal(false)
        }
    }, [errorText])


    return (
        <SafeAreaProvider style={[globals.container, globals.lightContainer]}>
            <SafeAreaView style={[globals.container, globals.lightContainer]}>
                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                >
                    <View style={[idStyles.headerV, { paddingBottom: 0 }]}>
                        <View style={idStyles.firstHeaderV}>
                            <BackArrow backFun={() => router.back()} large />
                            <Text style={roboto.titleLargeBold}>Update Hostel</Text>
                        </View>
                    </View>
                    <LineBreak />
                    <KeyboardAwareScrollView
                        contentContainerStyle={{
                            flexGrow: 1, paddingBottom: 40
                        }}
                        style={{ flex: 1 }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        enableOnAndroid={true}
                        extraScrollHeight={15}
                    >
                        <ScrollView style={{ flex: 1 }}>
                            <View style={[signupStyles.formPadding, { paddingHorizontal: moderateScale(16) }]}>
                                <Input
                                    label="Number of Available Rooms:"
                                    value={availableRooms}
                                    editable={true}
                                    onChangeText={(text) => { setAvailableRooms(text) }}
                                    keyboardType="number-pad"
                                    onSubmitEditing={() => Keyboard.dismiss()} />
                            </View>
                            <View style={[signupStyles.formPadding, { paddingHorizontal: moderateScale(16) }]}>
                                <Input
                                    label="Landlord Resides:"
                                    value={landlordResides}
                                    editable={true}
                                    onChangeText={(text) => setLandlordResides(text)}
                                    onSubmitEditing={() => Keyboard.dismiss()} />
                            </View>
                            <View style={[signupStyles.formPadding, { paddingHorizontal: moderateScale(16) }]}>
                                <Input
                                    label="Roommates Allowed:"
                                    value={roommatesAllowed}
                                    editable={true}
                                    onChangeText={(text) => setRoommatesAllowed(text)}
                                    onSubmitEditing={() => Keyboard.dismiss()} />
                            </View>
                            <View style={[signupStyles.formPadding, { paddingHorizontal: moderateScale(16) }]}>
                                <Input
                                    label="Power Supply:"
                                    value={powerSupply}
                                    editable={true}
                                    onChangeText={(text) => setPowerSupply(text)}
                                    onSubmitEditing={() => Keyboard.dismiss()} />
                            </View>
                            <View style={[signupStyles.formPadding, { paddingHorizontal: moderateScale(16) }]}>
                                <Input
                                    label="Description:"
                                    value={description}
                                    editable={true}
                                    multilineInput={true}
                                    onChangeText={(text) => setDescription(text)}
                                    returnKeyType="next"
                                    submitBehavior="newline"
                                />
                            </View>


                            <View style={{ padding: moderateScale(16), paddingTop: moderateScale(24) }}>
                                <Select text="Update Hostel" selected selectFun={() => updateHostel()} />
                            </View>
                        </ScrollView>
                        {
                            loaderVisible ? <Loader /> : null
                        }
                        {
                            errorModal ? <ErrorModal text={errorText} errorFun={() => setErrorText("")} /> : null
                        }
                    </KeyboardAwareScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </SafeAreaProvider>
    )
}
