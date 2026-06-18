import "./Profile.css";

const Profile = () => {
  const bio1 =
    "Hi, my name is Izak 😄 I'm a software engineer at KPMG, where I architect and develop advanced AI-driven solutions that empower teams to automate complex workflows, extract meaningful insights from data, and make more strategic decisions. My work centers on translating cutting-edge AI capabilities into scalable, high-impact products that transform and optimize day-to-day operations.";
  const bio2 =
    "I studied Computer Science at UCLA, where I became interested in how technology can be designed and applied to solve real-world problems and create intuitive user experiences.";
  const bio3 =
    "I enjoy working at the intersection of engineering and product: building tools, thinking through how people actually use them, and shaping solutions that deliver real value for the teams and organizations using them.";

  const tags = ["AI", "LLM", "full-stack", "product"];

  return (
    <div className="profile-container">
      <div className="row1">
        <img src="/headshot.jpg" className="profile-image" alt="Izak Bunda" />
        <div className="profile-info">
          <div className="profile-name">Izak Bunda</div>
          <div className="profile-title">AI Software Engineer @ KPMG</div>
          <div className="profile-education">Computer Science, BS. UCLA</div>
          <div className="profile-location">
            <span>📍 Denver, CO - 🏠 San Diego, CA</span>
          </div>
        </div>
      </div>
      <div className="row2">
        <div className="profile-section">
          <h3>Interests</h3>
          <div className="profile-tags-container">
            {tags.map((tag) => (
              <span key={tag} className="tag-profile">{tag}</span>
            ))}
          </div>
        </div>
        <div className="profile-section">
          <h3>About me</h3>
          <p>{bio1}</p>
          <p>{bio2}</p>
          <p>{bio3}</p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
