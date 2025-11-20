import { images } from "@/constants/images";
import { moderateScale, scale, verticalScale } from "@/deps/scale";
import { roboto } from "@/styles/globals";
import { Tabs } from "expo-router";
import { Image, Text, View } from "react-native";


const TabIcon = ({ focused, activeImg, inactiveImg, iconTitle }: any) => {
    return (
        <View style={[{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            width: scale(86),
            borderRadius: 25,
            height: verticalScale(44),
        }, focused && {
            backgroundColor: "#008000",
        }, !focused && { width: scale(56) }]}>
            <Image source={focused ? activeImg : inactiveImg} style={{
                width: scale(24),
                height: scale(24),
                marginRight: scale(6)
            }} />
            {focused && <Text style={[{
                color: "#ffffff",
            }, roboto.bodySmall]}>{iconTitle}</Text>}
        </View>
    )
}

export default function _Layout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarShowLabel: false,
                tabBarStyle: {
                    height: verticalScale(68),
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: moderateScale(16),
                    paddingVertical: moderateScale(12),
                    alignContent: "center"
                },
                tabBarItemStyle: {
                    width: "100%",
                    height: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                    paddingVertical: moderateScale(10)
                }
            }}>
            <Tabs.Screen
                name="home"
                options={{
                    title: "Home",
                    tabBarIcon: ({ focused }) =>
                        <TabIcon
                            focused={focused}
                            activeImg={images.activeHome}
                            inactiveImg={images.inactiveHome}
                            iconTitle={"Home"} />
                }}
            />

            <Tabs.Screen
                name="saved"
                options={{
                    title: "Saved",
                    tabBarIcon: ({ focused }) =>
                        <TabIcon
                            focused={focused}
                            activeImg={images.activeSaved}
                            inactiveImg={images.inactiveSaved}
                            iconTitle={"Saved"} />
                }}
            />

            <Tabs.Screen
                name="add"
                options={{
                    title: "Add",
                    tabBarIcon: ({ focused }) =>
                        <TabIcon
                            focused={focused}
                            activeImg={images.activeAdd}
                            inactiveImg={images.inactiveAdd}
                            iconTitle={"Add"} />
                }}
            />

            <Tabs.Screen
                name="chat"
                options={{
                    title: "Chat",
                    tabBarIcon: ({ focused }) =>
                        <TabIcon
                            focused={focused}
                            activeImg={images.activeChat}
                            inactiveImg={images.inactiveChat}
                            iconTitle={"Chat"} />
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profile",
                    tabBarIcon: ({ focused }) =>
                        <TabIcon
                            focused={focused}
                            activeImg={images.activeUser}
                            inactiveImg={images.inactiveUser}
                            iconTitle={"User"} />
                }}
            />
        </Tabs>
    )
}

