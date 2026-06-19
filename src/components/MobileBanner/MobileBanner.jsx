import "./MobileBanner.css";

const SITE_URL = "https://izakbunda.vercel.app";

const MobileBanner = ({ onDismiss }) => (
  <div className="mobile-banner">
    <button className="mobile-banner-close" onClick={onDismiss}>×</button>
    <p className="mobile-banner-text">Best experienced on desktop.</p>
    <a
      className="mobile-banner-btn"
      href={`mailto:?subject=Portfolio Link&body=Check out Izak's portfolio: ${SITE_URL}`}
    >
      Email me the link
    </a>
  </div>
);

export default MobileBanner;
