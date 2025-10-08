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
        
        </Col>
        {/* Mobile hero image shown on small screens to avoid text overlapping */}
        <div className="about-hero-mobile" aria-hidden="true" />
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
                  Мой путь в медицине начался с глубокого интереса к естественным наукам. Я окончил медицинское училище и Санкт-Петербургский педиатрический институт, где занимался научной работой. Однако, стремление к более глубокой работе с организмом привело меня сначала в торакальную хирургию, а затем — в неврологию и мануальную терапию, которая очаровала своей загадочностью и эффективностью.
                </p>
              </li>
              <li>
                <i className="list-icon">
                  <IoMdCheckmarkCircleOutline size={25} />
                </i>
                <p>
                  Со временем я понял, что мануальные методы — это часть более целостного подхода, и в 2013 году поступил в остеопатический институт. Для меня остеопатия — это не просто лечение симптомов, это поиск и устранение коренной причины проблемы.
                </p>
              </li>
              <li>
                <i className="list-icon">
                  <IoMdCheckmarkCircleOutline size={25} />
                </i>
                <p>
                  Сегодня в своей практике я гармонично сочетаю структурные техники (работа с телом) и биодинамические (работа с тонкими ритмами и энергиями организма), чтобы помочь телу запустить процессы самовосстановления.
                </p>
              </li>
              <li>
                <i className="list-icon">
                  <IoMdCheckmarkCircleOutline size={25} />
                </i>
                <p>
                  Готов делиться знаниями и давать рекомендации по здоровому образу жизни в своем
                  {" "}
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://t.me/chelomosteo"
                    className="telegram-link"
                  >
                    <FaTelegram size={20} color="#31babe" /> Telegram-канале
                  </a>
                  .
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
