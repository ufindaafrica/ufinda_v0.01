import React from 'react'
import Logo from '../../assets/logo.png'
import { Link } from 'react-router-dom'
import { FaInstagram, FaLinkedinIn, FaFacebookF, FaChevronDown } from 'react-icons/fa'
import { Button } from '../ui/Buttons'
import '../../styles/footer.css'

const footer = () => {
  return (
    <section className="footerSection">
      <div className="FooterLogo">
        <Link to="/#"><img src={Logo} alt="footer logo"  className="footerlogo"/></Link>
      </div>
      <div className="Footernav">
        <ul className="footerlinks">
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
            <FaChevronDown style={{ fontSize: '12px', color: '#6c6c6c' }} />
          </Button>
        </div>
        <div className="socialLinks">
          <FaInstagram className='socialLink' /> 
          <FaLinkedinIn className='socialLink' />
          <FaFacebookF className='socialLink' />
        </div>
        <div className="Terms">
          <Button variant="stroke" className="btn">Terms and Condition</Button>
        </div>
      </div>
    </section>
  )
}

export default footer