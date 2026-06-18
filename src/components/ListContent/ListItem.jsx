import "./ListContent.css";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

const ListItem = ({ item }) => (
  <div className="list-item-container">
    <h3>{item.name}</h3>
    <div className="list-item-date">{item.date}</div>

    {item.tags && (
      <div className="tags-container">
        {item.tags.map((tag) => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>
    )}

    {item.images && item.images.length > 0 && (
      <div className="carousel-container">
        <Carousel showThumbs={false} showStatus={false} infiniteLoop>
          {item.images.map((image, idx) => (
            <div key={idx}>
              <img src={image} className="item-image" alt={`${item.name} screenshot ${idx + 1}`} />
            </div>
          ))}
        </Carousel>
      </div>
    )}

    <p className="list-item-info">{item.info}</p>

    {item.link && (
      <a href={item.link} target="_blank" rel="noopener noreferrer" className="view-more-link">
        View more here
      </a>
    )}
  </div>
);

export default ListItem;
