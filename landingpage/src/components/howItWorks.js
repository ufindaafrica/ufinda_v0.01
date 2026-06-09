import React from 'react'
import '../styles/services.css'
import { Link } from 'react-router-dom';
import { Button } from './ui/Buttons'
import { DOWNLOADLINK } from '../utils.js'

const howItWorks = () => {
	const handleDownload = () => {                             window.open(DOWNLOADLINK, '_self');
  };

  return (
    <section id="works" className="worksection section">
      <div>
        <h3 className="pagetitle">How it works?</h3>
        <h1 className="pageheading">Step by step <span className="highlightedText">guide</span> to using the App</h1>
        <p className="pagepara">Follow our simple step-by-step guide to get the most out of our app. Whether you are an agent looking to post ads, or a student ready to make purchases, we've broken it down to 3 easy steps to help you get started quickly.</p>
      </div>
      <div className="stepsec">
        <div className="steps">
          <div className="stepL">
            <h3 className="cardtitle">As Agent/Vendor</h3>
            <p className="cardtext">Posting an ad as an agent is easy and it's designed to help you connect with potential buyers. Just follow the three steps to create and publish your ad.</p>
          </div>
          <div className="d-steps">
            <div className="step l">
              <h1 className="stroketext">1</h1>
              <div className="box">
              </div>
              <p>Download the App</p>
            </div>
            <div className="step m">
              <h1 className="stroketext">2</h1>
              <div className="box"></div>
              <p>Sign up as an Agent</p>
            </div>
            <div className="step r">
              <h1 className="stroketext">3</h1>
              <div className="box"></div>
              <p>Post an Ad</p>
            </div>
          </div>
        </div>
        <div className="steps margin-top">
          <div className="stepR">
            <h3 className="cardtitle">Purchase with the App</h3>
            <p className="cardtext">As a buyer using our app is intuitive and userfriendly. Follow the steps to make your first purchase</p>
          </div>
          <div className="Bsteps .reverse">
            <div className="step l">
              <h1 className="stroketext">1</h1>
              <div className="box"></div>
              <p>Download the App</p>
            </div>
            <div className="step m">
              <h1 className="stroketext">2</h1>
              <div className="box"></div>
              <p>Sign up as Student</p>
            </div>
            <div className="step r">
              <h1 className="stroketext">3</h1>
              <div className="box"></div>
              <p>Start purchasing</p>
            </div>
          </div>
        </div>
      </div>
      <div className="videodemo">
        <h3 className="cardtitle" id="video">
          Watch the video tutorial
        </h3>
        <video className='demovideo' controls>
          <source src="" type="" />
        </video>
      </div>
      <Link to="/#hero">
        <Button variant="stroke" onClick={handleDownload}  className="worksBtn">Get the App now!</Button>
      </Link>
      
    </section>
  )
}

export default howItWorks
