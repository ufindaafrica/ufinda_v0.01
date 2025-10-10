import React from 'react'
import Image from '../assets/aboutImage.png'
import '../styles/about.css'

const aboutSection = () => {
  return (
    <section id="about" className="aboutsection section">
      <div>
        <h3 className="pagetitle about-title">Who are we?</h3>
        <h1 className="pageheading about-title">Let's introduce you to <span className="highlightedText">uFinda</span></h1>
        <p className="pagepara">If you have any questions, feedback, or need assistance with our service, feel free to reach out, our team is here to help you with everything from technicalto general inquiries. we're committed to providing the best possible experience and will respond as quickly as possible.</p>
      </div>
      <div className="aboutImage">
        <img src={Image} alt="uFinda splashscreen" className="splash" />
      </div>
    </section>
  )
}

export default aboutSection