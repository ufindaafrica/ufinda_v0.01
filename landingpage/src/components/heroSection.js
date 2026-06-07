import { React } from 'react'
import '../styles/heroSection.css'
import Image from '../assets/Hero.png'
import { Button } from './ui/Buttons.js'
//import  Modal from './Modal.js'
//import DownloadTypes from './downloadTypes.js'
import { FaDownload } from 'react-icons/fa'
// import { useNavigate } from "react-router-dom"

const HeroSection = () => {
  // const navigate = useNavigate();
  // const [ isModalOpen, setIsModalOpen ] = useState(false);

  return (
    <section id="hero" className="herosection section">
      <div>
        <div className="banner">
          Finding verified agents is a lot easier
        </div>
        <h1 className="bannerheading">
          Get hostels from <span className="highlightedText">trusted agents</span> without breaking a sweat
        </h1>
        <p className="herotext">
          As a student, easily find the best hostels through our reliable work of agents, avoid scams and unreliable reviews.
          share your preferences for location and style and get vetted, affordable options and smooth bookings. Even as a Agent/vendor post your ad and get request from students, it's 100% safe.
        </p>
      </div>
      <div className="heroimage">
        <img src={Image} alt="shows three mockups of the app" className="image" />
      </div>
      <div className="herobtns">
        {/* <Button onClick={() => navigate("/download")}
          variant="default" target="_parent">
          Get the App Now!
          <FaChevronDown className="chevron" />
        </Button> */}
        <Button
          variant="default"
          href="expo-link"
          target="_blank"
          className="download-option"
        >
          <FaDownload />
          Direct Download
        </Button>

      </div>
    </section>
  )
}

export default HeroSection
