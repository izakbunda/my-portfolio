import { useState } from "react";
import ListItem from "./ListItem";
import "./ListContent.css";

const ListContent = ({ data }) => {
  const [activeFilter, setActiveFilter] = useState("All");

  const categories = ["All", ...new Set(data.map((item) => item.category).filter(Boolean))];
  const filtered = activeFilter === "All" ? data : data.filter((item) => item.category === activeFilter);
  const showFilters = categories.length > 1;

  return (
    <div>
      {showFilters && (
        <div className="filter-bar">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-btn${activeFilter === cat ? " filter-btn--active" : ""}`}
              onClick={() => setActiveFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}
      {filtered.map((item, index) => (
        <ListItem key={index} index={index} item={item} />
      ))}
    </div>
  );
};

export default ListContent;
