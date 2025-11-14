import { Tabs } from "expo-router";


export default function _Layout () {
    return (
        <Tabs
            screenOptions={{
                headerShown: false
            }}>
            <Tabs.Screen 
                name="dashboard"
                options={{
                    title: "Dashboard"
                }}/>

            <Tabs.Screen 
                name="ads"
                options={{
                    title: "Ads"
                }}/>
            
            <Tabs.Screen 
                name="chat"
                options={{
                    title: "Vendor Chat"
                }}/>

            <Tabs.Screen 
                name="profile"
                options={{
                    title: "Vendor Profile"
                }}/>
        </Tabs>
    )
}
