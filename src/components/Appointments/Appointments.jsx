import { useEffect, useState, useRef, useCallback } from "react";
import {
  apiListAppointments,
  apiCreateAppointment,
  apiUpdateAppointment,
  apiDeleteAppointment,
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
  const [editingId, setEditingId] = useState(null);

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
    } else setErrTime("");

    if (!Number.isFinite(duration) || duration < 10) {
      setErrDuration("Минимальная длительность 10 минут");
      ok = false;
    } else if (duration > 180) {
      setErrDuration("Длительность не может быть больше 180 минут");
      ok = false;
    } else if (duration % 10 !== 0) {
      setErrDuration("Длительность должна быть кратной 10 минутам");
      ok = false;
    } else setErrDuration("");

    return ok;
  }

  function startEdit(item) {
    setEditingId(item._id);
    setFullName(item.fullName || "");
    setPhone(item.phone || "");
    
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
      setDate(`${d}.${m}.${y}`);
      
      const time = new Intl.DateTimeFormat("ru-RU", {
        timeZone: "Europe/Moscow",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(startDate);
      setStart(time);
    }
    
    // Calculate duration and round to nearest multiple of 10
    if (item.startsAt && item.endsAt) {
      const durationMs = new Date(item.endsAt) - new Date(item.startsAt);
      const durationMin = Math.round(durationMs / 60000);
      const rounded = Math.round(durationMin / 10) * 10;
      const finalDuration = Math.max(10, Math.min(180, rounded));
      setDuration(finalDuration);
      setDurationInput(String(finalDuration));
    }
  }

  function cancelEdit() {
    setEditingId(null);
    setFullName("");
    setPhone("");
    setDate("");
    setStart("10:00");
    setDuration(30);
    setDurationInput("30");
    setErrName("");
    setErrPhone("");
    setErrDate("");
    setErrTime("");
    setErrDuration("");
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!validateAll()) return;
    setLoading(true);
    try {
      const [sh, sm] = start.split(":").map(Number);
      const isoDate = toISODate(date);
      // Build time as Moscow (+03:00) and store as UTC ISO
      const startLocal = new Date(
        `${isoDate}T${String(sh).padStart(2, "0")}:${String(sm).padStart(
          2,
          "0"
        )}:00+03:00`
      );
      const startsAt = startLocal.toISOString();
      const endsAt = new Date(
        startLocal.getTime() + duration * 60000
      ).toISOString();
      
      if (editingId) {
        await apiUpdateAppointment(editingId, {
          fullName,
          phone,
          note: "",
          startsAt,
          endsAt,
        });
        cancelEdit();
      } else {
        await apiCreateAppointment({
          fullName,
          phone,
          note: "",
          startsAt,
          endsAt,
        });
        setFullName("");
        setPhone("");
        setDate("");
        setStart("10:00");
        setDuration(30);
        setDurationInput("30");
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
            ref={dateInputRef}
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
              validateDate(v);
            }}
            required
          />
          <div className="appointments-error-slot">{errDate}</div>
        </div>
        <div>
          <label className="appointments-muted" htmlFor="adminTimeInput">
            Время начала
          </label>
          <input
            className="appointments-input"
            type="time"
            id="adminTimeInput"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
          <div className="appointments-error-slot">{errTime}</div>
        </div>
        <div>
          <div>
            <label className="appointments-muted" htmlFor="adminIntervalInput">
              Длительность
            </label>
            <div className="appointments-number-input-wrapper">
              <div className="appointments-number-input-field">
                <input
                  className="appointments-input"
                  type="number"
                  id="adminIntervalInput"
                  min={10}
                  max={180}
                  step={10}
                  value={durationInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setErrDuration("");
                    // Разрешаем ввод пустой строки и чисел для редактирования
                    if (value === "") {
                      setDurationInput("");
                      setDuration(0);
                    } else {
                      const numValue = Number(value);
                      if (!isNaN(numValue)) {
                        // Позволяем вводить любое число, но ограничиваем диапазон
                        if (numValue >= 0 && numValue <= 180) {
                          setDurationInput(value);
                          setDuration(numValue);
                        }
                      }
                    }
                  }}
                  onBlur={(e) => {
                    // При потере фокуса округляем до ближайшего кратного 10
                    const value = Number(e.target.value);
                    if (isNaN(value) || value < 10) {
                      setDuration(10);
                      setDurationInput("10");
                    } else if (value > 180) {
                      setDuration(180);
                      setDurationInput("180");
                    } else {
                      const rounded = Math.round(value / 10) * 10;
                      setDuration(rounded);
                      setDurationInput(String(rounded));
                    }
                  }}
                />
                <button
                  type="button"
                  className="appointments-spinner-btn appointments-spinner-btn-up"
                  onClick={() => {
                    const next = Math.min(180, (Number.isFinite(duration) ? duration : 10) + 10);
                    setDuration(next);
                    setDurationInput(String(next));
                    if (next > 180)
                      setErrDuration(
                        "Длительность не может быть больше 180 минут"
                      );
                    else setErrDuration("");
                  }}
                />
                <button
                  type="button"
                  className="appointments-spinner-btn appointments-spinner-btn-down"
                  onClick={() => {
                    const base = Number.isFinite(duration) ? duration : 10;
                    const next = Math.max(10, base - 10);
                    setDuration(next);
                    setDurationInput(String(next));
                    if (next < 10)
                      setErrDuration("Минимальная длительность 10 минут");
                    else setErrDuration("");
                  }}
                />
              </div>
              <div className="appointments-error-slot">{errDuration}</div>
            </div>
          </div>
        </div>
        <div>
          <label
            className="appointments-muted"
            style={{ visibility: "hidden" }}
          >
            &nbsp;
          </label>
          <button
            className="appointments-btn appointments-btn-primary"
            type="submit"
            style={{ height: 40, width: "100%" }}
          >
            {editingId ? "Сохранить" : "Добавить"}
          </button>
          {editingId && (
            <button
              className="appointments-btn"
              type="button"
              onClick={cancelEdit}
              style={{ height: 40, width: "100%" }}
            >
              Отмена
            </button>
          )}
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
    </div>
  );
}

export default Appointments;
