import ListItem from "./ListItem";

const ListContent = (props) => {
  const items = props.data;

  return (
    <div>
      {Object.values(items).map((item, index) => (
        <ListItem index={index} item={item} />
      ))}
    </div>
  );
};

export default ListContent;
