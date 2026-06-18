import "./ListContent.css";

const ListItem = ({ item, index }) => (
  <div className="list-item-container">
    <div className="title-row">
      <span className="project-number">{String(index + 1).padStart(2, "0")}</span>
      <h3 className="project-title">{item.name}</h3>
    </div>

    {item.tags && (
      <div className="tags-container">
        {item.tags.map((tag) => (
          <span key={tag} className="tag" data-tech={tag}>{tag}</span>
        ))}
      </div>
    )}

    {item.images && item.images.length > 0 && (
      <div className="image-row">
        {item.images.map((image, idx) => (
          <img key={idx} src={image} className="item-image" alt={`${item.name} screenshot ${idx + 1}`} />
        ))}
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
