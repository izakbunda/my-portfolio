import "./ListContent.css";

import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import { useMediaQuery } from "react-responsive";

const ListItem = (props) => {
  const item = props.item;
  const index = props.index;

  const isMobile = useMediaQuery({ maxWidth: 500 });

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

  var settings = {
    dots: true,
    infinite: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    slidesToShow: isMobile ? 1 : 2,
  };

  return (
    <div className="list-item-container">
      <h3>{item.name}</h3>
      <div style={{ marginTop: "10px", fontSize: "0.75rem" }}>{item.date}</div>

      {item.tags && renderTags(item.tags)}

      {item.images && item.images.length > 0 && (
        <div className="carousel-container">
          <Slider
            {...settings}
            style={{
              marginTop: "30px",
              marginBottom: "30px",
            }}
          >
            {item.images.map((image, idx) => (
              <div key={idx}>
                <img src={image} className="item-image" />
              </div>
            ))}
          </Slider>
        </div>
      )}

      <p
        style={{
          fontSize: 16,
          fontFamily: "Helvetica",
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
  );
};

export default ListItem;
