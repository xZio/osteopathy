import { useEffect, useState, useRef, useCallback } from "react";
import {
  apiListAppointments,
  apiCreateAppointment,
  apiUpdateAppointment,
  apiDeleteAppointment,
  apiGetAvailability,
} from "../../utils/api";
import { IMaskInput } from "react-imask";
import AirDatepicker from "air-datepicker";
import "air-datepicker/air-datepicker.css";
import "./Appointments.css";

function Appointments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("");
  const [errName, setErrName] = useState("");
  const [errPhone, setErrPhone] = useState("");
  const [errDate, setErrDate] = useState("");
  const [errTime, setErrTime] = useState("");
  const dateInputRef = useRef(null);
  const adminDateMaskRef = useRef(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [availableDates, setAvailableDates] = useState(new Set());
  const datepickerInstanceRef = useRef(null);
  const availabilityCacheRef = useRef(new Map());
  const availabilityLoadTimeoutRef = useRef(null);

  const [confirmId, setConfirmId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Состояния для формы редактирования в попапе
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editAvailableTimes, setEditAvailableTimes] = useState([]);
  const [editErrName, setEditErrName] = useState("");
  const [editErrPhone, setEditErrPhone] = useState("");
  const [editErrDate, setEditErrDate] = useState("");
  const [editErrTime, setEditErrTime] = useState("");
  const editDateInputRef = useRef(null);
  const editDateMaskRef = useRef(null);
  const editDatepickerInstanceRef = useRef(null);

  // Форматируем дату в YYYY-MM-DD с учетом локального времени
  const formatDateToISO = useCallback((date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  // Загружаем доступность на период (месяц вперед) с кэшированием
  const loadAvailabilityForPeriod = useCallback(
    async (startDate, endDate) => {
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
        setAvailableDates((prev) => {
          const merged = new Set(prev);
          datesWithSlots.forEach((date) => merged.add(date));
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
        setAvailableDates((prev) => {
          const merged = new Set(prev);
          datesWithSlots.forEach((date) => merged.add(date));
          return merged;
        });
      } catch (error) {
        console.error("Failed to load availability:", error);
      }
    },
    [formatDateToISO]
  );

  const availableDatesRef = useRef(availableDates);
  const formatDateToISORef = useRef(formatDateToISO);

  // Обновляем refs при изменении значений
  useEffect(() => {
    availableDatesRef.current = availableDates;
  }, [availableDates]);

  useEffect(() => {
    formatDateToISORef.current = formatDateToISO;
  }, [formatDateToISO]);

  // Загружаем доступность на месяц вперед при монтировании
  useEffect(() => {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setMonth(today.getMonth() + 1);
    loadAvailabilityForPeriod(today, endDate);
  }, [loadAvailabilityForPeriod]);

  const validateDate = useCallback((value) => {
    // Если значение пустое или содержит только маску (подчеркивания), не показываем ошибку
    if (!value || value.includes("_") || value.length < 10) {
      setErrDate("");
      return false;
    }
    const iso = toISODate(value);
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      setErrDate("Неверный формат даты");
      return false;
    }
    // Compute today's date in Europe/Moscow as YYYY-MM-DD to avoid UTC/local mismatches
    const parts = new Intl.DateTimeFormat("ru-RU", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "Europe/Moscow",
    }).formatToParts(new Date());
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const d = parts.find((p) => p.type === "day")?.value;
    const todayYMD = `${y}-${m}-${d}`;
    if (iso < todayYMD) {
      setErrDate("Дата не может быть в прошлом");
      return false;
    }
    setErrDate("");
    return true;
  }, []);

  // Загружаем доступные слоты при смене даты
  useEffect(() => {
    async function loadAvailability() {
      try {
        const iso = toISODate(date);
        if (!iso) {
          setAvailableTimes([]);
          return;
        }

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

        const day = data[iso] || [];
        const times = day.map((s) => ({
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
  }, [date]);

  // Загружаем доступные слоты при смене даты в попапе редактирования
  useEffect(() => {
    if (!showEditModal) return;

    async function loadEditAvailability() {
      try {
        const iso = toISODate(editDate);
        if (!iso) {
          setEditAvailableTimes([]);
          return;
        }

        // Проверяем кэш периодов
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
          const cacheKey = `${iso}_${iso}`;
          availabilityCacheRef.current.set(cacheKey, data);
          setTimeout(() => {
            availabilityCacheRef.current.delete(cacheKey);
          }, 5 * 60 * 1000);
        }

        const day = data[iso] || [];
        const times = day.map((s) => ({
          label: toLocalTimeLabel(s.startsAt),
          startsAt: s.startsAt,
          endsAt: s.endsAt,
        }));
        setEditAvailableTimes(times);
      } catch {
        setEditAvailableTimes([]);
      }
    }
    loadEditAvailability();
  }, [editDate, showEditModal]);

  // Инициализация календаря в попапе редактирования
  useEffect(() => {
    if (!showEditModal) {
      if (editDatepickerInstanceRef.current) {
        editDatepickerInstanceRef.current.destroy();
        editDatepickerInstanceRef.current = null;
      }
      return;
    }

    const initTimer = setTimeout(() => {
      const dp = new AirDatepicker("#editDateInput", {
        minDate: Date.now(),
        autoClose: true,
        container:
          document.querySelector(".appointments-modal-large") || document.body,
        onSelect: function (formattedDate, datepicker) {
          let selectedDate = null;
          if (datepicker) {
            selectedDate = datepicker.selectedDates?.[0] || datepicker.date;
          }
          if (!selectedDate && formattedDate?.date) {
            selectedDate = formattedDate.date;
          }
          if (!selectedDate && formattedDate?.formattedDate) {
            const dateStr = formattedDate.formattedDate;
            const [day, month, year] = dateStr.split(".");
            if (day && month && year) {
              selectedDate = new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day)
              );
            }
          }

          if (selectedDate) {
            const dateISO = formatDateToISORef.current(selectedDate);
            if (!availableDatesRef.current.has(dateISO)) {
              if (datepicker) {
                datepicker.clear();
              }
              return false;
            }
          }

          setEditDate(formattedDate.formattedDate);
          if (
            formattedDate.formattedDate &&
            !formattedDate.formattedDate.includes("_") &&
            formattedDate.formattedDate.length >= 10
          ) {
            const iso = toISODate(formattedDate.formattedDate);
            if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
              setEditErrDate("");
            } else {
              setEditErrDate("Неверный формат даты");
            }
          } else {
            setEditErrDate("");
          }

          setTimeout(() => {
            const maskInstance =
              editDateInputRef.current?.maskRef || editDateMaskRef.current;
            if (maskInstance) {
              maskInstance.updateValue();
            }
          }, 0);
        },
        disabledDates: (date) => {
          const dateISO = formatDateToISORef.current(date);
          return !availableDatesRef.current.has(dateISO);
        },
        onRenderCell: ({ date, cellType }) => {
          if (cellType === "day") {
            const dateISO = formatDateToISORef.current(date);
            const isDisabled = !availableDatesRef.current.has(dateISO);
            if (isDisabled) {
              return {
                disabled: true,
                classes: "air-datepicker-cell--disabled",
              };
            }
          }
        },
        onChangeViewDate: function (viewDate) {
          if (availabilityLoadTimeoutRef.current) {
            clearTimeout(availabilityLoadTimeoutRef.current);
          }
          availabilityLoadTimeoutRef.current = setTimeout(() => {
            const startDate = new Date(
              viewDate.getFullYear(),
              viewDate.getMonth(),
              1
            );
            const endDate = new Date(
              viewDate.getFullYear(),
              viewDate.getMonth() + 1,
              0
            );
            loadAvailabilityForPeriod(startDate, endDate);
          }, 300);
        },
      });
      editDatepickerInstanceRef.current = dp;

      setTimeout(() => {
        const inputAfterInit = document.getElementById("editDateInput");
        const maskInstance =
          editDateInputRef.current?.maskRef || editDateMaskRef.current;
        if (maskInstance) {
          if (!inputAfterInit?.value || inputAfterInit.value === "") {
            maskInstance.value = "";
            maskInstance.updateValue();
          } else {
            maskInstance.updateValue();
          }
        }
      }, 200);
    }, 100);

    return () => {
      clearTimeout(initTimer);
      if (editDatepickerInstanceRef.current) {
        editDatepickerInstanceRef.current.destroy();
        editDatepickerInstanceRef.current = null;
      }
    };
  }, [showEditModal, formatDateToISO, loadAvailabilityForPeriod]);

  function toLocalTimeLabel(isoString) {
    const d = new Date(isoString);
    const fmt = new Intl.DateTimeFormat("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Europe/Moscow",
    });
    return fmt.format(d);
  }

  useEffect(() => {
    // Ждем, пока маска инициализируется, затем инициализируем календарь
    const initTimer = setTimeout(() => {
      // Инициализация AirDatepicker
      const dp = new AirDatepicker("#adminDateInput", {
        minDate: Date.now(),
        autoClose: true,
        onSelect: function (formattedDate, datepicker) {
          // Дополнительная проверка: не позволяем выбрать дату без слотов
          let selectedDate = null;
          if (datepicker) {
            selectedDate = datepicker.selectedDates?.[0] || datepicker.date;
          }
          if (!selectedDate && formattedDate?.date) {
            selectedDate = formattedDate.date;
          }
          if (!selectedDate && formattedDate?.formattedDate) {
            const dateStr = formattedDate.formattedDate;
            const [day, month, year] = dateStr.split(".");
            if (day && month && year) {
              selectedDate = new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day)
              );
            }
          }

          if (selectedDate) {
            const dateISO = formatDateToISORef.current(selectedDate);
            if (!availableDatesRef.current.has(dateISO)) {
              if (datepicker) {
                datepicker.clear();
              }
              return false;
            }
          }

          setDate(formattedDate.formattedDate);
          validateDate(formattedDate.formattedDate);

          // Синхронизируем маску после установки значения
          setTimeout(() => {
            const maskInstance =
              dateInputRef.current?.maskRef || adminDateMaskRef.current;
            if (maskInstance) {
              maskInstance.updateValue();
            }
          }, 0);
        },
        // Блокируем даты без доступных слотов
        disabledDates: (date) => {
          const dateISO = formatDateToISORef.current(date);
          return !availableDatesRef.current.has(dateISO);
        },
        // Дополнительно блокируем клики на даты без слотов через onRenderCell
        onRenderCell: ({ date, cellType }) => {
          if (cellType === "day") {
            const dateISO = formatDateToISORef.current(date);
            const isDisabled = !availableDatesRef.current.has(dateISO);
            if (isDisabled) {
              return {
                disabled: true,
                classes: "air-datepicker-cell--disabled",
              };
            }
          }
        },
        // Загружаем доступность при смене месяца (с debounce)
        onChangeViewDate: function (viewDate) {
          if (availabilityLoadTimeoutRef.current) {
            clearTimeout(availabilityLoadTimeoutRef.current);
          }
          availabilityLoadTimeoutRef.current = setTimeout(() => {
            const startDate = new Date(
              viewDate.getFullYear(),
              viewDate.getMonth(),
              1
            );
            const endDate = new Date(
              viewDate.getFullYear(),
              viewDate.getMonth() + 1,
              0
            );
            loadAvailabilityForPeriod(startDate, endDate);
          }, 300);
        },
      });
      datepickerInstanceRef.current = dp;

      // Синхронизируем маску после инициализации календаря
      setTimeout(() => {
        const inputAfterInit = document.getElementById("adminDateInput");
        const maskInstance =
          dateInputRef.current?.maskRef || adminDateMaskRef.current;
        if (maskInstance) {
          if (!inputAfterInit?.value || inputAfterInit.value === "") {
            maskInstance.value = "";
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
      if (datepickerInstanceRef.current) {
        datepickerInstanceRef.current.destroy();
      }
    };
  }, [validateDate, formatDateToISO, loadAvailabilityForPeriod]);

  // Обновляем disabledDates и onRenderCell при изменении availableDates
  useEffect(() => {
    if (datepickerInstanceRef.current) {
      datepickerInstanceRef.current.update({
        disabledDates: (date) => {
          const dateISO = formatDateToISORef.current(date);
          return !availableDatesRef.current.has(dateISO);
        },
        onRenderCell: ({ date, cellType }) => {
          if (cellType === "day") {
            const dateISO = formatDateToISORef.current(date);
            const isDisabled = !availableDatesRef.current.has(dateISO);
            if (isDisabled) {
              return {
                disabled: true,
                classes: "air-datepicker-cell--disabled",
              };
            }
          }
        },
      });
    }
  }, [availableDates]);

  function validateName(value) {
    const nameTrim = (value || "").trim();
    if (nameTrim.length < 2 || !/^[а-яёА-ЯЁa-zA-Z\s-]+$/.test(nameTrim)) {
      setErrName("Введите имя (только буквы), минимум 2 символа");
      return false;
    }
    if (nameTrim.length > 30) {
      setErrName("Не более 30 символов");
      return false;
    }
    setErrName("");
    return true;
  }

  async function load() {
    setLoading(true);
    try {
      const data = await apiListAppointments();
      const sorted = (data || []).slice().sort((a, b) => {
        const ta = a?.startsAt ? new Date(a.startsAt).getTime() : 0;
        const tb = b?.startsAt ? new Date(b.startsAt).getTime() : 0;
        return ta - tb; // earlier first
      });
      setItems(sorted);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function validateAll() {
    let ok = true;
    if (!validateName(fullName)) ok = false;

    if (!phone || phone.includes("_")) {
      setErrPhone("Введите номер телефона");
      ok = false;
    } else if (!/^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/.test(phone)) {
      setErrPhone("Неверный формат телефона");
      ok = false;
    } else setErrPhone("");

    if (!validateDate(date)) ok = false;

    if (!start) {
      setErrTime("Выберите время");
      ok = false;
    } else {
      // Проверяем, что выбранное время есть в доступных слотах
      const chosen = availableTimes.find((t) => t.label === start);
      if (!chosen) {
        setErrTime("Выберите доступное время");
        ok = false;
      } else {
        setErrTime("");
      }
    }

    return ok;
  }

  async function startEdit(item) {
    setEditingId(item._id);
    setEditFullName(item.fullName || "");
    setEditPhone(item.phone || "");

    // Format date and time from startsAt
    if (item.startsAt) {
      const startDate = new Date(item.startsAt);
      const moscowDate = new Intl.DateTimeFormat("ru-RU", {
        timeZone: "Europe/Moscow",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).formatToParts(startDate);
      const y = moscowDate.find((p) => p.type === "year")?.value;
      const m = moscowDate.find((p) => p.type === "month")?.value;
      const d = moscowDate.find((p) => p.type === "day")?.value;
      const dateStr = `${d}.${m}.${y}`;
      setEditDate(dateStr);

      const time = new Intl.DateTimeFormat("ru-RU", {
        timeZone: "Europe/Moscow",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(startDate);
      setEditStart(time);

      // Обновляем расписание на 2 месяца вперед, чтобы видеть все освободившиеся слоты
      const isoDate = toISODate(dateStr);
      if (isoDate) {
        // Очищаем весь кэш, чтобы загрузить актуальные данные
        availabilityCacheRef.current.clear();

        // Загружаем расписание на 2 месяца вперед
        const today = new Date();
        const endDate = new Date(today);
        endDate.setMonth(today.getMonth() + 2);
        
        try {
          // Загружаем доступность на период
          const startISO = formatDateToISO(today);
          const endISO = formatDateToISO(endDate);
          const periodData = await apiGetAvailability(startISO, endISO);
          
          // Сохраняем в кэш
          const cacheKey = `${startISO}_${endISO}`;
          availabilityCacheRef.current.set(cacheKey, periodData);
          setTimeout(() => {
            availabilityCacheRef.current.delete(cacheKey);
          }, 5 * 60 * 1000);

          // Обновляем список доступных дат для всего периода
          const datesWithSlots = new Set();
          for (const [dateISO, slots] of Object.entries(periodData)) {
            if (slots && slots.length > 0) {
              datesWithSlots.add(dateISO);
            }
          }
          setAvailableDates((prev) => {
            const merged = new Set(prev);
            datesWithSlots.forEach((date) => merged.add(date));
            return merged;
          });

          // Загружаем доступные слоты для выбранной даты
          const day = periodData[isoDate] || [];
          const times = day.map((s) => ({
            label: toLocalTimeLabel(s.startsAt),
            startsAt: s.startsAt,
            endsAt: s.endsAt,
          }));
          setEditAvailableTimes(times);
        } catch (error) {
          console.error("Failed to load availability for edit:", error);
          setEditAvailableTimes([]);
        }
      }
    }

    setShowEditModal(true);
  }

  function cancelEditModal() {
    setShowEditModal(false);
    setEditingId(null);
    setEditFullName("");
    setEditPhone("");
    setEditDate("");
    setEditStart("");
    setEditAvailableTimes([]);
    setEditErrName("");
    setEditErrPhone("");
    setEditErrDate("");
    setEditErrTime("");
    if (editDatepickerInstanceRef.current) {
      editDatepickerInstanceRef.current.destroy();
      editDatepickerInstanceRef.current = null;
    }
  }

  function validateEditName(value) {
    const nameTrim = (value || "").trim();
    if (nameTrim.length < 2 || !/^[а-яёА-ЯЁa-zA-Z\s-]+$/.test(nameTrim)) {
      setEditErrName("Введите имя (только буквы), минимум 2 символа");
      return false;
    }
    if (nameTrim.length > 30) {
      setEditErrName("Не более 30 символов");
      return false;
    }
    setEditErrName("");
    return true;
  }

  function validateEditAll() {
    let ok = true;
    if (!validateEditName(editFullName)) ok = false;

    if (!editPhone || editPhone.includes("_")) {
      setEditErrPhone("Введите номер телефона");
      ok = false;
    } else if (!/^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/.test(editPhone)) {
      setEditErrPhone("Неверный формат телефона");
      ok = false;
    } else setEditErrPhone("");

    if (!editDate || editDate.includes("_") || editDate.length < 10) {
      setEditErrDate("Выберите дату");
      ok = false;
    } else {
      const iso = toISODate(editDate);
      if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
        setEditErrDate("Неверный формат даты");
        ok = false;
      } else {
        setEditErrDate("");
      }
    }

    if (!editStart) {
      setEditErrTime("Выберите время");
      ok = false;
    } else {
      const chosen = editAvailableTimes.find((t) => t.label === editStart);
      if (!chosen) {
        setEditErrTime("Выберите доступное время");
        ok = false;
      } else {
        setEditErrTime("");
      }
    }

    return ok;
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!validateEditAll()) return;
    setLoading(true);
    try {
      const isoDate = toISODate(editDate);
      const chosen = editAvailableTimes.find((t) => t.label === editStart);
      if (!chosen) {
        setEditErrTime("Выберите доступное время");
        setLoading(false);
        return;
      }

      await apiUpdateAppointment(editingId, {
        fullName: editFullName,
        phone: editPhone,
        note: "",
        startsAt: chosen.startsAt,
        endsAt: chosen.endsAt,
      });

      // Очищаем кэш доступности для выбранной даты
      for (const [
        cacheKey,
        cachedData,
      ] of availabilityCacheRef.current.entries()) {
        if (cachedData[isoDate]) {
          availabilityCacheRef.current.delete(cacheKey);
        }
      }

      cancelEditModal();
    } finally {
      await load();
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!validateAll()) return;
    setLoading(true);
    try {
      const isoDate = toISODate(date);
      const chosen = availableTimes.find((t) => t.label === start);
      if (!chosen) {
        setErrTime("Выберите доступное время");
        setLoading(false);
        return;
      }

      // Используем время из выбранного слота
      const startsAt = chosen.startsAt;
      const endsAt = chosen.endsAt;

      {
        await apiCreateAppointment({
          fullName,
          phone,
          note: "",
          startsAt,
          endsAt,
        });

        // Очищаем кэш доступности для выбранной даты
        for (const [
          cacheKey,
          cachedData,
        ] of availabilityCacheRef.current.entries()) {
          if (cachedData[isoDate]) {
            availabilityCacheRef.current.delete(cacheKey);
          }
        }

        // Обновляем список доступных дат (удаляем дату, если на ней не осталось слотов)
        try {
          const data = await apiGetAvailability(isoDate, isoDate);
          const datesWithSlots = new Set();
          for (const [dateISO, slots] of Object.entries(data)) {
            if (slots && slots.length > 0) {
              datesWithSlots.add(dateISO);
            }
          }
          setAvailableDates((prev) => {
            const merged = new Set(prev);
            datesWithSlots.forEach((date) => merged.add(date));
            // Удаляем дату, если на ней не осталось слотов
            if (!datesWithSlots.has(isoDate)) {
              merged.delete(isoDate);
            }
            return merged;
          });
        } catch (error) {
          console.error("Failed to reload availability after booking:", error);
        }

        // Очищаем форму сразу после успешной отправки
        setFullName("");
        setPhone("");
        setDate("");
        setStart("");
        setAvailableTimes([]);
        setErrName("");
        setErrPhone("");
        setErrDate("");
        setErrTime("");
      }
    } finally {
      await load();
    }
  }

  function askDelete(id) {
    setConfirmId(id);
    setShowConfirm(true);
  }

  async function confirmDelete() {
    if (!confirmId) return;
    setLoading(true);
    try {
      await apiDeleteAppointment(confirmId);
    } finally {
      setShowConfirm(false);
      setConfirmId(null);
      await load();
    }
  }

  function cancelDelete() {
    setShowConfirm(false);
    setConfirmId(null);
  }

  function toISODate(masked) {
    if (!masked) return "";
    const m = masked.match(/(\d{2})[./-](\d{2})[./-](\d{4})/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(masked)) return masked;
    return masked; // fallback
  }

  /*   function logout() {
    localStorage.removeItem("admin_token");
    window.location.reload();
  } */

  return (
    <div className="appointments-card">
      <div className="appointments-header">
        <h2 className="appointments-title">Записи</h2>
        {/*   <button className="appointments-btn" onClick={logout}>
          Выйти
        </button> */}
      </div>
      <form className="appointments-grid" onSubmit={handleCreate} noValidate>
        <div>
          <label className="appointments-muted" htmlFor="adminNameInput">
            ФИО
          </label>
          <input
            id="adminNameInput"
            className="appointments-input"
            placeholder="ФИО"
            maxLength={30}
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              validateName(e.target.value);
            }}
            required
          />
          <div className="appointments-error-slot">{errName}</div>
        </div>
        <div>
          <label className="appointments-muted" htmlFor="adminPhoneInput">
            Телефон
          </label>
          <IMaskInput
            id="adminPhoneInput"
            className={`appointments-input ${
              !phone ||
              phone.includes("_") ||
              !/^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/.test(phone)
                ? "masked"
                : ""
            }`}
            placeholder="+7 (___) ___-__-__"
            mask={"+7 (000) 000-00-00"}
            unmask={false}
            overwrite="shift"
            lazy={false}
            value={phone}
            onAccept={(v) => setPhone(v)}
            required
          />
          <div className="appointments-error-slot">{errPhone}</div>
        </div>
        <div>
          <label className="appointments-muted" htmlFor="adminDateInput">
            Дата
          </label>
          <IMaskInput
            id="adminDateInput"
            ref={(el) => {
              dateInputRef.current = el;
              if (el) {
                const checkMask = (attempt = 0) => {
                  if (el.maskRef) {
                    adminDateMaskRef.current = el.maskRef;
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
            className={`appointments-input ${
              !date || date.includes("_") || date.length < 10 ? "masked" : ""
            }`}
            placeholder="ДД.ММ.ГГГГ"
            mask={Date}
            lazy={false}
            overwrite="shift"
            value={date}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            onAccept={(v) => {
              setDate(v);
              // Валидируем только если значение не пустое и не содержит маску
              if (v && !v.includes("_") && v.length >= 10) {
                validateDate(v);
              } else {
                setErrDate("");
              }
            }}
            required
          />
          <div className="appointments-error-slot">{errDate}</div>
        </div>
        {date && !date.includes("_") && date.length >= 10 && (
          <div>
            <div className="appointments-muted" style={{ marginBottom: "4px", marginLeft: "6px" }}>
              Время начала
            </div>
            {availableTimes.length > 0 ? (
              <div className="appointments-time-slots-container" role="group" aria-label="Выберите время начала">
                {availableTimes.map((slot) => (
                  <button
                    key={slot.startsAt}
                    type="button"
                    className={`appointments-time-slot-button ${
                      start === slot.label
                        ? "appointments-time-slot-selected"
                        : ""
                    }`}
                    onClick={() => {
                      setStart(slot.label);
                      setErrTime("");
                    }}
                  >
                    {slot.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="appointments-time-slots-empty">
                Нет доступных слотов на выбранную дату
              </div>
            )}
            <div className="appointments-error-slot">{errTime}</div>
          </div>
        )}
        <div>
          <button
            className="appointments-btn appointments-btn-primary"
            type="submit"
            style={{ height: 40, width: "100%" }}
          >
            Добавить
          </button>
        </div>
      </form>
      {loading ? (
        <div className="appointments-muted">Загрузка...</div>
      ) : (
        <table className="appointments-table">
          <thead>
            <tr>
              <th>ФИО</th>
              <th>Телефон</th>
              <th>Время приёма</th>
              <th>Создано</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const fmt = new Intl.DateTimeFormat("ru-RU", {
                dateStyle: "short",
                timeStyle: "short",
                timeZone: "Europe/Moscow",
              });
              const startsStr = it.startsAt
                ? fmt.format(new Date(it.startsAt))
                : "";
              const createdStr = it.createdAt
                ? fmt.format(new Date(it.createdAt))
                : "";
              return (
                <tr key={it._id} className="appointments-table-row">
                  <td data-label="ФИО">{it.fullName}</td>
                  <td data-label="Телефон">{it.phone}</td>
                  <td data-label="Время приёма">{startsStr}</td>
                  <td data-label="Создано">{createdStr}</td>
                  <td data-label="">
                    <div className="appointments-table-actions">
                      <button
                        className="appointments-table-btn appointments-table-btn-edit"
                        onClick={() => startEdit(it)}
                        title="Редактировать"
                        aria-label="Редактировать"
                      >
                        <span className="appointments-table-btn-icon">✏</span>
                      </button>
                      <button
                        className="appointments-table-btn appointments-table-btn-delete"
                        onClick={() => askDelete(it._id)}
                        title="Удалить"
                        aria-label="Удалить"
                      >
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {showConfirm && (
        <div className="appointments-modal-backdrop" onClick={cancelDelete}>
          <div
            className="appointments-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="appointments-modal-title">Подтверждение</div>
            <div className="appointments-modal-body">
              Удалить запись? Это действие необратимо.
            </div>
            <div className="appointments-modal-actions">
              <button className="appointments-btn" onClick={cancelDelete}>
                Отмена
              </button>
              <button
                className="appointments-btn appointments-btn-danger"
                onClick={confirmDelete}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="appointments-modal-backdrop" onClick={cancelEditModal}>
          <div
            className="appointments-modal appointments-modal-large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="appointments-modal-title">Редактировать запись</div>
            <form
              className="appointments-grid"
              onSubmit={handleEditSubmit}
              noValidate
            >
              <div>
                <label className="appointments-muted" htmlFor="editNameInput">
                  ФИО
                </label>
                <input
                  id="editNameInput"
                  className="appointments-input"
                  placeholder="ФИО"
                  maxLength={30}
                  value={editFullName}
                  onChange={(e) => {
                    setEditFullName(e.target.value);
                    validateEditName(e.target.value);
                  }}
                  required
                />
                <div className="appointments-error-slot">{editErrName}</div>
              </div>
              <div>
                <label className="appointments-muted" htmlFor="editPhoneInput">
                  Телефон
                </label>
                <IMaskInput
                  id="editPhoneInput"
                  className={`appointments-input ${
                    !editPhone ||
                    editPhone.includes("_") ||
                    !/^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/.test(editPhone)
                      ? "masked"
                      : ""
                  }`}
                  placeholder="+7 (___) ___-__-__"
                  mask={"+7 (000) 000-00-00"}
                  unmask={false}
                  overwrite="shift"
                  lazy={false}
                  value={editPhone}
                  onAccept={(v) => setEditPhone(v)}
                  required
                />
                <div className="appointments-error-slot">{editErrPhone}</div>
              </div>
              <div>
                <label className="appointments-muted" htmlFor="editDateInput">
                  Дата
                </label>
                <IMaskInput
                  id="editDateInput"
                  ref={(el) => {
                    editDateInputRef.current = el;
                    if (el) {
                      const checkMask = (attempt = 0) => {
                        if (el.maskRef) {
                          editDateMaskRef.current = el.maskRef;
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
                  className={`appointments-input ${
                    !editDate || editDate.includes("_") || editDate.length < 10
                      ? "masked"
                      : ""
                  }`}
                  placeholder="ДД.ММ.ГГГГ"
                  mask={Date}
                  lazy={false}
                  overwrite="shift"
                  value={editDate}
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck={false}
                  onAccept={(v) => {
                    setEditDate(v);
                    if (v && !v.includes("_") && v.length >= 10) {
                      const iso = toISODate(v);
                      if (iso && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
                        setEditErrDate("");
                      } else {
                        setEditErrDate("Неверный формат даты");
                      }
                    } else {
                      setEditErrDate("");
                    }
                  }}
                  required
                />
                <div className="appointments-error-slot">{editErrDate}</div>
              </div>
              {editDate && !editDate.includes("_") && editDate.length >= 10 && (
                <div>
                  <div className="appointments-muted" style={{ marginBottom: "4px", marginLeft: "6px" }}>
                    Время начала
                  </div>
                  {editAvailableTimes.length > 0 ? (
                    <div className="appointments-time-slots-container" role="group" aria-label="Выберите время начала">
                      {editAvailableTimes.map((slot) => (
                        <button
                          key={slot.startsAt}
                          type="button"
                          className={`appointments-time-slot-button ${
                            editStart === slot.label
                              ? "appointments-time-slot-selected"
                              : ""
                          }`}
                          onClick={() => {
                            setEditStart(slot.label);
                            setEditErrTime("");
                          }}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="appointments-time-slots-empty">
                      Нет доступных слотов на выбранную дату
                    </div>
                  )}
                  <div className="appointments-error-slot">{editErrTime}</div>
                </div>
              )}
              <div
                className="appointments-modal-actions"
                style={{ gridColumn: "1 / -1", marginTop: "16px" }}
              >
                <button
                  className="appointments-btn"
                  type="button"
                  onClick={cancelEditModal}
                >
                  Отмена
                </button>
                <button
                  className="appointments-btn appointments-btn-primary"
                  type="submit"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Appointments;
