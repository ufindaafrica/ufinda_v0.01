import { Tabs } from "expo-router";


export default function _Layout () {
    return (
        <Tabs>
            <Tabs.Screen 
            name="home"
            options={{
                title: "Home"
            }}
            />

            <Tabs.Screen 
            name="saved"
            options={{
                title: "Saved"
            }}
            />

            <Tabs.Screen 
            name="add"
            options={{
                title: "Add"
            }}
            />

            <Tabs.Screen 
            name="chat"
            options={{
                title: "Chat"
            }}
            />

            <Tabs.Screen 
            name="profile"
            options={{
                title: "Profile"
            }}
            />
        </Tabs>
    )
}

