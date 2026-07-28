import React from 'react'
import Logo from '../../assets/logo.png'
import { Link } from 'react-router-dom'
import { FaInstagram, FaLinkedinIn, FaXTwitter, FaChevronDown, FaFacebook } from 'react-icons/fa6'
import { Button } from '../ui/Buttons'
import { X_PROFILE, INSTAGRAM_PROFILE, LINKEDIN_PROFILE,FACEBOOK_PROFILE } from '../../utils.js'
import '../../styles/footer.css'


const footer = () => {

  return (
    <section className="footerSection">
      <div className="FooterLogo">
        <Link to="/#"><img src={Logo} alt="footer logo" className="footerlogo" /></Link>
      </div>
      <div className="Footernav">
        <ul className="footerlink">
          <li><Link to="/#home" className="footerLinks">Home</Link></li>
          <li className="servicesLinks">
            <span>Services</span>
            <ul className='sub-menu'>
              <li><Link to="/#services" className="footerLinks">What we do</Link></li>
              <li><Link to="/#works" className="footerLinks">How it Works</Link></li>
            </ul>
          </li>
          <li><Link to="/#about" className="footerLinks" >About</Link></li>
          <li><Link to="/#contact" className="footerLinks" >Contact Us</Link></li>
        </ul>
      </div>
      <div className="divider"></div>
      <div className="otherlinks">
        <div className="Lang">
          <Button variant="stroke">
            English
            <FaChevronDown style={{ fontSize: '14px', color: '#008000' }} />
          </Button>
        </div>
        <div className="socialLinks">
 <a href={INSTAGRAM_PROFILE} className='link'> <FaInstagram className='socialLink' /></a>
         <a href={LINKEDIN_PROFILE} className='link'> <FaLinkedinIn className='socialLink' href={LINKEDIN_PROFILE} /></a>
         <a href={X_PROFILE} className='link'> <FaXTwitter className='socialLink' /></a>
         <a href={FACEBOOK_PROFILE} className='link'> <FaFacebook className='socialLink' /></a>
        </div>
        
        <div className="Terms">
          <Button variant="stroke" className="btn">Terms and Condition</Button>
        </div>
      </div>
    </section>
  )
}

export default footer
