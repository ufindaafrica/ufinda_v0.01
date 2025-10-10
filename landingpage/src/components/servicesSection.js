// import React from 'react'
// import { Button } from './ui/Buttons'
// import Image from '../assets/servicesImage.png'
// import '../styles/services.css'

// const servicesSection = () => {
//   return (
//     <section id="services" className="servicesection section">
//       <div>
//         <h3 className="pagetitle">What we do?</h3>
//         <h1 className="pageheading">We connect students to <span className="highlightedText">reliable</span> and trusted Vendors</h1>
//         <p className="pagepara">At uFinda we connect students looking for hostels/products with reliable and trusted Agents/vendors. Our platform bridges the gap between students and verified vendors, ensuring safe and convenient transactions for all your daily needs from hostels to everday essentials.</p>
//         <Button variant="default" className="serviceBtn">Get the App</Button>
//       </div>

//       <div className="content" id="content-large-width">
//         <div className="services">
//           <div className="left top">
//             <div className="servicebox">
//             <h2>Meet verified Agent/Vendor</h2>
//             <p>Discover and connect with agents who have been thoroughly verified to provide quality services and products tailored to students life</p>
//           </div>
//           <div className="servicebox">
//             <h2>Buy and sell from other students</h2>
//             <p>Easily buy and sell items to fellow students, from used textbooks and electronics, to furniture, all within a trusted community enviroment</p>
//           </div>
//         </div>
//         {/* <svg width="120" height="80">
//           <path d="M0 40 H60 V0" stroke="#66666" strokeWidth="2" fill="transparent" />
//         </svg> */}
//         <div>
//           {/* <div className="background"></div> */}
//           <img src={Image} alt="uFinda screen display hostels" className="servicesImage"/>
//         </div>         

//           <div className="right">
//             <div className="servicebox">
//             <h2>Become An agent/Vendor</h2>
//             <p>Sign up and complete the verification process to become a verified Agent or Vendor, and expand your reach to students looking for your services</p>
//           </div>
//           <div className="servicebox">
//             <h2>Get fair Price for anything and everything</h2>
//             <p>Enjoy transparent pricing where everything is fairly valued, by negotiating with our chat feature, you save money on the best deals </p>
//           </div>
//           </div>
//         </div>
//         </div>
//       <div className="content-small" id="content-small-width">
//         <div>
//           {/* <div className="background"></div> */}
//           <img src={Image} alt="uFinda screen display hostels" className="servicesImage"/>
//         </div>
//         <div className="services">
//             <div className="servicebox">
//             <h2>Meet verified Agent/Vendor</h2>
//             <p>Discover and connect with agents who have been thoroughly verified to provide quality services and products tailored to students life</p>
//           </div>
//           <div className="servicebox">
//             <h2>Buy and sell from other students</h2>
//             <p>Easily buy and sell items to fellow students, from used textbooks and electronics, to furniture, all within a trusted community enviroment</p>
//           </div>      

//             <div className="servicebox">
//             <h2>Become An agent/Vendor</h2>
//             <p>Sign up and complete the verification process to become a verified Agent or Vendor, and expand your reach to students looking for your services</p>
//           </div>
//           <div className="servicebox">
//             <h2>Get fair Price for anything and everything</h2>
//             <p>Enjoy transparent pricing where everything is fairly valued, by negotiating with our chat feature, you save money on the best deals </p>
//           </div>
//       </div>
//     </div>
//   </section>
//   )
// }

// export default servicesSection

import React, { useRef } from 'react'
import { Button } from './ui/Buttons'
import Image from '../assets/servicesImage.png'
import '../styles/services.css'
import { IsVisible } from './middleware/isvisible'

const ServicesSection = () => {
  const sectionRef = useRef(null);
  IsVisible(sectionRef);

  return (
    <section id="services" className="servicesection section" ref={sectionRef}>
      <div>
        <h3 className="pagetitle">What we do?</h3>
        <h1 className="pageheading">We connect students to <span className="highlightedText">reliable</span> and trusted Vendors</h1>
        <p className="pagepara">At uFinda we connect students looking for hostels/products with reliable and trusted Agents/vendors. Our platform bridges the gap between students and verified vendors, ensuring safe and convenient transactions for all your daily needs from hostels to everday essentials.</p>
        <Button variant="default" className="serviceBtn">Get the App</Button>
      </div>

      <div className="content" id="content-large-width">
        <div className="services">
          <div className="left top">
            <div className="servicebox">
              <h2>Meet verified Agent/Vendor</h2>
              <p>Discover and connect with agents who have been thoroughly verified to provide quality services and products tailored to students life</p>
            </div>
            <div className="servicebox">
              <h2>Buy and sell from other students</h2>
              <p>Easily buy and sell items to fellow students, from used textbooks and electronics, to furniture, all within a trusted community enviroment</p>
            </div>
          </div>
          {/* <svg width="120" height="80">
          <path d="M0 40 H60 V0" stroke="#66666" strokeWidth="2" fill="transparent" />
        </svg> */}
          <div>
            {/* <div className="background"></div> */}
            <img src={Image} alt="uFinda screen display hostels" className="servicesImage" />
          </div>

          <div className="right">
            <div className="servicebox">
              <h2>Become An agent/Vendor</h2>
              <p>Sign up and complete the verification process to become a verified Agent or Vendor, and expand your reach to students looking for your services</p>
            </div>
            <div className="servicebox">
              <h2>Get fair Price for anything and everything</h2>
              <p>Enjoy transparent pricing where everything is fairly valued, by negotiating with our chat feature, you save money on the best deals </p>
            </div>
          </div>
        </div>
      </div>
      <div className="content-small" id="content-small-width">
        <div>
          {/* <div className="background"></div> */}
          <img src={Image} alt="uFinda screen display hostels" className="servicesImage" />
        </div>
        <div className="services">
          <div className="servicebox">
            <h2>Meet verified Agent/Vendor</h2>
            <p>Discover and connect with agents who have been thoroughly verified to provide quality services and products tailored to students life</p>
          </div>
          <div className="servicebox">
            <h2>Buy and sell from other students</h2>
            <p>Easily buy and sell items to fellow students, from used textbooks and electronics, to furniture, all within a trusted community enviroment</p>
          </div>

          <div className="servicebox">
            <h2>Become An agent/Vendor</h2>
            <p>Sign up and complete the verification process to become a verified Agent or Vendor, and expand your reach to students looking for your services</p>
          </div>
          <div className="servicebox">
            <h2>Get fair Price for anything and everything</h2>
            <p>Enjoy transparent pricing where everything is fairly valued, by negotiating with our chat feature, you save money on the best deals </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ServicesSection