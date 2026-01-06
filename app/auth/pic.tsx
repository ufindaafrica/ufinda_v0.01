import BackArrow from "@/components/back";
import Select from "@/components/select";
import { globals, roboto } from "@/styles/globals";
import { picStyles } from "@/styles/pic";
import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker"
import { studentKyc, vendorKyc } from "@/services/studentKyc";
import Loader from "@/components/loader";
import ErrorModal from "@/components/errorModal";
import { getItemAsync } from "expo-secure-store";
import { userUploadSignature, vendorUploadSignature } from "@/services/uploadSignature";
import { uploadToCloudinary } from "@/services/uploadToCloudinary";
import { toast } from "@/deps/toast";
import AsyncStorage from "@react-native-async-storage/async-storage";


export default function Pic() {

    const [desc, setDesc] = useState("")
    const [descLength, setDescLength] = useState(0)
    const [mode, setMode] = useState<string | null>("")

    const onEnterDesc = (text: string) => {
        setDesc(text)
        setDescLength(text.length)
    }

    const [image, setImage] = useState("")
    const [imageName, setImageName] = useState<any>(null)
    const [imageType, setImageType] = useState("")

    const pickImage = async () => {
        const selectedImage = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            allowsEditing: false,
            aspect: [4, 4],
            quality: 1
        })

        if (!selectedImage.canceled) {
            setImage(selectedImage.assets[0].uri)
            setImageName(selectedImage.assets[0].fileName)
            setImageType("image/" + selectedImage.assets[0].fileName?.split(".").pop()?.toLowerCase())
        }
    }

    const onContinue = async () => {
        
        setLoaderVisible(true)

        let uploadSignature: any

        // get upload pic signature if there is a pic
        if (image) {
            uploadSignature = mode === "user" ? await userUploadSignature() : await vendorUploadSignature()

            if (uploadSignature[0] != "200") {
                setLoaderVisible(false)
                toast("error getting upload signature. try again.")
            }
        }

        // upload to cloudinary
        const cloudinaryUpload = await uploadToCloudinary({ 
            files: [{
                "uri": image,
                "name": imageName,
                "type": imageType
            }], 
            api_key: uploadSignature?.[1]?.api_key,
            cloud_name: uploadSignature?.[1]?.cloud_name,
            folder: uploadSignature?.[1].folder,
            signature: uploadSignature?.[1].signature,
            timestamp: uploadSignature?.[1].timestamp
        })

        if (cloudinaryUpload[0] != "200") {
            setLoaderVisible(false)
            toast("error uploading. try again.")
            return
        }

        // create the json to be sent to the api
        const kycData = {
            profile_img: {
                url: cloudinaryUpload?.[1]?.url,
                public_id: cloudinaryUpload?.[1]?.public_id
            },
            ...(desc && {about_me: desc}),
            ...(mode === "vendor" && {address: await AsyncStorage.getItem("ADDRESS") ?? ""})
        }

        const kyc = mode === "user" ? await studentKyc(kycData) : await vendorKyc(kycData)

        setLoaderVisible(false)

        if (kyc[0] != "200") {
            seterrorModal(true)
            setErrorText(kyc[1])
        }
        else {
            setCorrectModal(true)
            setCorrectText(kyc[1])
        }
    }

    const [loaderVisible, setLoaderVisible] = useState(false)
    const [errorModal, seterrorModal] = useState(true)
    const [errorText, setErrorText] = useState("")
    const [correctModal, setCorrectModal] = useState(false)
    const [correctText, setCorrectText] = useState("")

    useEffect(() => {
        if (errorText != "") {
            seterrorModal(true)
        } else {
            seterrorModal(false)
        }
    }, [errorText])

    useEffect(() => {
        if (correctText != "") {
            setCorrectModal(true)
        } else {
            setCorrectModal(false)
        }
    }, [correctText])

    useEffect(() => {
        const getMode = async () => {
            const mode = await getItemAsync("MODE")
            setMode(mode)
        }
        getMode()
    }, [])

    return (
        <SafeAreaView style={[globals.container]}>

            <View style={picStyles.padding}>
                <BackArrow backFun={() => router.replace(mode === "user" ? "/(tabs)/home" : "/(vendor)/dashboard")} />
            </View>

            <View style={[picStyles.paddingHorizontal]}>
                <Text style={roboto.titleMediumBold}>One more step</Text>
                <Text style={[picStyles.pText, roboto.bodyLarge]}>Now let's communicate your presence, please update your profile.</Text>
            </View>

            <View style={[picStyles.main, picStyles.imgV]}>
                <TouchableOpacity style={picStyles.imgO} onPress={() => pickImage()}>
                    {
                        image ? <Image source={{ uri: image }} style={picStyles.previewImage} />
                            :
                            <Text style={[roboto.bodyMedium, picStyles.fileText]}>Browse files</Text>
                    }
                </TouchableOpacity>
            </View>

            <View style={[picStyles.main, picStyles.paddingHorizontal]}>
                <View style={picStyles.descHeader}>
                    <Text style={[picStyles.descText, roboto.bodySmall]}>Description</Text>
                    <Text style={[picStyles.descText, roboto.bodySmall]}>{descLength.toString()} / 40</Text>
                </View>
                <TextInput
                    placeholder="Tell us about yourself"
                    placeholderTextColor={"#b3b3b3"}
                    style={[picStyles.descInput, roboto.bodyMedium]}
                    maxLength={40}
                    value={desc}
                    onChangeText={(text) => onEnterDesc(text)}
                />
            </View>

            <View style={[picStyles.main, picStyles.paddingHorizontal]}>
                <Select text="Continue" selected clickable={image ? false : true} selectFun={() => onContinue()} />
            </View>

            <Link href={mode === "vendor" ? "/(vendor)/dashboard" : "/(tabs)/home"} style={[picStyles.main, picStyles.linkText, roboto.mediumEmphasizedBold]}>
                I'll do this later
            </Link>

            {
                loaderVisible ? <Loader /> : null
            }

            {
                errorModal ? <ErrorModal text={errorText} errorFun={() => setErrorText("")} /> : null
            }

            {
                correctModal ? <ErrorModal correct text={correctText} errorFun={() => { setCorrectText(""); router.replace("/auth/finishReg") }} /> : null
            }

        </SafeAreaView>
    )
}
