import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Search,
  MapPin,
  Wrench,
  Camera,
  Briefcase,
} from "lucide-react";

import "../styles/notFound.css";

const floating = {
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const NotFound = () => {
  return (
    <div className="notfound">

      {/* Background Blur */}
      <div className="blur blur1"></div>
      <div className="blur blur2"></div>

      {/* Floating Service Cards */}

      <motion.div
        className="floating-card card1"
        {...floating}
      >
        <Camera size={24} />
        <span>Photography</span>
      </motion.div>

      <motion.div
        className="floating-card card2"
        {...floating}
      >
        <Wrench size={24} />
        <span>Repair</span>
      </motion.div>

      <motion.div
        className="floating-card card3"
        {...floating}
      >
        <Briefcase size={24} />
        <span>Jobs</span>
      </motion.div>

      {/* Main Content */}

      <div className="content">

        <motion.div
          className="search-wrapper"
          animate={{
            rotate: [-5, 5, -5],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
          }}
        >
          <Search size={120} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{ duration: 0.8 }}
          className="error-code"
        >
          404
        </motion.h1>

        <h2>Page Not Found</h2>

        <p>
          We searched everywhere, but couldn't
          find the page you're looking for.
        </p>

        <div className="actions">

          <Link to="/" className="primary-btn">
            Back Home
          </Link>

          <button
            className="secondary-btn"
            onClick={() => window.history.back()}
          >
            Go Back
          </button>

        </div>
      </div>

      <motion.div
        className="pin"
        animate={{
          y: [-15, 15, -15],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
        }}
      >
        <MapPin size={50} />
      </motion.div>

    </div>
  );
};

export default NotFound;
