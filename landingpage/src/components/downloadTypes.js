import React from 'react'
import { FaGooglePlay, FaAppStore, FaDownload } from 'react-icons/fa'
import '../styles/downloadTypes.css' 
import { Button } from './ui/Buttons.js'

const downloadTypes = () => {
  return (
    <div className={{display: "flex", flexDirection: "cloumn", gap: "0"}}>
        <Button variant="text" href="expo-link" target="_blank" className="btns"><FaDownload style={{fontSize: "16px", color: "#fcfcfc" }}/>Direct Download</Button>
        <Button variant="text" href="playstore-link" target="_blank" className="btns"><FaGooglePlay style={{fontSize: "16px", color: "#fcfcfc" }}/>Get the app Now!</Button>
        <Button variant="text"  href="appstore-link" target="_blank" className="btns"><FaAppStore style={{fontSize: "16px", color: "#fcfcfc" }}/>Download from AppStore</Button>
    </div>
  )
}

export default downloadTypes