import "./CallbackForm.css";
import { RiPhoneFill } from "react-icons/ri";
import { useState, useRef, useEffect } from "react";
import { IMaskInput } from "react-imask";
import AirDatepicker from "air-datepicker";
import "air-datepicker/air-datepicker.css";
import { useClickOutside } from "../../hooks/useClickOutside";

function CallbackForm({ toggleForm, isFormOpen }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    date: "",
    time: "",
  });

  const formRef = useRef(null);
  const phoneRef = useRef(null);
  const dateRef = useRef(null);

  useEffect(() => {
    if (isFormOpen) {
      // Инициализация AirDatepicker
      new AirDatepicker("#dateInput", {
        minDate: Date.now(),
        autoClose: true,
        onSelect: function (formattedDate) {
          setFormData({ ...formData, date: formattedDate.formattedDate });
        },
      });
    }
  }, [formData, isFormOpen]);

  useEffect(() => {
    const form = formRef.current;
    const overlay = document.querySelector(".callback-overlay");
    if (isFormOpen) {
      form.classList.add("callback-form-active");
      overlay.classList.add("callback-overlay-active");
    } else {
      form.classList.remove("callback-form-active");
      overlay.classList.remove("callback-overlay-active");
    }
  }, [isFormOpen]);

  useClickOutside(formRef, (e) => {
    const calendar = document.querySelector(".air-datepicker-nav");

    if (!calendar && !e.target.closest(".callback-button") && isFormOpen) {
      toggleForm();
    }
  });

  function handleAccept(value, data) {
    setFormData((prev) => ({
      ...prev,
      [data.el.input.name]: value,
    }));
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    console.log("Submitted data:", formData);
    setFormData({});
    if (formRef.current) formRef.current.reset();
    toggleForm();
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
        <div className="form-group">
          <span className="input-span">Имя:</span>
          <input
            type="text"
            className="form-input"
            placeholder="Введите ваше имя"
            name="name"
            onChange={handleChange}
            value={formData.name || ""}
            maxLength={20}
            required
          ></input>
          <span className="input-span">Телефон:</span>
          <IMaskInput
            name="phone"
            type="tel"
            ref={phoneRef}
            mask={"+7 (000) 000-00-00"}
            onAccept={handleAccept}
            value={formData.phone || ""}
            overwrite="shift"
            lazy={false} // Маска видна постоянно
            unmask={false} // Сохраняем маску в значении
            radix="."
            className="form-input"
            required
          />
          <span className="input-span">Дата:</span>
          <IMaskInput
            id="dateInput"
            name="date"
            type="text"
            ref={dateRef}
            mask={Date}
            onAccept={handleAccept}
            value={formData.date || ""}
            overwrite="shift"
            lazy={false} // Маска видна постоянно
            unmask={false} // Сохраняем маску в значении
            radix="."
            className="form-input calendar"
            autoComplete="off"
            required
          />
          <span className="input-span">Время:</span>
          <select
            name="time"
            value={formData.time}
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="">Выберите время</option>
            {generateTimeOptions().map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="form-button" onClick={handleSubmit}>
          Отправить
        </button>
      </form>
    </div>
  );
}

export default CallbackForm;
