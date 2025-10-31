import { useEffect, useState, useRef, useCallback } from "react";
import {
  apiLogin,
  apiListAppointments,
  apiCreateAppointment,
  apiDeleteAppointment,
  apiGetSchedule,
  apiSaveSchedule,
} from "../../utils/api";
import "./Admin.css";
import { IMaskInput } from "react-imask";
import AirDatepicker from "air-datepicker";
import "air-datepicker/air-datepicker.css";

function Login({ onLoggedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const { token } = await apiLogin(username, password);
      localStorage.setItem("admin_token", token);
      onLoggedIn();
    } catch {
      setError("Неверные данные");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ maxWidth: 360, margin: "40px auto", display: "grid", gap: 8 }}
    >
      <h2>Вход для администратора</h2>
      <input
        placeholder="Логин"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        placeholder="Пароль"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <div style={{ color: "red" }}>{error}</div>}
      <button type="submit">Войти</button>
    </form>
  );
}

function Admin() {
  const [token] = useState(() => localStorage.getItem("admin_token"));
  const [tab, setTab] = useState("appointments");
  if (!token) return <Login onLoggedIn={() => window.location.reload()} />;
  return (
    <div className="admin-container">
      <div className="admin-wrap">
        <div className="admin-header">
          <div className="admin-title">Администрирование</div>
          <div className="admin-tabs">
            <button
              className="btn"
              onClick={() => setTab("appointments")}
              disabled={tab === "appointments"}
            >
              Записи
            </button>
            <button
              className="btn"
              onClick={() => setTab("schedule")}
              disabled={tab === "schedule"}
            >
              Расписание
            </button>
            <button
              className="btn"
              onClick={() => setTab("calendar")}
              disabled={tab === "calendar"}
            >
              Календарь
            </button>
          </div>
        </div>
        {tab === "appointments" && <Appointments />}
        {tab === "schedule" && <ScheduleEditor />}
        {tab === "calendar" && <CalendarView />}
      </div>
    </div>
  );
}

