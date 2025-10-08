import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { FaTelegram } from "react-icons/fa";
import "./About.css";

function About() {
  return (
    <>
      <Container fluid className="about ">
        <Col md={9} sm={6} className="about-header">
          <h1>Остеопат</h1>
          <h2>
            <span>Мануальный</span>
            <span>терапевт</span>
          </h2>
        </Col>
        <Row>
          <Col lg={5} md={10} sm={10} className="about-content">
            <p>
              Дорогие друзья, меня зовут <strong> Александр Челомбиткин</strong>
              ! <br /> Вот несколько интересных фактов обо мне:
            </p>
            <ul>
              <li>
                <i className="list-icon">
                  <IoMdCheckmarkCircleOutline size={25} />
                </i>

                <p>
                  Закончил медицинское училище, педиатрический институт.
                  Появилось желание более серьезной работы. В итоге выбрал
                  специализацию: торакальный хирург, успешно работал
                </p>
              </li>
              <li>
                <i className="list-icon">
                  <IoMdCheckmarkCircleOutline size={25} />
                </i>

                <p>
                  Меня всегда очаровывала мануальная терапия своей
                  загадочностью. В 1998 г. сменил специализацию на неврологию,
                  чтобы заниматься данной практикой
                </p>
              </li>
              <li>
                <i className="list-icon">
                  <IoMdCheckmarkCircleOutline size={25} />
                </i>
                <p>
                  В процессе работы мануальщиком постепенно понял, что касаюсь
                  остеопатии. Поступил в остеопатический институт. Расширил свои
                  знания. На данный момент практикую, как остеопат.
                </p>
              </li>
              <li>
                <i className="list-icon">
                  <IoMdCheckmarkCircleOutline size={25} />
                </i>
                <p>
                  У меня много потрясающих историй, я готов делиться с вами. С
                  удовольствием дам рекомендации по физическим нагрузкам и
                  правильном питании. Подписывайтесь на мой{" "}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://t.me/chelomosteo"
                    className="telegram-link"
                  >
                    <FaTelegram size={20} color="#31babe" /> телеграм-канал
                  </a>{" "}
                  и вы узнаете много нового!
                </p>
              </li>
            </ul>
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default About;
