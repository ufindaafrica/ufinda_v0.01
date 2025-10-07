import React, { useState } from 'react'
import '../styles/contact.css'
import { Button } from './ui/Buttons'
import { FaInstagram, FaLinkedinIn, FaFacebookF } from 'react-icons/fa'

const ContactSection = () => {
  const [showToast, setShowToast] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    const subject = document.getElementById('subject').ariaValue;
    const message = document.getElementById('message').valueOf.replace(/\n/g, '%0D%0a');
    const recipient = process.env.RECIPIENT_EMAIL;
    const emailLink =  `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)} &body=${encodeURIComponent(message)}`;
    window.location.href = emailLink;

    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000)
  }
  return (
    <section id="contact" className="contactsection section">
      <h3 className="title">Contact Us</h3>
      <h1 className="heading">Need help? Reach out to us</h1>
      <p className="para">If you have any questions, feedback, or need assistance with our service, feel free to reach out to us. Our team is here to help you with everything from technicalto general inquiries. we're committed to providing the best possible experience and will respond as quickly as possible.</p>
      <div className="formsection">
        <div className="form " >
          <div className='socialDivider'></div>
          <div className='forminfo'>
            <div className="others">
              <div className="label">Call Us</div>
              <div className="value">+234 808 154 0710</div>
            </div>
            <div className="others">
              <div className="label">Support service</div>
              <div className="value">example@email.com</div>
            </div>
            <div className="others">
              <div className="label socialLabel">Our Socials</div>
                <div className="socials gridspan">
                  <FaInstagram  style={{fontSize: '14px'}}/> 
                  <FaLinkedinIn  style={{fontSize: '14px'}}/>
                  <FaFacebookF  style={{fontSize: '14px'}}/>
                </div>
              </div>
            </div>
        </div>
        <form action="mailto:sarobaridoo@gmail.com" method="post" onSubmit={handleSubmit}>
          <input type="text" id="subject" name="subject" placeholder="subject" />
          <textarea type="text" id="message" name="message" placeholder="Message" />
          <Button type="submit" className="sendmail">Send</Button>
        </form>
        <div id="toast" className={showToast ? 'show': ''}>Message sent successfully!</div>
      </div>

    </section>
  )
}

export default ContactSection