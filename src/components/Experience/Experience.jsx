import "./Experience.css";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import Certificates from "../Certificates/Certificates";
import { institutionList } from "../../data/education";

function Experience() {
  return (
    <div className="no-padding">
      <div className="experience-section">
        <div className="experience">
          <h1 className="expierence-header"> Образование и опыт работы:</h1>
          <ul>
            {institutionList.map((el, index) => {
              return (
                <li key={index} className="li-item">
                  <div className="expierence-list-icon">
                    <IoMdCheckmarkCircleOutline size={25} />
                    <span>{el.year}</span>
                  </div>
                  <p className="expierence-list-text">{el.name} </p>
                </li>
              );
            })}
          </ul>
        </div>
        <Certificates />
      </div>
    </div>
  );
}

export default Experience;
