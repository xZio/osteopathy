import { useEffect, useState } from "react";
import { apiListAppointments, apiGetSchedule } from "../../utils/api";
import "./CalendarView.css";

function getWeekStart(d) {
  const ms = new Date(d);
  // start week on Monday in Moscow
  const day = (ms.getUTCDay() + 6) % 7; // 0..6
  ms.setUTCDate(ms.getUTCDate() - day);
  ms.setUTCHours(0, 0, 0, 0);
  return ms;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

function toYMDInMoscow(d) {
  // format YYYY-MM-DD in Moscow timezone
  const year = new Intl.DateTimeFormat("ru-RU", {
    year: "numeric",
    timeZone: "Europe/Moscow",
  }).format(d);
  const month = new Intl.DateTimeFormat("ru-RU", {
    month: "2-digit",
    timeZone: "Europe/Moscow",
  }).format(d);
  const day = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    timeZone: "Europe/Moscow",
  }).format(d);
  return `${year}-${month}-${day}`;
}

function CalendarView() {
  const [items, setItems] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const fmtDay = new Intl.DateTimeFormat("ru-RU", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    timeZone: "Europe/Moscow",
  });
  const fmtTime = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Moscow",
  });

  useEffect(() => {
    (async () => {
      const [appointments, scheduleData] = await Promise.all([
        apiListAppointments(),
        apiGetSchedule(),
      ]);
      setItems(appointments || []);
      setSchedule(scheduleData);
    })();
  }, []);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function groupByDateMoscow(list) {
    const out = new Map();
    for (const it of list) {
      const d = new Date(it.startsAt);
      const key = toYMDInMoscow(d);
      if (!out.has(key)) out.set(key, []);
      out.get(key).push(it);
    }
    for (const v of out.values())
      v.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    return out;
  }

  const grouped = groupByDateMoscow(items);

  // Получаем слоты для конкретной даты
  function getSlotsForDate(dateISO) {
    if (!schedule) return [];
    
    // Проверяем исключения
    const override = (schedule.overrides || []).find((o) => o.date === dateISO);
    if (override) {
      return override.slots || [];
    }
    
    // Получаем день недели (0=Вс, 1=Пн, ...)
    const date = new Date(dateISO + "T00:00:00");
    const weekday = date.getDay();
    const daySchedule = (schedule.days || []).find((d) => d.weekday === weekday);
    return daySchedule?.slots || [];
  }

  function minutesToHHMM(total) {
    const h = String(Math.floor(total / 60)).padStart(2, "0");
    const m = String(total % 60).padStart(2, "0");
    return `${h}:${m}`;
  }

  return (
    <div className="calendar-view-card">
      <div className="calendar-view-header">
        <h2 className="calendar-view-title">Календарь (неделя)</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="calendar-view-btn"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
          >
            ←
          </button>
          <button
            className="calendar-view-btn"
            onClick={() => setWeekStart(getWeekStart(new Date()))}
          >
            Сегодня
          </button>
          <button
            className="calendar-view-btn"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
          >
            →
          </button>
        </div>
      </div>
      <div className="calendar-grid">
        {days.map((day) => {
          const key = toYMDInMoscow(day);
          const list = grouped.get(key) || [];
          return (
            <div key={key} className="calendar-col">
              <div className="calendar-col-header">{fmtDay.format(day)}</div>
              <div className="calendar-col-body">
                {/* Показываем доступные слоты */}
                {(() => {
                  const slots = getSlotsForDate(key);
                  const hasSlots = slots.length > 0;
                  const hasAppointments = list.length > 0;
                  
                  if (!hasSlots && !hasAppointments) {
                    return <div className="calendar-empty">Нет записей</div>;
                  }
                  
                  return (
                    <>
                      {hasSlots && (
                        <div className="calendar-slots-info">
                          <div className="slots-header">Доступные слоты:</div>
                          {slots.map((slot, idx) => (
                            <div key={`slot-${idx}`} className="calendar-slot">
                              {minutesToHHMM(slot.startMinute)} - {minutesToHHMM(slot.endMinute)}
                              <span className="slot-duration-badge">{slot.durationMinutes} мин</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {hasAppointments && (
                        <div className={hasSlots ? "calendar-appointments-section" : ""}>
                          {hasSlots && <div className="appointments-header">Записи:</div>}
                          {list.map((it) => (
                            <div key={it._id} className="event-card">
                              <div className="event-time">
                                {fmtTime.format(new Date(it.startsAt))}
                              </div>
                              <div className="event-name" title={it.fullName}>
                                {it.fullName}
                              </div>
                              <div className="event-phone">{it.phone}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarView;
