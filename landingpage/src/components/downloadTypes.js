import React from "react";
import { FaGooglePlay, FaAppStore, FaDownload } from "react-icons/fa";
import "../styles/downloadTypes.css";
import { Button } from "./ui/Buttons";

const DownloadTypes = () => {
  return (
    <div className="download-container">
      <Button
        variant="default"
        href="expo-link"
        target="_blank"
        className="download-option"
      >
        <FaDownload />
        Direct Download
      </Button>

      <Button
        variant="stroke"
        href="playstore-link"
        target="_blank"
        className="download-option"
      >
        <FaGooglePlay />
        Google Play Store
      </Button>

      <Button
        variant="stroke"
        href="appstore-link"
        target="_blank"
        className="download-option"
      >
        <FaAppStore />
        Apple App Store
      </Button>
    </div>
  );
};

export default DownloadTypes;
