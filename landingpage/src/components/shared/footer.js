import React from 'react'
import Logo from '../../assets/logo.png'
import { Link } from 'react-router-dom'
import { FaInstagram, FaLinkedinIn, FaXTwitter, FaChevronDown } from 'react-icons/fa6'
import { Button } from '../ui/Buttons'
import { X_PROFILE, INSTAGRAM_PROFILE, LINKEDIN_PROFILE } from '../../utils.js'
import '../../styles/footer.css'


  const handle_XTwitter = () => {
    window.open(X_PROFILE, '_blank');
  };                                                                                                    const handle_INSTAGRAM = () => {
    window.open(INSTAGRAM_PROFILE, '_blank');
  };

  const handle_Linkedin = () => {
    window.open(LINKEDIN_PROFILE, '_blank');
  };

const footer = () => {

  // const XTwitter = process.env.X_PROFILE;
  // const Instagram = process.env.INSTAGRAM_PROFILE;
  // const LinkedIn = process.env.LINKEDIN_PROFILE;

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
            <FaChevronDown style={{ fontSize: '14px', color: '#6c6c6c' }} />
          </Button>
        </div>
        <div className="socialLinks">
 <a href={INSTAGRAM_PROFILE} className='link'> <FaInstagram className='socialLink' /></a>
         <a href={LINKEDIN_PROFILE} className='link'> <FaLinkedinIn className='socialLink' href={LINKEDIN_PROFILE} /></a>
         <a href={X_PROFILE} className='link'> <FaXTwitter className='socialLink' /></a>
        </div>
        {/* <div className="socialLinks">
          <Button
            variant="text"
            onClick={handle_INSTAGRAM}
            target="_blank"
            className='footerBtn'
          >
            <FaInstagram className='socialLink' />
          </Button>

          <Button
            variant="text"
            onClick={handle_Linkedin}
            target="_blank"
            className='footerBtn'

          >
            <FaLinkedinIn className='socialLink' />
          </Button>
          <Button
            variant="text"
            onClick={handle_XTwitter}
            target="_blank"
            className='footerBtn'
          >
            <FaXTwitter className='socialLink' />
          </Button>

        </div> */}
        <div className="Terms">
          <Button variant="stroke" className="btn">Terms and Condition</Button>
        </div>
      </div>
    </section>
  )
}

export default footer
