import "./CallbackForm.css";
import "../Forms/FormElements.css";
import { RiPhoneFill } from "react-icons/ri";
import { useRef, useEffect, useState } from "react";
import { IMaskInput } from "react-imask";
import AirDatepicker from "air-datepicker";
import "air-datepicker/air-datepicker.css";
import { useClickOutside } from "../../hooks/useClickOutside";
import { useFormAndValidation } from "../../hooks/useFormAndValidation";
import SuccessPopup from "../SuccessPopup/SuccessPopup";

function CallbackForm({ toggleForm, isFormOpen }) {
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const {
    values,
    handleChange,
    handleAccept,
    errors,
    touched,
    isValid,
    setValues,
    validateForm,
    resetForm,
    formRef
  } = useFormAndValidation();

  const phoneRef = useRef(null);
  const dateRef = useRef(null);

  useEffect(() => {
    if (isFormOpen) {
      // Инициализация AirDatepicker
      new AirDatepicker("#dateInput", {
        minDate: Date.now(),
        autoClose: true,
        onSelect: function (formattedDate) {
          setValues({ ...values, date: formattedDate.formattedDate });
        },
      });
    }
  }, [setValues, values, isFormOpen]);

  useEffect(() => {
    const form = formRef.current;
    const overlay = document.querySelector(".callback-overlay");
    if (isFormOpen && form) {
      form.classList.add("callback-form-active");
      overlay.classList.add("callback-overlay-active");
    } else if (form) {
      form.classList.remove("callback-form-active");
      overlay.classList.remove("callback-overlay-active");
    }
  }, [isFormOpen, formRef]);

  // Обработчик клавиши ESC для закрытия формы
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isFormOpen) {
        toggleForm();
      }
    };

    if (isFormOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFormOpen, toggleForm]);

  useClickOutside(formRef, (e) => {
    const calendar = document.querySelector(".air-datepicker-nav");

    if (!calendar && !e.target.closest(".callback-button") && isFormOpen) {
      toggleForm();
    }
  });

  /*  function handleAccept(value, data) {
    setValues((prev) => ({
      ...prev,
      [data.el.input.name]: value,
    }));
  } */

  /*  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  } */

  function handleSubmit(e) {
    e.preventDefault();

    if (validateForm()) {
      console.log("✅ Форма успешно отправлена:", values);
      resetForm();
      toggleForm();
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
    <div className="callback-container">
      <button className="callback-button" onClick={toggleForm}>
        <RiPhoneFill className="phone-logo" />
      </button>

      <div className="callback-overlay"></div>
      <form ref={formRef} className="callback-form" onSubmit={handleSubmit}>
        <button 
          type="button" 
          className="callback-close-button" 
          onClick={toggleForm}
          aria-label="Закрыть форму"
        >
          ×
        </button>
        <div className="form-group">
          <span className="input-span">Имя:</span>
          <input
            type="text"
            className={`form-input ${touched?.name && errors?.name ? 'error' : ''}`}
            placeholder="Введите ваше имя"
            name="name"
            onChange={handleChange}
            value={values.name || ""}
            maxLength={20}
            required
          ></input>
          {touched?.name && errors?.name && (<span className="error-message">{errors.name}</span>)}
          <span className="input-span">Телефон:</span>
          <IMaskInput
            name="phone"
            type="tel"
            ref={phoneRef}
            mask={"+7 (000) 000-00-00"}
            onAccept={handleAccept}
            value={values.phone || ""}
            overwrite="shift"
            lazy={false} // Маска видна постоянно
            unmask={false} // Сохраняем маску в значении
            radix="."
            className={`form-input ${touched?.phone && errors?.phone ? 'error' : ''}`}
            required
          />
          {touched?.phone && errors?.phone && (<span className="error-message">{errors.phone}</span>)}
          <span className="input-span">Дата:</span>
          <IMaskInput
            id="dateInput"
            name="date"
            type="text"
            ref={dateRef}
            mask={Date}
            onAccept={handleAccept}
            value={values.date || ""}
            overwrite="shift"
            lazy={false} // Маска видна постоянно
            unmask={false} // Сохраняем маску в значении
            radix="."
            className={`form-input calendar ${touched?.date && errors?.date ? 'error' : ''}`}
            autoComplete="off"
            required
          />
          {touched?.date && errors?.date && (<span className="error-message">{errors.date}</span>)}
          <span className="input-span">Время:</span>
          <select
            name="time"
            value={values.time}
            onChange={handleChange}
            className={`form-select ${touched?.time && errors?.time ? 'error' : ''}`}
            required
          >
            <option value="">Выберите время</option>
            {generateTimeOptions().map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
          {touched?.time && errors?.time && (<span className="error-message">{errors.time}</span>)}
        </div>

                 <button type="submit" className={`form-button ${!isValid ? 'disabled' : ''}`} disabled={!isValid} onClick={handleSubmit}>
                   Отправить
                 </button>
      </form>
      
      <SuccessPopup 
        isOpen={showSuccessPopup} 
        onClose={() => setShowSuccessPopup(false)} 
      />
    </div>
  );
}

export default CallbackForm;
