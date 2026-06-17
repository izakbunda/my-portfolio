import React from "react";
import ListContent from "../ListContent/ListContent";
import "./Body.css";
import data from "../../assets/Experience.json";

const Body = ({ name }) => {
  return (
    <div className="body">
      {name === "Projects" && <ListContent name={name} data={data.projects} />}
      {name === "Internships" && (
        <ListContent name={name} data={data.internships} />
      )}
      {name === "Club-Work" && (
        <ListContent name={name} data={data.club_work} />
      )}
    </div>
  );
};

export default Body;
