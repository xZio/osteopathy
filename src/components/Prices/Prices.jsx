import "./Prices.css";
import YandexMapWidget from "../YandexFeedback/YandexFeedback";
import logo from "../../images/logo.png";

function Prices({ toggleForm }) {
  return (
    <div className="prices">
      <div className="row">
        <div className="col">
          <div className="prices-container">
            <h2>Цены:</h2>
            <p>Взрослые - 7000 рублей</p>
            <p>Дети (до 10 лет) - 6000 рублей</p>
            <ul>
              <h3>В стоимость входит:</h3>
              <li>консультация</li>
              <li>работа специалиста</li>
              <li>рекомендации по физическим нагрузкам и питанию</li>
            </ul>
            <p>Продолжительность: 1 час</p>
            <p>Адрес: СПб, пр. Славы 52, корп.1, кв. 908</p>
            <p className="prices-container-p">Позаботьтесь о своём здоровье!</p>
            <p className="prices-container-p">
              <button onClick={toggleForm} className="prices-container-button">
                Записывайтесь
              </button>{" "}
              прямо сейчас!
            </p>

            <img src={logo} alt="logo" className="prices-logo" />
          </div>
        </div>
        <div className="col prices-row">
          <YandexMapWidget />
        </div>
      </div>
    </div>
  );
}

export default Prices;
