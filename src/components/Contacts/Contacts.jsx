import "./Contacts.css";
import { Container, Row, Col } from "react-bootstrap";
import YandexMap from "../YandexMap/YandexMap";
import { IoIosPhonePortrait } from "react-icons/io";
import { BsBuildings } from "react-icons/bs";
import { IoMailUnreadOutline } from "react-icons/io5";
import { LiaTelegram } from "react-icons/lia";
import road from "../../videos/RoadTo.mp4";
import { useEffect, useRef, useState } from "react";
import AirDatepicker from "air-datepicker";
import { IMaskInput } from "react-imask";

function Contacts() {
  const [contactFormData, setContactFormData] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
  });

  const contactFormRef = useRef(null);
  const contactPhoneRef = useRef(null);
  const contactDateRef = useRef(null);

  useEffect(() => {
    // Инициализация AirDatepicker
    new AirDatepicker("#contactDateInput", {
      minDate: Date.now(),
      autoClose: true,
      onSelect: function (formattedDate) {
        setContactFormData({
          ...contactFormData,
          date: formattedDate.formattedDate,
        });
      },
    });
  }, [contactFormData]);

  function handleAccept(value, data) {
    setContactFormData((prev) => ({
      ...prev,
      [data.el.input.name]: value,
    }));
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setContactFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    console.log("Submitted data:", contactFormData);
    setContactFormData({});
    if (contactFormRef.current) contactFormRef.current.reset();
    contactFormRef.current.classList.remove("callback-form-active");
  }

  function generateTimeOptions() {
    const times = [];
    let currentTime = new Date();
    currentTime.setHours(9, 0, 0); // Начальное время 9:00

    while (
      currentTime.getHours() < 19 ||
      (currentTime.getHours() === 19 && currentTime.getMinutes() === 0)
    ) {
      const hours = currentTime.getHours().toString().padStart(2, "0");
      const minutes = currentTime.getMinutes().toString().padStart(2, "0");
      times.push(`${hours}:${minutes}`);
      currentTime.setMinutes(currentTime.getMinutes() + 60);
    }

    return times;
  }

  return (
    <Container className="contacts" fluid>
      <Row>
        <Col  className="map">
          <h2> Карта проезда</h2>
          <YandexMap />
        </Col>

      </Row>
      <Row>

        <Col className="contact-form-column">
          <h2> Записаться на приём</h2>
          <form
            ref={contactFormRef}
            className="contact-form"
            onSubmit={handleSubmit}
          >
            <span className="input-name">Имя:</span>
            <input
              type="text"
              className="contact-input"
              name="name"
              onChange={handleChange}
              value={contactFormData.name || ""}
              maxLength={20}
              required
            ></input>
            <span className="input-name">Телефон:</span>
            <IMaskInput
              name="phone"
              type="tel"
              ref={contactPhoneRef}
              mask={"+7 (000) 000-00-00"}
              onAccept={handleAccept}
              value={contactFormData.phone || ""}
              overwrite="shift"
              lazy={false} // Маска видна постоянно
              unmask={false} // Сохраняем маску в значении
              radix="."
              className="contact-input"
              required
            />
            <span className="input-name">Дата:</span>
            <IMaskInput
              id="contactDateInput"
              name="date"
              type="text"
              ref={contactDateRef}
              mask={Date}
              onAccept={handleAccept}
              value={contactFormData.date || ""}
              overwrite="shift"
              lazy={false} // Маска видна постоянно
              unmask={false} // Сохраняем маску в значении
              radix="."
              className="contact-input"
              autoComplete="off"
              required
            />
            <span className="input-name">Время:</span>
            <select
              name="time"
              value={contactFormData.time || ""} // Убедитесь, что значение соответствует value option
              onChange={handleChange}
              className="contact-input"
              required
            >
              <option value="" disabled>
                Выберите время
              </option>
              {generateTimeOptions().map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>

            <button type="submit" className="contact-form-button" onClick={handleSubmit}>
              Отправить
            </button>
          </form>
        </Col>
      </Row>
      <Row className="contact-section">
        <Col className="contact-column">
          <h2> Контакты</h2>

          <p className="contact phone-contact">
            <IoIosPhonePortrait className="contact-icon" />
            <a
              href="tel:+79119577446"
              target="_blank"
              rel="noopener noreferrer"
            >
              +7 (911) 957-74-46
            </a>
          </p>
          <p className="contact adress-contact">
            <BsBuildings className="contact-icon address-icon" />
            <span>192241, Санкт-Петербург, проспект Славы, 52к1</span>
          </p>
          <p className="contact">
            <IoMailUnreadOutline className="contact-icon address-icon" />
            <a
              href="mailto:alexanderchelombitkin@gmail.com"
              className="email-link"
              title="alexanderchelombitkin@gmail.com"
            >
              alexanderchelombitkin@gmail.com
            </a>
          </p>
          <p className="contact">
            <LiaTelegram className="contact-icon address-icon" />
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://t.me/chelomosteo"
              className="telegram-linka"
            >
              https://t.me/chelomosteo
            </a>
          </p>
        </Col>

        <Col >
          <div className="vertical-video-section">
            <h2 className="video-title">Как пройти</h2>
            <div className="vertical-video-wrapper">
              <video
                controls
                muted
                loop
                playsInline
                disablePictureInPicture
                controlsList="nodownload"
                className="vertical-video"
              //poster="/images/vertical-preview.jpg" // Превью 9:16
              >
                <source src={road} type="video/mp4" />
                Ваш браузер не поддерживает видео.
              </video>
            </div>
          </div>
        </Col>
      </Row>


    </Container>
  );
}

export default Contacts;
