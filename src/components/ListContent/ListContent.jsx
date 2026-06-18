import ListItem from "./ListItem";

const ListContent = ({ data }) => (
  <div>
    {Object.values(data).map((item, index) => (
      <ListItem key={index} index={index} item={item} />
    ))}
  </div>
);

export default ListContent;
