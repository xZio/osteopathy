import { useEffect, useState, useRef } from "react";
import { apiGetSchedule, apiSaveSchedule } from "../../utils/api";
import AirDatepicker from "air-datepicker";
import "air-datepicker/air-datepicker.css";
import SuccessPopup from "../SuccessPopup/SuccessPopup";
import "./ScheduleEditor.css";

function ScheduleEditor() {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(() =>
    Array.from({ length: 7 }, (_, i) => ({ weekday: i, slots: [] }))
  );
  const [overrides, setOverrides] = useState([]);
  const [selectedWeekday, setSelectedWeekday] = useState(1); // Понедельник по умолчанию
  const [slotOffsets, setSlotOffsets] = useState(new Map()); // Смещение для каждого дня (индекс начала показа)
  
  // Форма для нового слота
  const [newSlotStart, setNewSlotStart] = useState("10:00");
  const [newSlotEnd, setNewSlotEnd] = useState("18:00");
  const [newSlotDuration, setNewSlotDuration] = useState(60); // Кратно 10
  const [isOverrideMode, setIsOverrideMode] = useState(false); // Режим исключений
  const [overrideDate, setOverrideDate] = useState(""); // Дата для исключения
  const overrideDateRef = useRef(null); // Ref для AirDatepicker
  const [slotError, setSlotError] = useState(""); // Ошибка при добавлении слота
  const [showSuccessPopup, setShowSuccessPopup] = useState(false); // Показ попапа успешного сохранения
  const [showScheduleSuccessPopup, setShowScheduleSuccessPopup] = useState(false); // Показ попапа успешного сохранения расписания
  
  const MAX_VISIBLE_SLOTS = 6; // Максимум слотов на странице
  
  const labels = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
  const fullLabels = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

  useEffect(() => {
    (async () => {
      try {
        const s = await apiGetSchedule();
        const byWeekday = new Map((s?.days || []).map((d) => [d.weekday, d]));
        setDays(
          Array.from(
            { length: 7 },
            (_, i) => byWeekday.get(i) || { weekday: i, slots: [] }
          )
        );
        setOverrides(s?.overrides || []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Инициализация AirDatepicker для поля даты исключения
  useEffect(() => {
    if (!isOverrideMode || !overrideDateRef.current) return;

    const datepicker = new AirDatepicker("#overrideDateInput", {
      minDate: new Date(),
      autoClose: true,
      dateFormat: "yyyy-MM-dd",
      onSelect: function ({ date }) {
        if (date) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          const formatted = `${year}-${month}-${day}`;
          setOverrideDate(formatted);
        }
      },
    });

    return () => {
      if (datepicker && datepicker.destroy) {
        datepicker.destroy();
      }
    };
  }, [isOverrideMode]);

  function minutesToHHMM(total) {
    const h = String(Math.floor(total / 60)).padStart(2, "0");
    const m = String(total % 60).padStart(2, "0");
    return `${h}:${m}`;
  }

  function hhmmToMinutes(hhmm) {
    const [h, m] = (hhmm || "").split(":").map((n) => Number(n));
    if (Number.isFinite(h) && Number.isFinite(m)) return h * 60 + m;
    return 0;
  }

  function addNewSlot() {
    setSlotError("");
    const startMinute = hhmmToMinutes(newSlotStart);
    const endMinute = hhmmToMinutes(newSlotEnd);
    
    if (startMinute >= endMinute) {
      setSlotError("Время начала должно быть раньше времени окончания");
      return;
    }

    // Если режим исключений, проверяем дату
    if (isOverrideMode) {
      if (!overrideDate || !/^\d{4}-\d{2}-\d{2}$/.test(overrideDate)) {
        setSlotError("Введите корректную дату в формате YYYY-MM-DD");
        return;
      }

      const existingOverride = overrides.find((o) => o.date === overrideDate);
      const existingSlots = existingOverride?.slots || [];

      // Проверка пересечений с существующими слотами для этой даты
      for (const existingSlot of existingSlots) {
        if (startMinute < existingSlot.endMinute && endMinute > existingSlot.startMinute) {
          setSlotError(
            `Временной диапазон пересекается с существующим слотом: ${minutesToHHMM(existingSlot.startMinute)} - ${minutesToHHMM(existingSlot.endMinute)}`
          );
          return;
        }
      }

      // Создаем слоты
      const generatedSlots = [];
      let currentStart = startMinute;
      
      while (currentStart + newSlotDuration <= endMinute) {
        const slotStart = currentStart;
        const slotEnd = currentStart + newSlotDuration;
        
        const hasOverlap = existingSlots.some(
          (existingSlot) =>
            slotStart < existingSlot.endMinute && slotEnd > existingSlot.startMinute
        );
        
        if (hasOverlap) {
          setSlotError(
            `Создаваемый слот ${minutesToHHMM(slotStart)} - ${minutesToHHMM(slotEnd)} пересекается с существующим слотом.`
          );
          return;
        }
        
        generatedSlots.push({
          startMinute: slotStart,
          endMinute: slotEnd,
          durationMinutes: newSlotDuration,
        });
        currentStart = slotEnd;
      }

      if (generatedSlots.length === 0) {
        setSlotError("Не удалось создать слоты. Проверьте диапазон и длительность.");
        return;
      }

      const newSlots = [...existingSlots, ...generatedSlots].sort((a, b) => a.startMinute - b.startMinute);
      
      if (existingOverride) {
        setOverrides(overrides.map((o) => 
          o.date === overrideDate ? { ...o, slots: newSlots } : o
        ));
      } else {
        setOverrides([...overrides, { date: overrideDate, slots: newSlots }]);
      }

      // Сброс формы
      setNewSlotStart("10:00");
      setNewSlotEnd("18:00");
      setNewSlotDuration(60); // Кратно 10
      return;
    }

    // Обычный режим - работа с днями недели
    // Проверяем пересечение с существующими слотами
    const selectedDay = days.find((d) => d.weekday === selectedWeekday);
    const existingSlots = selectedDay?.slots || [];
    
    for (const existingSlot of existingSlots) {
      // Проверяем пересечение: новый диапазон пересекается с существующим,
      // если начало нового < конца существующего И конец нового > начала существующего
      if (startMinute < existingSlot.endMinute && endMinute > existingSlot.startMinute) {
        setSlotError(
          `Временной диапазон пересекается с существующим слотом: ${minutesToHHMM(existingSlot.startMinute)} - ${minutesToHHMM(existingSlot.endMinute)}`
        );
        return;
      }
    }

    // Создаем слоты с заданным шагом длительности
    const generatedSlots = [];
    let currentStart = startMinute;
    
    while (currentStart + newSlotDuration <= endMinute) {
      const slotStart = currentStart;
      const slotEnd = currentStart + newSlotDuration;
      
      // Проверяем пересечение каждого создаваемого слота с существующими
      const hasOverlap = existingSlots.some(
        (existingSlot) =>
          slotStart < existingSlot.endMinute && slotEnd > existingSlot.startMinute
      );
      
      if (hasOverlap) {
        setSlotError(
          `Создаваемый слот ${minutesToHHMM(slotStart)} - ${minutesToHHMM(slotEnd)} пересекается с существующим слотом.`
        );
        return;
      }
      
      generatedSlots.push({
        startMinute: slotStart,
        endMinute: slotEnd,
        durationMinutes: newSlotDuration,
      });
      currentStart = slotEnd;
    }

    if (generatedSlots.length === 0) {
      setSlotError("Не удалось создать слоты. Проверьте диапазон и длительность.");
      return;
    }

    setDays((prev) =>
      prev.map((d) =>
        d.weekday === selectedWeekday
          ? {
              ...d,
              slots: [...d.slots, ...generatedSlots].sort((a, b) => a.startMinute - b.startMinute),
            }
          : d
      )
    );
    
    // Сброс формы
    setNewSlotStart("10:00");
    setNewSlotEnd("18:00");
    setNewSlotDuration(60); // Кратно 10
  }

  function removeSlot(weekday, idx) {
    setDays((prev) =>
      prev.map((d) =>
        d.weekday === weekday
          ? { ...d, slots: d.slots.filter((_, i) => i !== idx) }
          : d
      )
    );
  }

  function removeOverrideSlot(overrideDate, slotIdx) {
    const override = overrides.find((o) => o.date === overrideDate);
    if (!override) return;
    const newSlots = override.slots.filter((_, i) => i !== slotIdx);
    if (newSlots.length === 0) {
      setOverrides(overrides.filter((o) => o.date !== overrideDate));
    } else {
      setOverrides(overrides.map((o) =>
        o.date === overrideDate ? { ...o, slots: newSlots } : o
      ));
    }
  }

  function removeOverride(overrideDate) {
    setOverrides(overrides.filter((o) => o.date !== overrideDate));
  }

  async function save() {
    try {
      await apiSaveSchedule({ days, overrides });
      setShowSuccessPopup(true);
    } catch {
      alert("Ошибка сохранения");
    }
  }

  async function saveSchedule() {
    try {
      await apiSaveSchedule({ days, overrides });
      setShowScheduleSuccessPopup(true);
    } catch {
      alert("Ошибка сохранения расписания");
    }
  }

  if (loading) return <div className="schedule-card">Загрузка...</div>;

  const selectedDay = days.find((d) => d.weekday === selectedWeekday) || {
    weekday: selectedWeekday,
    slots: [],
  };

  return (
    <div className="schedule-editor-container">
      {/* Форма настройки */}
      <div className="schedule-config-card">
        <h2 className="schedule-config-title">Настройка расписания</h2>
        
        <div className="schedule-config-form">
          {/* Кнопки выбора дня недели */}
          <div className="weekday-buttons">
            {[1, 2, 3, 4, 5, 6, 0].map((wd) => (
              <button
                key={wd}
                type="button"
                className={`weekday-btn ${selectedWeekday === wd ? "active" : ""}`}
                onClick={() => setSelectedWeekday(wd)}
              >
                {labels[wd]}
              </button>
            ))}
          </div>

          {/* Компактная форма добавления слота и список слотов на одной строке */}
          <div className="config-field-compact">
            
            <div className="compact-add-form">
              <div className="compact-form-header">
                <label className="config-label">Добавить слот</label>
                <label className="compact-toggle-label">
                  <span className="compact-toggle-text">Исключение</span>
                  <button
                    type="button"
                    className={`compact-toggle-switch ${isOverrideMode ? "active" : ""}`}
                    onClick={() => {
                      setIsOverrideMode(!isOverrideMode);
                      if (isOverrideMode) {
                        setOverrideDate("");
                      }
                    }}
                    role="switch"
                    aria-checked={isOverrideMode}
                    aria-label="Режим исключений"
                  >
                    <span className="compact-toggle-slider"></span>
                  </button>
                </label>
              </div>
              {isOverrideMode && (
                <div className="compact-date-input">
                  <input
                    ref={overrideDateRef}
                    id="overrideDateInput"
                    className="schedule-input schedule-date-input"
                    type="text"
                    value={overrideDate}
                    readOnly
                    placeholder="Выберите дату"
                    title="Дата исключения"
                    autoComplete="off"
                  />
                </div>
              )}
              <div className="compact-slot-inputs-wrapper">
                <div className="compact-slot-inputs">
                  <div className="compact-input-group">
                    <label className="config-small-label" htmlFor="newSlotStart">С</label>
                    <input
                      id="newSlotStart"
                      className="schedule-input schedule-time-input"
                      type="time"
                      value={newSlotStart}
                      onChange={(e) => {
                        setNewSlotStart(e.target.value);
                        setSlotError("");
                      }}
                      title="Время начала"
                    />
                  </div>
                  <span className="compact-separator">-</span>
                  <div className="compact-input-group">
                    <label className="config-small-label" htmlFor="newSlotEnd">До</label>
                    <input
                      id="newSlotEnd"
                      className="schedule-input schedule-time-input"
                      type="time"
                      value={newSlotEnd}
                      onChange={(e) => {
                        setNewSlotEnd(e.target.value);
                        setSlotError("");
                      }}
                      title="Время окончания"
                    />
                  </div>
                  <div className="compact-input-group compact-duration-input">
                    <label className="config-small-label" htmlFor="newSlotDuration">Мин</label>
                    <div className="schedule-number-input-field">
                      <input
                        id="newSlotDuration"
                        className="schedule-input"
                        type="number"
                        min={10}
                        max={180}
                        step={10}
                        value={newSlotDuration}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSlotError("");
                          // Разрешаем ввод пустой строки и чисел для редактирования
                          if (value === "") {
                            setNewSlotDuration(0);
                          } else {
                            const numValue = Number(value);
                            if (!isNaN(numValue)) {
                              // Позволяем вводить любое число, но ограничиваем диапазон
                              if (numValue >= 0 && numValue <= 180) {
                                setNewSlotDuration(numValue);
                              }
                            }
                          }
                        }}
                        onBlur={(e) => {
                          // При потере фокуса округляем до ближайшего кратного 10
                          const value = Number(e.target.value);
                          if (isNaN(value) || value < 10) {
                            setNewSlotDuration(10);
                          } else if (value > 180) {
                            setNewSlotDuration(180);
                          } else {
                            const rounded = Math.round(value / 10) * 10;
                            setNewSlotDuration(rounded);
                          }
                        }}
                        title="Длительность (мин, кратно 10)"
                        placeholder="мин"
                      />
                      <button
                        type="button"
                        className="schedule-spinner-btn schedule-spinner-btn-up"
                        onClick={() => {
                          const next = Math.min(180, newSlotDuration + 10);
                          setNewSlotDuration(next);
                        }}
                        aria-label="Увеличить"
                      />
                      <button
                        type="button"
                        className="schedule-spinner-btn schedule-spinner-btn-down"
                        onClick={() => {
                          const next = Math.max(10, newSlotDuration - 10);
                          setNewSlotDuration(next);
                        }}
                        aria-label="Уменьшить"
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="schedule-btn compact-add-btn"
                  onClick={addNewSlot}
                  title="Добавить слоты"
                >
                  +
                </button>
                {slotError && (
                  <div className="compact-slot-error">{slotError}</div>
                )}
              </div>
            </div>
            
            <div className="compact-slots-list">
              {isOverrideMode ? (
                <>
                  <label className="config-label">
                    Слоты {overrideDate ? `(${overrides.find((o) => o.date === overrideDate)?.slots.length || 0})` : "(0)"}
                  </label>
                  {overrideDate && overrides.find((o) => o.date === overrideDate)?.slots ? (
                    <div className="compact-slots-wrapper">
                      {(() => {
                        const dateObj = new Date(overrideDate);
                        const weekday = dateObj.getDay();
                        return <span className="compact-slots-weekday">{labels[weekday]}</span>;
                      })()}
                      <div className="compact-slots">
                        {overrides
                          .find((o) => o.date === overrideDate)
                          ?.slots.map((slot, idx) => (
                            <div key={`${overrideDate}-${slot.startMinute}-${slot.endMinute}-${idx}`} className="compact-slot-tag">
                              <div className="compact-slot-info">
                                <span className="compact-slot-time">{minutesToHHMM(slot.startMinute)}</span>
                                <span className="compact-slot-duration">{slot.durationMinutes} мин</span>
                              </div>
                              <button
                                type="button"
                                className="compact-slot-remove"
                                onClick={() => {
                                  const override = overrides.find((o) => o.date === overrideDate);
                                  if (!override) return;
                                  const newSlots = override.slots.filter((_, i) => i !== idx);
                                  if (newSlots.length === 0) {
                                    setOverrides(overrides.filter((o) => o.date !== overrideDate));
                                  } else {
                                    setOverrides(overrides.map((o) =>
                                      o.date === overrideDate ? { ...o, slots: newSlots } : o
                                    ));
                                  }
                                }}
                                aria-label="Удалить слот"
                                title="Удалить"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <div className="schedule-empty-compact">
                      {overrideDate ? "Нет слотов" : "Выберите дату"}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <label className="config-label">Слоты ({selectedDay.slots.length})</label>
                  {selectedDay.slots.length === 0 ? (
                    <div className="schedule-empty-compact">Нет слотов</div>
                  ) : (
                    <div className="compact-slots-wrapper">
                      <span className="compact-slots-weekday">{labels[selectedWeekday]}</span>
                      <div className="compact-slots">
                        {selectedDay.slots.map((slot, idx) => (
                          <div key={`${selectedWeekday}-${slot.startMinute}-${slot.endMinute}-${idx}`} className="compact-slot-tag">
                            <div className="compact-slot-info">
                              <span className="compact-slot-time">{minutesToHHMM(slot.startMinute)}</span>
                              <span className="compact-slot-duration">{slot.durationMinutes} мин</span>
                            </div>
                            <button
                              type="button"
                              className="compact-slot-remove"
                              onClick={() => removeSlot(selectedWeekday, idx)}
                              aria-label="Удалить слот"
                              title="Удалить"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="schedule-save-section">
            <button className="schedule-btn  schedule-save-btn" onClick={save}>
              Сохранить все изменения
            </button>
          </div>
        </div>
      </div>

      {/* Отображение всех дней недели */}
      <div className="schedule-display-section">
        <div className="schedule-display-header">
          <h2 className="schedule-display-title">Текущее расписание</h2>
          <button 
            className="schedule-btn  schedule-save-btn-inline" 
            onClick={saveSchedule}
          >
            Сохранить расписание
          </button>
        </div>
        
        {/* Компактное отображение исключений */}
        {overrides.length > 0 && (
          <div className="overrides-compact">
            <div className="overrides-compact-label">Исключения:</div>
            <div className="overrides-compact-list">
              {overrides
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((override) => {
                  const dateObj = new Date(override.date);
                  const weekday = dateObj.getDay();
                  const weekdayLabel = labels[weekday];
                  const formattedDate = dateObj.toLocaleDateString("ru-RU", {
                    day: "2-digit",
                    month: "2-digit",
                  });
                  return (
                    <div key={override.date} className="override-compact-item">
                      <span className="override-compact-weekday">{weekdayLabel}</span>
                      <span className="override-compact-date">{formattedDate}</span>
                      <div className="override-compact-slots">
                        {override.slots.map((slot, idx) => (
                          <span key={`${override.date}-${slot.startMinute}-${slot.endMinute}-${idx}`} className="override-compact-slot">
                            {minutesToHHMM(slot.startMinute)}-{minutesToHHMM(slot.endMinute)}
                            <button
                              type="button"
                              className="override-compact-slot-remove"
                              onClick={() => removeOverrideSlot(override.date, idx)}
                              aria-label="Удалить слот"
                              title="Удалить слот"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        className="override-compact-remove"
                        onClick={() => removeOverride(override.date)}
                        aria-label="Удалить исключение"
                        title="Удалить исключение"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
        
        <div className="schedule-week-view">
          {[1, 2, 3, 4, 5, 6, 0].map((weekday) => {
            const day = days.find((d) => d.weekday === weekday) || {
              weekday,
              slots: [],
            };
            return (
              <div key={weekday} className="schedule-week-day">
                <div className="week-day-header">
                  <h3 className="week-day-title">{fullLabels[day.weekday]}</h3>
                  <span className="week-day-label">{labels[day.weekday]}</span>
                </div>
                <div className="week-day-slots">
                  {day.slots.length === 0 ? (
                    <div className="week-day-empty">Нет слотов</div>
                  ) : (
                    <>
                      {day.slots
                        .slice(
                          slotOffsets.get(weekday) || 0,
                          (slotOffsets.get(weekday) || 0) + MAX_VISIBLE_SLOTS
                        )
                        .map((slot, idx) => {
                          const actualIdx = (slotOffsets.get(weekday) || 0) + idx;
                          return (
                            <div key={`${weekday}-${slot.startMinute}-${slot.endMinute}-${actualIdx}`} className="week-day-slot week-day-slot-with-remove">
                              <div className="week-slot-content">
                                <div className="week-slot-time">
                                  {minutesToHHMM(slot.startMinute)} - {minutesToHHMM(slot.endMinute)}
                                </div>
                                <div className="week-slot-duration">{slot.durationMinutes} мин</div>
                              </div>
                              <button
                                type="button"
                                className="compact-slot-remove"
                                onClick={() => removeSlot(weekday, actualIdx)}
                                aria-label="Удалить слот"
                                title="Удалить слот"
                              >
                                ×
                              </button>
                            </div>
                          );
                        })}
                      {day.slots.length > MAX_VISIBLE_SLOTS && (
                        <div className="week-day-nav">
                          <button
                            type="button"
                            className="week-day-nav-btn"
                            disabled={(slotOffsets.get(weekday) || 0) === 0}
                            onClick={() => {
                              const currentOffset = slotOffsets.get(weekday) || 0;
                              const newOffset = Math.max(0, currentOffset - MAX_VISIBLE_SLOTS);
                              setSlotOffsets(new Map(slotOffsets).set(weekday, newOffset));
                            }}
                            aria-label="Предыдущие слоты"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="18 15 12 9 6 15"></polyline>
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="week-day-nav-btn"
                            disabled={(slotOffsets.get(weekday) || 0) + MAX_VISIBLE_SLOTS >= day.slots.length}
                            onClick={() => {
                              const currentOffset = slotOffsets.get(weekday) || 0;
                              const newOffset = Math.min(
                                day.slots.length - MAX_VISIBLE_SLOTS,
                                currentOffset + MAX_VISIBLE_SLOTS
                              );
                              setSlotOffsets(new Map(slotOffsets).set(weekday, newOffset));
                            }}
                            aria-label="Следующие слоты"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title="Изменения сохранены!"
        message="Все изменения успешно внесены в текущее расписание."
      />

      <SuccessPopup
        isOpen={showScheduleSuccessPopup}
        onClose={() => setShowScheduleSuccessPopup(false)}
        title="Расписание сохранено!"
        message="Расписание успешно обновлено."
      />
    </div>
  );
}

export default ScheduleEditor;
