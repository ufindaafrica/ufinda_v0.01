import React, { useState } from 'react'
import '../styles/contact.css'
import { Button } from './ui/Buttons'
import { FaInstagram, FaLinkedinIn, FaFacebookF } from 'react-icons/fa'

const ContactSection = () => {
  const [showToast, setShowToast] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [subjectErr, setSubjectErr] = useState(false);
  const [messageErr, setMessageErr] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    let hasError = false;

    setSubjectErr(false);
    setMessageErr(false);

    if (message.trim()=== '') {
      setMessageErr(true);
      hasError = true;
    }
    if (subject.trim()=== '') {
      setSubjectErr(true);
      hasError = true;
    }
    if (hasError) {
      return;
    }

    const recipient = 'Barry@ufinda.org';
    const encodedURI = encodeURIComponent(recipient);
    const encodedSubject = encodeURIComponent(subject);
    const encodedMessage = encodeURIComponent(message.replace(/\n/g, '%0D%0A'));
    const emailLink = `mailto:${encodedURI}?subject=${encodedSubject}&body=${encodedMessage}`;
    window.location.href = emailLink;

    setShowToast(true);
    setTimeout(() => {
      setShowToast(false)
    }, 3000)

    //reset the form field
    setSubject('');
    setMessage('');
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
              <div className="value">+234 808 154 0710 <br/>+234 906 791 4516</div>
            </div>
            <div className="others">
              <div className="label">Email</div>
              <div className="value">support@ufinda.org</div>
            </div>
            <div className="others gridspan">
              <div className="label socialLabel">Our Socials</div>
                <div className="socials gridspan">
                  <FaInstagram  style={{fontSize: '18px'}}/>
                  <FaLinkedinIn  style={{fontSize: '18px'}}/>
                  <FaFacebookF  style={{fontSize: '18px'}}/>
                </div>
              </div>
            </div>
        </div>
        <form onSubmit={handleSubmit}>
          <input type="text" id="subject" name="subject" placeholder="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className={subjectErr ? 'Field cannot be empty' : ''}/>
          <textarea type="text" id="message" name="message" placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} className={messageErr ? 'Field cannot be empty' : ''} />
          <Button type="submit" className="sendmail">Send</Button>
        </form>
        <div id="toast" className={showToast ? 'show': ''}>Message sent successfully!</div>
      </div>

    </section>
  )
}

export default ContactSection
