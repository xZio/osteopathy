import { useEffect, useState, useRef, useCallback } from "react";
import {
  apiListAppointments,
  apiCreateAppointment,
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
      await apiCreateAppointment({
        fullName,
        phone,
        note: "",
        startsAt,
        endsAt,
      });
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
    <div className="appointments-card">
      <div className="appointments-header">
        <h2 className="appointments-title">Записи</h2>
        <button className="appointments-btn" onClick={logout}>
          Выйти
        </button>
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
                    if (!Number.isFinite(val) || val < 5)
                      setErrDuration("Минимальная длительность 5 минут");
                    else if (val > 180)
                      setErrDuration(
                        "Длительность не может быть больше 180 минут"
                      );
                    else setErrDuration("");
                  }}
                />
                <button
                  type="button"
                  className="appointments-spinner-btn appointments-spinner-btn-up"
                  onClick={() => {
                    const next = Math.min(
                      300,
                      (Number.isFinite(duration) ? duration : 0) + 5
                    );
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
                    const base = Number.isFinite(duration) ? duration : 0;
                    const next = Math.max(5, base - 5);
                    setDuration(next);
                    setDurationInput(String(next));
                    if (next < 5)
                      setErrDuration("Минимальная длительность 5 минут");
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
                <tr key={it._id}>
                  <td data-label="ФИО">{it.fullName}</td>
                  <td data-label="Телефон">{it.phone}</td>
                  <td data-label="Время приёма">{startsStr}</td>
                  <td data-label="Создано">{createdStr}</td>
                  <td data-label="">
                    <button
                      className="appointments-btn appointments-btn-danger"
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
