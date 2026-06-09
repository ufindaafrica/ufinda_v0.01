import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from '../components/ui/Buttons.js';
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
        <div className="notfound">

            <div className="blur blur1"></div>
            <div className="blur blur2"></div>

            <div className="content">
                <div style={{ display: "flex", alignItems: "bottom", gap: "4px", borderBottom: "1px solid lightgrey", borderRadius: "50%", padding: "16px" }}>
                    <h1 className='error-code' id='error-code-left'>4</h1>

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
                        0
                    </motion.h1>
                    <h1 className='error-code' id='error-code-right'>4</h1>
                    {/* <div className="error-divider"></div> */}
                </div>
                <h2>Page Not Found</h2>

                <p>
                    We searched everywhere, but couldn't
                    find the page you're looking for.
                </p>

                <div className="actions">

                    <Button variant="stroke" >
                        <Link to="/" className="primary-btn">
                            Go to Home
                        </Link>
                    </Button>
                </div>
            </div>
        </div >
    );
};

export default NotFound;
