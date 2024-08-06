import React from "react";
import "./Profile.css";

const Profile = () => {
  const bio1 =
    "I'm a junior at the University of California Los Angeles majoring in Computer Science! I'm interested in delivering high-impact and efficient software projects and creatively solving practical problems using tech! 🤩👨‍💻";
  const bio2 =
    "This past summer, I worked at Hunter Industries as a Software Development Intern, completed summer courses, and worked on personal projects on the side. I've previously worked at Retune (a DevX project), FanSpace (a Creative Labs project), and a start-up, Hussle. I'm an experienced mobile and web developer skilled in React, React Native, Javascript, C++, Python, object oriented programming, data structures, version control (git), and project management. And I'm interested in learning more about operating systems, embedded software, artificial intelligence, and machine learning.";
  const bio3 =
    "If I'm not coding on my computer, you can probably find me reading a book, at the gym, or cooking. 💪";

  return (
    <div className="profile-container">
      <div className="row1">
        <img
          src="/src/assets/headshot.jpg"
          className="profile-image"
          alt="Izak Bunda"
        />
        <div className="profile-info">
          <div className="profile-name">Izak Bunda</div>
          <div className="profile-title">Software Engineer + Creative</div>
          <div className="profile-education">Computer Science, BS. UCLA</div>
          <div className="profile-location">
            <span>📍 Los Angeles, 🏡 San Diego</span>
          </div>
        </div>
      </div>
      <div className="row2">
        <div className="profile-section">
          <h3>Interests</h3>
          <p>frontend, backend, database, and machine learning</p>
        </div>
        <div className="profile-section">
          <div className="header-link">
            <h3>About me</h3>
            {/* <a href="#" className="view-resume-link">
              View resume here
            </a> */}
          </div>
          <p>{bio1}</p>
          <p>{bio2}</p>
          <p>{bio3}</p>
        </div>
        {/* <div className="profile-section">
          <h3>Work history</h3>
          <p>{bio1}</p>
          <p>{bio2}</p>
          <p>{bio3}</p>
        </div> */}
      </div>
    </div>
  );
};

export default Profile;
