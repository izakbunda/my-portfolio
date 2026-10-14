import { useEffect, useRef, useState } from "react";
import ListItem from "./ListItem";
import { matchesItem } from "../../lib/deepLinks";
import "./ListContent.css";

const ListContent = ({ data, focus }) => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [highlighted, setHighlighted] = useState(null);
  const itemRefs = useRef({});

  // Deep link / chat link: show everything, scroll to the item, flash it.
  useEffect(() => {
    if (!focus?.item) return;
    const target = data.find((item) => matchesItem(item.name, focus.item));
    if (!target) return;
    setActiveFilter("All");
    setHighlighted(target.name);
    const frame = requestAnimationFrame(() =>
      itemRefs.current[target.name]?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
    const timer = setTimeout(() => setHighlighted(null), 2400);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [focus?.n, focus?.item, data]);

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
        <div
          key={item.name}
          ref={(el) => (itemRefs.current[item.name] = el)}
          className={highlighted === item.name ? "list-item-highlight" : undefined}
        >
          <ListItem index={index} item={item} />
        </div>
      ))}
    </div>
  );
};

export default ListContent;
