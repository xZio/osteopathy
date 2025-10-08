import "./Footer.css";
import { Container } from "react-bootstrap";

function Footer() {
  return (
    <Container fluid className="no-padding">
      <footer className="footer">
        <p className="footer-info">
          Информация на сайте носит исключительно ознакомительный характер. Все
          материалы и цены, размещенные на сайте, не являются публичной офертой,
          определяемой положениями ст. 437 ГК РФ. Для получения точной
          информации необходимо обратиться к специалисту
        </p>

        <p className="footer-text">
          Имеются противопоказания. Необходимо проконсультироваться со
          специалистом
        </p> 
      </footer>
    </Container>
  );
}

export default Footer;
