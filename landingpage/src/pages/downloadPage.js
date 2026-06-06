import DownloadTypes from "../components/downloadTypes";
import '../styles/downloadPage.css'

const DownloadPage = () => {
  return (
    <div className="download-page">
	  <div className="download-page-title">
	  <h2>Download File</h2>
	  <p>file size <span className="size">122MB</span></p>
	  </div>
      <DownloadTypes />
    </div>
  );
};

export default DownloadPage;
