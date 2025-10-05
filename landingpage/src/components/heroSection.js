import React from 'react'
import '../styles/heroSection.css'
import Image from '../assets/Hero.png'
import { Button } from './ui/Buttons.js'
import { FaGooglePlay, FaAppStore } from 'react-icons/fa'

const heroSection = () => {
  return (
    <section id="hero" className="herosection section">
      <div>
        <div className="banner">
          Finding verified agents is a lot easier, avoid the hassle with uFinda
        </div>
        <h1 className="bannerheading">
          Get hostels from trusted agents without breaking a sweat
        </h1>
        <p className="herotext">
          As a student,easily find the best hostels through our reliable work of agents, avoid scams and unreliable reviews. 
          share your preferences for location and style and get vetted, affordable options and smooth bookings.Even as a Agent/vendor post your ad and get request from students, totally safe.
        </p>
      </div>
      <div className="heroimage">
        <img src={Image} alt="shows three mockups of the app" className="image"/>
      </div>
      <div className="herobtns">
        <Button variant="default" href="playstorelink" target="_blank" className="btns"><FaGooglePlay style={{fontSize: "16px", color: "#fcfcfc" }}/>Download from PlayStore</Button>
        <Button variant="default"  href="appstorelink" target="_blank" className="btns"><FaAppStore style={{fontSize: "16px", color: "#fcfcfc" }}/>Download from AppStore</Button>
      </div>
    </section>
  )
}

export default heroSection