function Appointments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [start, setStart] = useState("10:00");
  const [duration, setDuration] = useState(30);
  const [durationInput, setDurationInput] = useState("30");
  const [errName, setErrName] = useState("");
  const [errPhone, setErrPhone] = useState("");
  const [errDate, setErrDate] = useState("");
  const [errTime, setErrTime] = useState("");
  const [errDuration, setErrDuration] = useState("");
  const dateInputRef = useRef(null);

  const [confirmId, setConfirmId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const validateDate = useCallback((value) => {
    if (!value) {
      setErrDate("Выберите дату");
      return false;
    }
    const iso = toISODate(value);
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      setErrDate("Неверный формат даты");
      return false;
    }
    // Compute today's date in Europe/Moscow as YYYY-MM-DD to avoid UTC/local mismatches
    const parts = new Intl.DateTimeFormat('ru-RU', {
      year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Europe/Moscow'
    }).formatToParts(new Date());
    const y = parts.find(p => p.type === 'year')?.value;
    const m = parts.find(p => p.type === 'month')?.value;
    const d = parts.find(p => p.type === 'day')?.value;
    const todayYMD = `${y}-${m}-${d}`;
    if (iso < todayYMD) {
      setErrDate("Дата не может быть в прошлом");
      return false;
    }
    setErrDate("");
    return true;
  }, []);

  useEffect(() => {
    new AirDatepicker("#adminDateInput", {
      minDate: Date.now(),
      autoClose: true,
      onSelect: ({ formattedDate }) => {
        setDate(formattedDate);
        validateDate(formattedDate);
      },
    });
  }, [validateDate]);

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
        const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
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
    } else setErrTime("");

    if (!Number.isFinite(duration) || duration < 5) {
      setErrDuration("Минимальная длительность 5 минут");
      ok = false;
    } else if (duration > 180) {
      setErrDuration("Длительность не может быть больше 180 минут");
      ok = false;
    } else setErrDuration("");

    return ok;
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!validateAll()) return;
    setLoading(true);
    try {
      const [sh, sm] = start.split(":").map(Number);
      const isoDate = toISODate(date);
      // Build time as Moscow (+03:00) and store as UTC ISO
      const startLocal = new Date(`${isoDate}T${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}:00+03:00`);
      const startsAt = startLocal.toISOString();
      const endsAt = new Date(startLocal.getTime() + duration * 60000).toISOString();
      await apiCreateAppointment({ fullName, phone, note: "", startsAt, endsAt });
      setFullName("");
      setPhone("");
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

  function logout() {
    localStorage.removeItem("admin_token");
    window.location.reload();
  }

  return (
    <div className="admin-card">
      <div className="admin-header">
        <h2 className="admin-title">Записи</h2>
        <button className="btn" onClick={logout}>
          Выйти
        </button>
      </div>
      <form className="admin-grid" onSubmit={handleCreate} noValidate>
        <div>
          <label className="muted" htmlFor="adminNameInput">ФИО</label>
          <input
            id="adminNameInput"
            className="input"
            placeholder="ФИО"
            maxLength={30}
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              validateName(e.target.value);
            }}
            required
          />
          <div className="error-slot">{errName}</div>
        </div>
        <div>
          <label className="muted" htmlFor="adminPhoneInput">Телефон</label>
          <IMaskInput
            id="adminPhoneInput"
            className={`input ${(!phone || phone.includes('_') || !/^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/.test(phone)) ? 'masked' : ''}`}
            placeholder="+7 (___) ___-__-__"
            mask={"+7 (000) 000-00-00"}
            unmask={false}
            overwrite="shift"
            lazy={false}
            value={phone}
            onAccept={(v) => setPhone(v)}
            required
          />
          <div className="error-slot">{errPhone}</div>
        </div>
        <div>
          <label className="muted" htmlFor="adminDateInput">Дата</label>
          <IMaskInput
            id="adminDateInput"
            ref={dateInputRef}
            className={`input ${(!date || date.includes('_') || date.length < 10) ? 'masked' : ''}`}
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
              validateDate(v);
            }}
            required
          />
          <div className="error-slot">{errDate}</div>
        </div>
        <div>
          <label className="muted" htmlFor="adminTimeInput">Время начала</label>
          <input
            className="input"
            type="time"
            id="adminTimeInput"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
          <div className="error-slot">{errTime}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div>
            <label className="muted" htmlFor="adminIntervalInput">Длительность</label>
            <div className="number-input-wrapper">
              <div className="number-input-field">
                <input
                  className="input"
                  type="number"
                  id="adminIntervalInput"
                  min={10}
                  step={5}
                  value={durationInput}
                  onChange={(e) => {
                    // keep as string to avoid leading zero artifacts like 060
                    const raw = e.target.value;
                    // allow empty while editing
                    if (raw === "") {
                      setDurationInput("");
                      setDuration(NaN);
                      setErrDuration("Минимальная длительность 5 минут");
                      return;
                    }
                    // strip leading zeros but keep single 0 if needed
                    const noLeading = raw.replace(/^0+(?=\d)/, "");
                    setDurationInput(noLeading);
                    const val = Number(noLeading);
                    setDuration(val);
                    if (!Number.isFinite(val) || val < 5) setErrDuration("Минимальная длительность 5 минут");
                    else if (val > 180) setErrDuration("Длительность не может быть больше 180 минут");
                    else setErrDuration("");
                  }}
                  style={{ width: '100%' }}
                />
                <button
                  type="button"
                  className="spinner-btn spinner-btn-up"
                  onClick={() => {
                    const next = Math.min(300, (Number.isFinite(duration) ? duration : 0) + 5);
                    setDuration(next);
                    setDurationInput(String(next));
                    if (next > 180) setErrDuration("Длительность не может быть больше 180 минут");
                    else setErrDuration("");
                  }}
                />
                <button
                  type="button"
                  className="spinner-btn spinner-btn-down"
                  onClick={() => {
                    const base = Number.isFinite(duration) ? duration : 0;
                    const next = Math.max(5, base - 5);
                    setDuration(next);
                    setDurationInput(String(next));
                    if (next < 5) setErrDuration("Минимальная длительность 5 минут");
                    else setErrDuration("");
                  }}
                />
              </div>
              <div className="error-slot">{errDuration}</div>
            </div>
          </div>
          <div>
            <label className="muted" style={{ visibility: 'hidden' }}>&nbsp;</label>
            <button className="btn btn-primary" type="submit" style={{ height: 40, width: '100%' }}>
              Добавить
            </button>
          </div>
        </div>
      </form>
      {loading ? (
        <div className="muted">Загрузка...</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>ФИО</th>
              <th>Телефон</th>
              <th>Начало</th>
              <th>Создано</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const fmt = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Moscow' });
              const startsStr = it.startsAt ? fmt.format(new Date(it.startsAt)) : '';
              const createdStr = it.createdAt ? fmt.format(new Date(it.createdAt)) : '';
              return (
                <tr key={it._id}>
                  <td>{it.fullName}</td>
                  <td>{it.phone}</td>
                  <td>{startsStr}</td>
                  <td>{createdStr}</td>
                  <td>
                    <button
                      className="btn btn-danger"
                      onClick={() => askDelete(it._id)}
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {showConfirm && (
        <div className="modal-backdrop" onClick={cancelDelete}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Подтверждение</div>
            <div className="modal-body">Удалить запись? Это действие необратимо.</div>
            <div className="modal-actions">
              <button className="btn" onClick={cancelDelete}>Отмена</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Удалить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarView() {
  const [items, setItems] = useState([]);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const fmtDay = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'Europe/Moscow' });
  const fmtTime = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Moscow' });

  useEffect(() => {
    (async () => {
      const data = await apiListAppointments();
      setItems(data || []);
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
    for (const v of out.values()) v.sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    return out;
  }

  const grouped = groupByDateMoscow(items);

  return (
    <div className="admin-card">
      <div className="admin-header">
        <h2 className="admin-title">Календарь (неделя)</h2>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn" onClick={() => setWeekStart(addDays(weekStart, -7))}>←</button>
          <button className="btn" onClick={() => setWeekStart(getWeekStart(new Date()))}>Сегодня</button>
          <button className="btn" onClick={() => setWeekStart(addDays(weekStart, 7))}>→</button>
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
                {list.length === 0 ? (
                  <div className="calendar-empty">Нет записей</div>
                ) : (
                  list.map((it) => (
                    <div key={it._id} className="event-card">
                      <div className="event-time">{fmtTime.format(new Date(it.startsAt))}</div>
                      <div className="event-name" title={it.fullName}>{it.fullName}</div>
                      <div className="event-phone">{it.phone}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getWeekStart(d) {
  const ms = new Date(d);
  // start week on Monday in Moscow
  const day = (ms.getUTCDay() + 6) % 7; // 0..6
  ms.setUTCDate(ms.getUTCDate() - day);
  ms.setUTCHours(0,0,0,0);
  return ms;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}
function toYMDInMoscow(d) {
  // format YYYY-MM-DD in Moscow timezone
  const year = new Intl.DateTimeFormat('ru-RU', { year: 'numeric', timeZone: 'Europe/Moscow' }).format(d);
  const month = new Intl.DateTimeFormat('ru-RU', { month: '2-digit', timeZone: 'Europe/Moscow' }).format(d);
  const day = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', timeZone: 'Europe/Moscow' }).format(d);
  return `${year}-${month}-${day}`;
}

function ScheduleEditor() {
  const [loading, setLoading] = useState(true);
  const [timezone, setTimezone] = useState("Europe/Moscow");
  const [days, setDays] = useState(() =>
    Array.from({ length: 7 }, (_, i) => ({ weekday: i, slots: [] }))
  );
  const [overrides, setOverrides] = useState([]);
  const labels = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

  useEffect(() => {
    (async () => {
      try {
        const s = await apiGetSchedule();
        setTimezone(s?.timezone || "Europe/Moscow");
        // merge existing days into 0..6 template
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

  function updateSlot(weekday, idx, field, value) {
    setDays((prev) =>
      prev.map((d) => {
        if (d.weekday !== weekday) return d;
        const slots = d.slots.slice();
        if (field === "startTime") {
          slots[idx] = { ...slots[idx], startMinute: hhmmToMinutes(value) };
        } else if (field === "endTime") {
          slots[idx] = { ...slots[idx], endMinute: hhmmToMinutes(value) };
        } else {
          slots[idx] = { ...slots[idx], [field]: Number(value) };
        }
        return { ...d, slots };
      })
    );
  }

  function addSlot(weekday) {
    setDays((prev) =>
      prev.map((d) =>
        d.weekday === weekday
          ? {
              ...d,
              slots: [
                ...d.slots,
                { startMinute: 600, endMinute: 1080, durationMinutes: 60 },
              ],
            }
          : d
      )
    );
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

  async function save() {
    setLoading(true);
    try {
      await apiSaveSchedule({ timezone, days, overrides });
      alert("Сохранено");
    } catch {
      alert("Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="admin-card">Загрузка...</div>;

  return (
    <div className="admin-card" style={{ display: "grid", gap: 16 }}>
      <div className="admin-form">
        <label className="muted">Часовой пояс</label>
        <input
          className="input"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
        />
      </div>
      {days.map((d) => (
        <div key={d.weekday} className="admin-card" style={{ padding: 12 }}>
          <div className="admin-header">
            <strong>{labels[d.weekday]}</strong>
            <button className="btn" onClick={() => addSlot(d.weekday)}>
              + слот
            </button>
          </div>
          {d.slots.length === 0 ? (
            <div className="muted" style={{ marginTop: 8 }}>
              Нет слотов
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
              {d.slots.map((s, idx) => (
                <div key={idx} className="slot-row">
                  <label className="muted">С</label>
                  <input
                    className="input"
                    type="time"
                    value={minutesToHHMM(s.startMinute)}
                    onChange={(e) =>
                      updateSlot(d.weekday, idx, "startTime", e.target.value)
                    }
                  />
                  <label className="muted">до</label>
                  <input
                    className="input"
                    type="time"
                    value={minutesToHHMM(s.endMinute)}
                    onChange={(e) =>
                      updateSlot(d.weekday, idx, "endTime", e.target.value)
                    }
                  />
                  <label className="muted">длит. (мин)</label>
                  <input
                    className="input"
                    type="number"
                    min={5}
                    step={5}
                    value={s.durationMinutes}
                    onChange={(e) =>
                      updateSlot(
                        d.weekday,
                        idx,
                        "durationMinutes",
                        e.target.value
                      )
                    }
                  />
                  <button
                    className="btn btn-danger"
                    onClick={() => removeSlot(d.weekday, idx)}
                  >
                    -
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <div>
        <button className="btn btn-primary" onClick={save}>
          Сохранить
        </button>
      </div>
    </div>
  );
}

export default Admin;
