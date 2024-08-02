import React from "react";
import "./Body.css";
import data from "../../assets/Experience.json";

const Body = ({ name }) => {
  const renderTags = (tags) => {
    return (
      <div className="tags-container">
        {tags.map((tag, index) => (
          <span key={index} className="tag">
            {tag}
          </span>
        ))}
      </div>
    );
  };
  const renderContent = (category, items) => {
    return (
      <div>
        {/* <h2>{category}</h2> */}
        {Object.values(items).map((item, index) => (
          <div key={index} className="item-row">
            <h3>{item.name}</h3>
            <div style={{ marginTop: "10px", fontSize: "0.75rem" }}>
              {item.date}
            </div>
            {item.tags && renderTags(item.tags)}
            {item.images && item.images.length > 0 && (
              <div className="images-container">
                {item.images.map((image, idx) => (
                  <img key={idx} src={image} className="item-image" />
                ))}
              </div>
            )}
            <p
              style={{
                paddingBottom: "20px",
                paddingTop: "10px",
              }}
            >
              {item.info}
            </p>

            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="view-more-link"
              >
                View more here
              </a>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="body">
      {name === "Projects" && renderContent("Projects", data.projects)}
      {name === "Internships" && renderContent("Internships", data.internships)}
      {name === "Club-Work" && renderContent("Club-Work", data.club_work)}
    </div>
  );
};

export default Body;
