import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import "./Symptoms.css";

function Symptoms({ toggleForm }) {
  return (
    <div className="symptoms">
      <div className="symptoms-content">
        <h2>Симптомы и заболевания</h2>

        <ul>
          <li>
            <i className="list-icon">
              <IoMdCheckmarkCircleOutline size={25} />
            </i>
            <div className="symptoms-text">
              <p>
                <strong>
                  Остеопатические техники могут предотвратить развитие таких
                  серьезных заболеваний, как:
                </strong>
              </p>
              <ul className="symptoms-sublist">
                <li>онкология</li>
                <li>инфаркт</li>
                <li>инсульт</li>
              </ul>
            </div>
          </li>

          <li>
            <i className="list-icon">
              <IoMdCheckmarkCircleOutline size={25} />
            </i>
            <div className="symptoms-text">
              <p>
                <strong>
                  Успешно помогает справиться с последствиями лечения онкологии,
                  такими как химиотерапия
                </strong>
              </p>
            </div>
          </li>

          <li>
            <i className="list-icon">
              <IoMdCheckmarkCircleOutline size={25} />
            </i>
            <div className="symptoms-text">
              <p>
                <strong>
                  Хороший эффект дает остеопатия в педиатрии, она помогает
                  устранять:
                </strong>
              </p>
              <ul className="symptoms-sublist">
                <li>последствия повреждений после родов</li>
                <li>нарушения речи и сна</li>
                <li>энурез</li>
                <li>задержку психомоторного развития</li>
                <li>и многие другие проблемы малышей</li>
              </ul>
            </div>
          </li>

          <li>
            <i className="list-icon">
              <IoMdCheckmarkCircleOutline size={25} />
            </i>
            <div className="symptoms-text">
              <p>
                <strong>
                  Остеопатия может быть эффективной в лечении некоторых
                  заболеваний, таких как:
                </strong>
              </p>
              <ul className="symptoms-sublist">
                <li>боли в спине</li>
                <li>головные боли</li>
                <li>артрит</li>
                <li>остеохондроз</li>
                <li>грыжи и протрузии</li>
                <li>бесплодие и половая дисфункция</li>
                <li>эндокринные расстройства</li>
                <li>проблемы с пищеварением</li>
                <li>нарушения сна и настроения</li>
                <li>двигательные расстройства</li>
                <li>сосудистые патологии</li>
                <li>многие женские заболевания</li>
                <li>проблемы во время беременности и после родов</li>
              </ul>
            </div>
          </li>
        </ul>

        <div className="symptoms-contact">
          <p>Не откладывайте на потом -</p>
          <button onClick={toggleForm} className="symptoms-contact-button">
            Записывайтесь на приём
          </button>
        </div>
      </div>
    </div>
  );
}

export default Symptoms;
