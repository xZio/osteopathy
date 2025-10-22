import "./Contacts.css";
import "../Forms/FormElements.css";
import YandexMap from "../YandexMap/YandexMap";
import { IoIosPhonePortrait } from "react-icons/io";
import { BsBuildings } from "react-icons/bs";
import { IoMailUnreadOutline } from "react-icons/io5";
import { LiaTelegram } from "react-icons/lia";
import road from "../../videos/RoadTo.mp4";
import { useEffect, useRef, useState } from "react";
import AirDatepicker from "air-datepicker";
import { IMaskInput } from "react-imask";
import { useFormAndValidation } from "../../hooks/useFormAndValidation";
import SuccessPopup from "../SuccessPopup/SuccessPopup";

function Contacts() {
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  
  const {
    values,
    errors,
    touched,
    isValid,
    handleChange,
    handleAccept,
    validateForm,
    resetForm,
    setValues,
    formRef
  } = useFormAndValidation();

  const contactPhoneRef = useRef(null);
  const contactDateRef = useRef(null);

  useEffect(() => {
    // Инициализация AirDatepicker
    new AirDatepicker("#contactDateInput", {
      minDate: Date.now(),
      autoClose: true,
      onSelect: function (formattedDate) {
        setValues({ ...values, date: formattedDate.formattedDate });
      },
    });
  }, [setValues, values]);

  function handleSubmit(e) {
    e.preventDefault();
    
    if (validateForm()) {
      console.log("✅ Форма успешно отправлена:", values);
      resetForm();
      setShowSuccessPopup(true);
    } else {
      console.log("❌ Ошибка валидации формы:", errors);
    }
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
    <div className="contacts">
      <div className="map">
        <h2> Карта проезда</h2>
        <YandexMap />
      </div>
      
      <div className="contact-form-column">
        <h2> Записаться на приём</h2>
        <form
          ref={formRef}
          className="contact-form"
          onSubmit={handleSubmit}
        >
          <span className="input-name">Имя:</span>
          <input
            type="text"
            className={`contact-input ${touched?.name && errors?.name ? 'error' : ''}`}
            name="name"
            onChange={handleChange}
            value={values.name || ""}
            maxLength={20}
            required
          ></input>
          {touched?.name && errors?.name && (<span className="error-message">{errors.name}</span>)}
          <span className="input-name">Телефон:</span>
          <IMaskInput
            name="phone"
            type="tel"
            ref={contactPhoneRef}
            mask={"+7 (000) 000-00-00"}
            onAccept={handleAccept}
            value={values.phone || ""}
            overwrite="shift"
            lazy={false} // Маска видна постоянно
            unmask={false} // Сохраняем маску в значении
            radix="."
            className={`contact-input ${touched?.phone && errors?.phone ? 'error' : ''}`}
            required
          />
          {touched?.phone && errors?.phone && (<span className="error-message">{errors.phone}</span>)}
          <span className="input-name">Дата:</span>
          <IMaskInput
            id="contactDateInput"
            name="date"
            type="text"
            ref={contactDateRef}
            mask={Date}
            onAccept={handleAccept}
            value={values.date || ""}
            overwrite="shift"
            lazy={false} // Маска видна постоянно
            unmask={false} // Сохраняем маску в значении
            radix="."
            className={`contact-input ${touched?.date && errors?.date ? 'error' : ''}`}
            autoComplete="off"
            required
          />
          {touched?.date && errors?.date && (<span className="error-message">{errors.date}</span>)}
          <span className="input-name">Время:</span>
          <select
            name="time"
            value={values.time || ""}
            onChange={handleChange}
            className={`contact-input ${touched?.time && errors?.time ? 'error' : ''}`}
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
          {touched?.time && errors?.time && (<span className="error-message">{errors.time}</span>)}

                   <button type="submit" className={`contact-form-button ${!isValid ? 'disabled' : ''}`} disabled={!isValid} onClick={handleSubmit}>
                     Отправить
                   </button>
        </form>
      </div>
      
      <div className="contact-section">
        <div className="contact-column">
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
        </div>

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
      </div>
      
      <SuccessPopup 
        isOpen={showSuccessPopup} 
        onClose={() => setShowSuccessPopup(false)} 
      />
    </div>
  );
}

export default Contacts;
