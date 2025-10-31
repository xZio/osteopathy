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
import { sendFormToTelegram } from "../../utils/telegramSender";
import {
  apiGetAvailability,
  apiPublicCreateAppointment,
} from "../../utils/api";

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
    formRef,
  } = useFormAndValidation();

  const phoneRef = useRef(null);
  const dateRef = useRef(null);
  const [availableTimes, setAvailableTimes] = useState([]);

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

  // Load availability when date changes
  useEffect(() => {
    async function loadAvailability() {
      try {
        const iso = toISODate(values.date);
        if (!iso) return;
        const data = await apiGetAvailability(iso, iso);
        const daySlots = data[iso] || [];
        const times = daySlots.map((s) => ({
          label: toLocalTimeLabel(s.startsAt),
          startsAt: s.startsAt,
          endsAt: s.endsAt,
        }));
        setAvailableTimes(times);
      } catch {
        setAvailableTimes([]);
      }
    }
    loadAvailability();
  }, [values.date]);

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
      if (event.key === "Escape" && isFormOpen) {
        toggleForm();
      }
    };

    if (isFormOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFormOpen, toggleForm]);

  useClickOutside(formRef, (e) => {
    const calendar = document.querySelector(".air-datepicker-nav");

    if (!calendar && !e.target.closest(".callback-button") && isFormOpen) {
      toggleForm();
    }
  });

  async function handleSubmit(e) {
    e.preventDefault();

    if (validateForm()) {
      try {
        const isoDate = toISODate(values.date);
        const chosen = availableTimes.find((t) => t.label === values.time);
        if (!isoDate || !chosen) {
          alert("Выберите доступные дату и время");
          return;
        }
        await apiPublicCreateAppointment({
          fullName: values.name,
          phone: values.phone,
          note: "",
          startsAt: chosen.startsAt,
          endsAt: chosen.endsAt,
        });
        // Optional: still send Telegram notification (ignore failures)
        await sendFormToTelegram(values, "callback").catch(() => {});
        resetForm();
        toggleForm();
        setShowSuccessPopup(true);
      } catch (error) {
        console.error(
          "❌ CallbackForm: Критическая ошибка при отправке:",
          error
        );
        alert("Произошла критическая ошибка при отправке формы.");
      }
    }
  }

  function generateTimeOptions() {
    return availableTimes.map((t) => t.label);
  }

  function toISODate(masked) {
    // try dd.mm.yyyy -> yyyy-mm-dd
    if (!masked) return "";
    const m = masked.match(/(\d{2})[./-](\d{2})[./-](\d{4})/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    // try yyyy-mm-dd already
    if (/^\d{4}-\d{2}-\d{2}$/.test(masked)) return masked;
    return "";
  }

  function toLocalTimeLabel(isoString) {
    const d = new Date(isoString);
    const fmt = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Moscow' });
    return fmt.format(d);
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
          <h2>Заказать обратный звонок</h2>
          <span className="input-span">Имя:</span>
          <input
            type="text"
            className={`form-input ${
              touched?.name && errors?.name ? "error" : ""
            }`}
            placeholder="Введите ваше имя"
            name="name"
            onChange={handleChange}
            value={values.name || ""}
            maxLength={20}
            required
          ></input>
          {touched?.name && errors?.name && (
            <span className="error-message">{errors.name}</span>
          )}
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
            className={`form-input ${
              touched?.phone && errors?.phone ? "error" : ""
            }`}
            required
          />
          {touched?.phone && errors?.phone && (
            <span className="error-message">{errors.phone}</span>
          )}
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
            className={`form-input calendar ${
              touched?.date && errors?.date ? "error" : ""
            }`}
            autoComplete="off"
            required
          />
          {touched?.date && errors?.date && (
            <span className="error-message">{errors.date}</span>
          )}
          <span className="input-span">Время:</span>
          <select
            name="time"
            value={values.time}
            onChange={handleChange}
            className={`form-select ${
              touched?.time && errors?.time ? "error" : ""
            }`}
            required
          >
            <option value="">Выберите время</option>
            {generateTimeOptions().map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
          {touched?.time && errors?.time && (
            <span className="error-message">{errors.time}</span>
          )}
        </div>

        <button
          type="submit"
          className={`form-button ${!isValid ? "disabled" : ""}`}
          disabled={!isValid}
          onClick={handleSubmit}
        >
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
