import React from "react";
import ListContent from "../ListContent/ListContent";
import "./Body.css";
import data from "../../assets/Experience.json";

const Body = ({ name, focus }) => {
  return (
    <div className="body-content">
      {name === "Projects" && <ListContent name={name} data={data.projects} focus={focus} />}
      {name === "Internships" && (
        <ListContent name={name} data={data.internships} focus={focus} />
      )}
      {name === "Club-Work" && (
        <ListContent name={name} data={data.club_work} />
      )}
    </div>
  );
};

export default Body;
