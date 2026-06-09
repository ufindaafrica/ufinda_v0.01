import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom'
//import Navbar from '../components/shared/navbar'
import Footer from '../components/shared/footer'
import HeroSection from '../components/heroSection'
import ServicesSection from '../components/servicesSection'
import HowItWorksSection from '../components/howItWorks'
import AboutSection from '../components/aboutSection'
import ContactUsSection from '../components/contactSection'

function LandingPage () {

    const location = useLocation();

    useEffect(() => {
        const hash = location.hash;
        if (hash) {
            const element = document.getElementById(hash.replace('#', ''));
            if (element) {
                element.scrollIntoView({behaviour: 'smooth'});
                window.scrollBy(0, -80);
            }
        } else {
            window.scrollTo({top: 0, behaviour: 'smooth'});
        }
    }, [location]);
  return (
    <div className="landingpage">
        {/* <Navbar /> */}
        <HeroSection />
        <ServicesSection />
        <HowItWorksSection />
        <AboutSection />
        <ContactUsSection />
        <Footer />
    </div>
  )
}

export default LandingPage
