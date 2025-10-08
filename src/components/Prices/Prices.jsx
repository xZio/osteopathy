import "./Prices.css";
import YandexMapWidget from "../YandexFeedback/YandexFeedback";
import { Container, Row, Col } from "react-bootstrap";
import logo from "../../images/logo.png";

function Prices({ toggleForm }) {
  return (
    <Container className="prices" fluid>
      <Row>
        <Col>
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
        </Col>
        <Col xs={10} md={6} className="prices-row">
          <YandexMapWidget />
        </Col>
      </Row>
    </Container>
  );
}

export default Prices;
