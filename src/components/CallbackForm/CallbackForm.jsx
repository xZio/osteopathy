import "./CallbackForm.css";
import { RiPhoneFill } from "react-icons/ri";
import { useRef, useEffect, useState, useCallback, useLayoutEffect } from "react";
import { IMaskInput } from "react-imask";
import AirDatepicker from "air-datepicker";
import "air-datepicker/air-datepicker.css";
import { useClickOutside } from "../../hooks/useClickOutside";
import { useFormAndValidation } from "../../hooks/useFormAndValidation";
import SuccessPopup from "../SuccessPopup/SuccessPopup";
import ErrorPopup from "../ErrorPopup/ErrorPopup";
import { sendFormToTelegram } from "../../utils/telegramSender";
import {
  apiGetAvailability,
  apiPublicCreateAppointment,
} from "../../utils/api";

function CallbackForm({ toggleForm, isFormOpen }) {
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [availableTimes, setAvailableTimes] = useState([]);
  const [availableDates, setAvailableDates] = useState(new Set()); // Даты с доступными слотами
  const [datepickerInstance, setDatepickerInstance] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const dateMaskRef = useRef(null);
  const availabilityCacheRef = useRef(new Map()); // Кэш загруженных данных доступности
  const availabilityLoadTimeoutRef = useRef(null); // Для debounce
  
  // Форматируем дату в YYYY-MM-DD с учетом локального времени
  const formatDateToISO = useCallback((date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Загружаем доступность на период (месяц вперед) с кэшированием
  const loadAvailabilityForPeriod = useCallback(async (startDate, endDate) => {
    const startISO = formatDateToISO(startDate);
    const endISO = formatDateToISO(endDate);
    const cacheKey = `${startISO}_${endISO}`;
    
    // Проверяем кэш
    if (availabilityCacheRef.current.has(cacheKey)) {
      const cachedData = availabilityCacheRef.current.get(cacheKey);
      const datesWithSlots = new Set();
      for (const [dateISO, slots] of Object.entries(cachedData)) {
        if (slots && slots.length > 0) {
          datesWithSlots.add(dateISO);
        }
      }
      setAvailableDates(prev => {
        const merged = new Set(prev);
        datesWithSlots.forEach(date => merged.add(date));
        return merged;
      });
      return;
    }
    
    try {
      const data = await apiGetAvailability(startISO, endISO);
      
      // Сохраняем в кэш (храним 5 минут)
      availabilityCacheRef.current.set(cacheKey, data);
      setTimeout(() => {
        availabilityCacheRef.current.delete(cacheKey);
      }, 5 * 60 * 1000);
      
      // Собираем даты, на которые есть хотя бы один слот
      const datesWithSlots = new Set();
      for (const [dateISO, slots] of Object.entries(data)) {
        if (slots && slots.length > 0) {
          datesWithSlots.add(dateISO);
        }
      }
      setAvailableDates(prev => {
        const merged = new Set(prev);
        datesWithSlots.forEach(date => merged.add(date));
        return merged;
      });
    } catch (error) {
      console.error('Failed to load availability:', error);
      // Не обновляем availableDates при ошибке, чтобы не потерять уже загруженные данные
    }
  }, [formatDateToISO]);

  const availableDatesRef = useRef(availableDates);
  const formatDateToISORef = useRef(formatDateToISO);
  
  // Обновляем refs при изменении значений
  useEffect(() => {
    availableDatesRef.current = availableDates;
  }, [availableDates]);
  
  useEffect(() => {
    formatDateToISORef.current = formatDateToISO;
  }, [formatDateToISO]);

  // Загружаем доступность на месяц вперед при открытии формы
  useEffect(() => {
    if (isFormOpen) {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setMonth(today.getMonth() + 1);
      loadAvailabilityForPeriod(today, endDate);
    }
  }, [isFormOpen, loadAvailabilityForPeriod]);

  // Синхронизируем маску при монтировании
  useLayoutEffect(() => {
    if (isFormOpen) {
      const syncMask = (attempt = 0) => {
        const maskInstance = dateRef.current?.maskRef || dateMaskRef.current;
        if (maskInstance) {
          maskInstance.updateValue();
        } else if (attempt < 10) {
          setTimeout(() => syncMask(attempt + 1), 50);
        }
      };
      syncMask(0);
    }
  }, [isFormOpen]);
  
  // Синхронизируем маску при изменении значения
  useEffect(() => {
    if (isFormOpen && values.date) {
      const timer = setTimeout(() => {
        const maskInstance = dateRef.current?.maskRef || dateMaskRef.current;
        if (maskInstance) {
          maskInstance.updateValue();
        }
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isFormOpen, values.date]);

  useEffect(() => {
    if (isFormOpen) {
      // Ждем, пока маска инициализируется, затем инициализируем календарь
      const initTimer = setTimeout(() => {
        // Инициализация AirDatepicker
        const dp = new AirDatepicker("#dateInput", {
        minDate: Date.now(),
        autoClose: true,
        onSelect: function (formattedDate, datepicker) {
          // Дополнительная проверка: не позволяем выбрать дату без слотов
          // Получаем выбранную дату из разных источников
          let selectedDate = null;
          if (datepicker) {
            selectedDate = datepicker.selectedDates?.[0] || datepicker.date;
          }
          if (!selectedDate && formattedDate?.date) {
            selectedDate = formattedDate.date;
          }
          // Если не удалось получить дату, парсим из строки
          if (!selectedDate && formattedDate?.formattedDate) {
            const dateStr = formattedDate.formattedDate;
            const [day, month, year] = dateStr.split('.');
            if (day && month && year) {
              selectedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            }
          }
          
          if (selectedDate) {
            const dateISO = formatDateToISORef.current(selectedDate);
            if (!availableDatesRef.current.has(dateISO)) {
              // Если дата без слотов, очищаем выбор и не устанавливаем значение
              if (datepicker) {
                datepicker.clear();
              }
              return false; // Предотвращаем выбор
            }
          }
          setValues((prevValues) => ({ ...prevValues, date: formattedDate.formattedDate }));
          
          // Синхронизируем маску после установки значения
          setTimeout(() => {
            const maskInstance = dateRef.current?.maskRef || dateMaskRef.current;
            if (maskInstance) {
              maskInstance.updateValue();
            }
          }, 0);
        },
        // Блокируем даты без доступных слотов
        disabledDates: (date) => {
          // Используем локальную дату, а не UTC
          const dateISO = formatDateToISORef.current(date);
          const isDisabled = !availableDatesRef.current.has(dateISO);
          return isDisabled;
        },
        // Дополнительно блокируем клики на даты без слотов через onRenderCell
        onRenderCell: ({ date, cellType }) => {
          if (cellType === 'day') {
            const dateISO = formatDateToISORef.current(date);
            const isDisabled = !availableDatesRef.current.has(dateISO);
            if (isDisabled) {
              return {
                disabled: true,
                classes: 'air-datepicker-cell--disabled'
              };
            }
          }
        },
        // Загружаем доступность при смене месяца (с debounce)
        onChangeViewDate: function(viewDate) {
          // Используем debounce, чтобы не делать запросы при быстрой прокрутке месяцев
          if (availabilityLoadTimeoutRef.current) {
            clearTimeout(availabilityLoadTimeoutRef.current);
          }
          availabilityLoadTimeoutRef.current = setTimeout(() => {
            const startDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
            const endDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
            loadAvailabilityForPeriod(startDate, endDate);
          }, 300);
        },
        });
        setDatepickerInstance(dp);
        
        // Синхронизируем маску после инициализации календаря
        // AirDatepicker может очистить значение, восстанавливаем маску
        setTimeout(() => {
          const inputAfterInit = document.getElementById('dateInput');
          const maskInstance = dateRef.current?.maskRef || dateMaskRef.current;
          if (maskInstance) {
            // Если значение пустое, восстанавливаем маску
            if (!inputAfterInit?.value || inputAfterInit.value === '') {
              maskInstance.value = '';
              maskInstance.updateValue();
            } else {
              maskInstance.updateValue();
            }
          }
        }, 200);
      }, 100);
      
      return () => {
        clearTimeout(initTimer);
        if (availabilityLoadTimeoutRef.current) {
          clearTimeout(availabilityLoadTimeoutRef.current);
        }
        if (datepickerInstance) {
          datepickerInstance.destroy();
          setDatepickerInstance(null);
        }
      };
    } else {
      // Уничтожаем календарь при закрытии формы
      if (availabilityLoadTimeoutRef.current) {
        clearTimeout(availabilityLoadTimeoutRef.current);
      }
      if (datepickerInstance) {
        datepickerInstance.destroy();
        setDatepickerInstance(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFormOpen]); // Пересоздаем календарь при открытии/закрытии формы

  // Load availability when date changes (с кэшированием)
  useEffect(() => {
    async function loadAvailability() {
      try {
        const iso = toISODate(values.date);
        if (!iso) return;
        
        // Проверяем кэш периодов - возможно, данные уже загружены
        let data = null;
        for (const cachedData of availabilityCacheRef.current.values()) {
          if (cachedData[iso]) {
            data = { [iso]: cachedData[iso] };
            break;
          }
        }
        
        // Если данных нет в кэше, делаем запрос
        if (!data) {
          data = await apiGetAvailability(iso, iso);
          // Сохраняем в кэш
          const cacheKey = `${iso}_${iso}`;
          availabilityCacheRef.current.set(cacheKey, data);
          setTimeout(() => {
            availabilityCacheRef.current.delete(cacheKey);
          }, 5 * 60 * 1000);
        }
        
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

  // Обновляем disabledDates и onRenderCell при изменении availableDates
  useEffect(() => {
    if (datepickerInstance && isFormOpen) {
      datepickerInstance.update({
        disabledDates: (date) => {
          // Используем локальную дату, а не UTC
          const dateISO = formatDateToISORef.current(date);
          return !availableDatesRef.current.has(dateISO);
        },
        onRenderCell: ({ date, cellType }) => {
          if (cellType === 'day') {
            const dateISO = formatDateToISORef.current(date);
            const isDisabled = !availableDatesRef.current.has(dateISO);
            if (isDisabled) {
              return {
                disabled: true,
                classes: 'air-datepicker-cell--disabled'
              };
            }
          }
        },
      });
    }
  }, [availableDates, datepickerInstance, isFormOpen]);

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

    // Защита от множественных нажатий
    if (isSubmitting) {
      return;
    }

    if (validateForm()) {
      setIsSubmitting(true);
      try {
        const isoDate = toISODate(values.date);
        const chosen = availableTimes.find((t) => t.label === values.time);
        if (!isoDate || !chosen) {
          alert("Выберите доступные дату и время");
          setIsSubmitting(false);
          return;
        }
        await apiPublicCreateAppointment({
          fullName: values.name,
          phone: values.phone,
          note: "",
          startsAt: chosen.startsAt,
          endsAt: chosen.endsAt,
        });
        
        // Очищаем кэш доступности для выбранной даты, чтобы обновить список слотов
        const selectedDate = isoDate;
        for (const [cacheKey, cachedData] of availabilityCacheRef.current.entries()) {
          if (cachedData[selectedDate]) {
            // Удаляем кэш для этой даты
            availabilityCacheRef.current.delete(cacheKey);
          }
        }
        
        // Перезагружаем доступность для выбранной даты
        try {
          const data = await apiGetAvailability(selectedDate, selectedDate);
          const daySlots = data[selectedDate] || [];
          const times = daySlots.map((s) => ({
            label: toLocalTimeLabel(s.startsAt),
            startsAt: s.startsAt,
            endsAt: s.endsAt,
          }));
          setAvailableTimes(times);
          
          // Обновляем список доступных дат
          const datesWithSlots = new Set();
          for (const [dateISO, slots] of Object.entries(data)) {
            if (slots && slots.length > 0) {
              datesWithSlots.add(dateISO);
            }
          }
          setAvailableDates(prev => {
            const merged = new Set(prev);
            datesWithSlots.forEach(date => merged.add(date));
            return merged;
          });
        } catch (error) {
          console.error('Failed to reload availability after booking:', error);
        }
        
        // Optional: still send Telegram notification (ignore failures)
        const telegramSent = await sendFormToTelegram(values, "callback").catch(() => false);
        resetForm();
        toggleForm();
        setShowSuccessPopup(true);
        
        // Если Telegram не отправился, предупреждаем (но не блокируем успешное завершение)
        if (!telegramSent) {
          console.warn("⚠️ Запись создана, но уведомление в Telegram не отправлено");
        }
      } catch (error) {
        console.error(
          "❌ CallbackForm: Критическая ошибка при отправке:",
          error
        );
        
        // Определяем сообщение об ошибке
        let errorMsg = "Произошла ошибка. Пожалуйста, попробуйте еще раз.";
        
        if (error.message === "Slot already booked") {
          errorMsg = "Выбранное время уже забронировано. Пожалуйста, выберите другое время.";
        }
        
        setErrorMessage(errorMsg);
        setShowErrorPopup(true);
      } finally {
        setIsSubmitting(false);
      }
    }
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
          <span className="input-span">Выберите свободную дату:</span>
          <IMaskInput
            id="dateInput"
            name="date"
            type="text"
            ref={(el) => {
              dateRef.current = el;
              if (el) {
                const checkMask = (attempt = 0) => {
                  if (el.maskRef) {
                    dateMaskRef.current = el.maskRef;
                    setTimeout(() => {
                      el.maskRef.updateValue();
                    }, 0);
                  } else if (attempt < 10) {
                    setTimeout(() => checkMask(attempt + 1), 20);
                  }
                };
                checkMask(0);
              }
            }}
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
          {values.date && (
            <>
              <span className="input-span">Выберите желаемое время:</span>
              {availableTimes.length > 0 ? (
                <div className="time-slots-container">
                  {availableTimes.map((slot) => (
                    <button
                      key={slot.startsAt}
                      type="button"
                      className={`time-slot-button ${
                        values.time === slot.label ? "time-slot-selected" : ""
                      }`}
                      onClick={() => {
                        // Используем handleChange для правильной валидации и установки touched
                        const fakeEvent = {
                          target: { name: 'time', value: slot.label }
                        };
                        handleChange(fakeEvent);
                      }}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="time-slots-empty">
                  Нет доступных слотов на выбранную дату
                </div>
              )}
              {touched?.time && errors?.time && (
                <span className="error-message">{errors.time}</span>
              )}
            </>
          )}
        </div>

        <button
          type="submit"
          className={`form-button ${!isValid || isSubmitting ? "disabled" : ""}`}
          disabled={!isValid || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? "Отправка..." : "Отправить"}
        </button>
      </form>

      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
      />
      <ErrorPopup 
        isOpen={showErrorPopup} 
        onClose={() => setShowErrorPopup(false)}
        title="Ошибка при отправке формы"
        message={errorMessage}
      />
    </div>
  );
}

export default CallbackForm;
