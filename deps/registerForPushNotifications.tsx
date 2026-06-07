import * as Notifications from "expo-notifications"
import * as Device from "expo-device"
import Constants from "expo-constants"
import { toast } from "./toast"
import { Platform } from "react-native"

export const registerForPushNotifications = async () => {

    // check if device is a simulator... if it is, return
    if (!Device.isDevice) {
        console.log("use a physical device")
        return
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#be7c00'
        })
    }

    // check current notificaitons permission status
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    // ask for permission if it is not granted
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
    }

    if (finalStatus !== 'granted') {
        toast("You may miss some message alerts")
        return
    }

    // get the project id
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId
    if (!projectId) console.log("project id not found")

    // Get the token
    const token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId
    })).data
    console.log("token", token)
}
