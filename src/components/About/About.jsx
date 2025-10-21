/* Replaced react-bootstrap layout with plain divs */
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { FaTelegram } from "react-icons/fa";
import "./About.css";
import avatarPhoto from "../../images/avatar-Photoroom.png";

function About() {
  return (
    <div className="about">
      <h1 className="about-header">Биодинамическая остеопатия</h1>
      <div className="about-avatar" aria-hidden="true">
        <img
          src={avatarPhoto}
          alt="Аватар врача"
          loading="lazy"
          decoding="async"
          sizes="(max-width: 575px) 85vw, (max-width: 1000px) 70vw, 300px"
        />
      </div>
      {/* Legacy mobile hero kept for larger breakpoints; hidden by CSS on small */}
      <div className="about-hero-mobile" aria-hidden="true" />
      <div className="about-content">
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
              Мой путь в медицине начался с глубокого интереса к естественным
              наукам. Я окончил медицинское училище и Санкт-Петербургский
              педиатрический институт, где занимался научной работой. Однако,
              стремление к более глубокой работе с организмом привело меня
              сначала в торакальную хирургию, а затем — в неврологию и
              мануальную терапию, которая очаровала своей загадочностью и
              эффективностью.
            </p>
          </li>
          <li>
            <i className="list-icon">
              <IoMdCheckmarkCircleOutline size={25} />
            </i>
            <p>
              Со временем я понял, что мануальные методы — это часть более
              целостного подхода, и в 2013 году поступил в остеопатический
              институт. Для меня остеопатия — это не просто лечение симптомов,
              это поиск и устранение коренной причины проблемы.
            </p>
          </li>
          <li>
            <i className="list-icon">
              <IoMdCheckmarkCircleOutline size={25} />
            </i>
            <p>
              Сегодня в своей практике я гармонично сочетаю структурные техники
              (работа с телом) и биодинамические (работа с тонкими ритмами и
              энергиями организма), чтобы помочь телу запустить процессы
              самовосстановления.
            </p>
          </li>
          <li>
            <i className="list-icon">
              <IoMdCheckmarkCircleOutline size={25} />
            </i>
            <p>
              Готов делиться знаниями и давать рекомендации по здоровому образу
              жизни в своем{" "}
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
      </div>
    </div>
  );
}

export default About;
