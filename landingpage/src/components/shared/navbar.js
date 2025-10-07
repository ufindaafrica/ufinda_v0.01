import React, { useState } from 'react';
import Logo from '../../assets/logo.png';
import { Link } from 'react-router-dom';
import { FaChevronDown, FaBars, FaTimes } from 'react-icons/fa';
import '../../styles/navbar.css';

function Navbar() {
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);

  const toggleDropdown = () => {
    setIsServicesOpen(!isServicesOpen);
  };

  const handleServiceClick = () => {
    setIsServicesOpen(false);
    setIsMobileView(false);
  };

  const handleMobileMenu = () => {
    setIsMobileView(!isMobileView);
  };

  const handleLinkClick = () => {
    setIsMobileView(false);
  };

  return (
    <section className="navbar">
      <div className="logo-div">
        <Link to="/">
          <img src={Logo} alt="logo" className="logo" />
        </Link>
      </div>
      <nav className="nav-links">
        <div className="mobile-toggle" onClick={handleMobileMenu}>
          {isMobileView ? <FaTimes /> : <FaBars />}
        </div>
        <ul className={`nav-list ${isMobileView ? 'mobile-view' : ''}`}>
          <li>
            <Link to="/#hero" onClick={handleLinkClick} className="link">
              Home
            </Link>
          </li>
          <li className="services-link">
            <span onClick={toggleDropdown} className="link services-toggle">
              Services <FaChevronDown style={{ fontSize: '12px', color: '#6c6c6c', fontWeight: '200' }} />
            </span>
            {isServicesOpen && (
              <ul className="dropdown-menu">
                <li>
                  <Link to="/#services" onClick={handleServiceClick} className="link">
                    What we do
                  </Link>
                </li>
                <li>
                  <Link to="/#works" onClick={handleServiceClick} className="link">
                    How it Works
                  </Link>
                </li>
              </ul>
            )}
          </li>
          <li>
            <Link to="/#about" onClick={handleLinkClick} className="link">
              About
            </Link>
          </li>
          <li>
            <Link to="/#contact" onClick={handleLinkClick} className="link">
              Contact Us
            </Link>
          </li>
        </ul>
      </nav>
    </section>
  );
}

export default Navbar;