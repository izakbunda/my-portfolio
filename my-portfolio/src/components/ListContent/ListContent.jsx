const projects = {
  project1: {
    name: "project1",
    desc: "this is proj 1",
  },
};

const internships = {
  internship1: {
    name: "internship1",
    desc: "this is internship 1",
  },
};

const clubwork = {
  clubwork1: {
    name: "clubwork1",
    desc: "this is clubwork 1",
  },
};

const ListContent = ({ pageName }) => {
  return (
    <>
      <div>ListContent Header</div>
      <div>{pageName}</div>
    </>
  );
};

export default ListContent;
