import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from '../components/ui/Buttons.js';
import { FaChevronRight } from 'react-icons/fa';
import Footer from '../components/shared/footer'
import "../styles/notFound.css";

// const floating = {
//     animate: {
//         y: [-10, 10, -10],
//         transition: {
//             duration: 4,
//             repeat: Infinity,
//             ease: "easeInOut",
//         },
//     },
// };

const NotFound = () => {
    return (
	    <>
        <div className="notfound">

            <div className="blur blur1"></div>
            <div className="blur blur2"></div>

            <div className="content">
                <div 
  style={{ 
    display: "flex", 
    alignItems: "flex-end",
		  margin: "24px auto 40px",
    gap: "4px",
		  width: "60%",
    padding: "16px",
    borderBottom: ".5px solid",
    borderImage: "linear-gradient(to right, transparent, green 50%, transparent) 1",
		  borderRadius: "24px"
  }}
>

	    {/* <h1 className='error-code' id='error-code-left'>4</h1>*/}

                    <motion.h1
                        className="error-code"
                        animate={{
                            y: [-15, 15, -15],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                        }}
                    >
                       404
                    </motion.h1>
	    {/* <h1 className='error-code' id='error-code-right'>4</h1> */}
                    {/* <div className="error-divider"></div> */}
                </div>
                <h2>Page Not Found</h2>

                <p>
                    We searched everywhere, but couldn't
                    find the page you're looking for.
                </p>

                <div className="actions">

                    <Button variant="stroke" style={{flexDirection: "row"}}>
                        <Link to="/" className="secondary-btn">
                            Go to Home
                        </Link><FaChevronRight />
                    </Button>
                </div>
            </div>
        </div >
	    <Footer />
	    </>
    );
};

export default NotFound;
