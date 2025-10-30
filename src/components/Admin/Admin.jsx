import { useEffect, useState } from 'react';
import { apiLogin, apiListAppointments, apiCreateAppointment, apiDeleteAppointment, apiGetSchedule, apiSaveSchedule } from '../../utils/api';

function Login({ onLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const { token } = await apiLogin(username, password);
      localStorage.setItem('admin_token', token);
      onLoggedIn();
    } catch {
      setError('Неверные данные');
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 360, margin: '40px auto', display: 'grid', gap: 8 }}>
      <h2>Вход для администратора</h2>
      <input placeholder="Логин" value={username} onChange={(e) => setUsername(e.target.value)} />
      <input placeholder="Пароль" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <button type="submit">Войти</button>
    </form>
  );
}

function Appointments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [start, setStart] = useState('10:00');
  const [duration, setDuration] = useState(30);

  async function load() {
    setLoading(true);
    const data = await apiListAppointments();
    setItems(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    const [sh, sm] = start.split(':').map(Number);
    const startsAt = new Date(`${date}T${String(sh).padStart(2,'0')}:${String(sm).padStart(2,'0')}:00.000Z`).toISOString();
    const endsAt = new Date(new Date(startsAt).getTime() + duration * 60000).toISOString();
    await apiCreateAppointment({ fullName, phone, note: '', startsAt, endsAt });
    setFullName(''); setPhone('');
    load();
  }

  async function handleDelete(id) {
    await apiDeleteAppointment(id);
    load();
  }

  function logout() {
    localStorage.removeItem('admin_token');
    window.location.reload();
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2>Записи</h2>
        <button onClick={logout}>Выйти</button>
      </div>
      <form onSubmit={handleCreate} style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:8, alignItems:'end', marginBottom:16 }}>
        <input placeholder="ФИО" value={fullName} onChange={(e)=>setFullName(e.target.value)} required />
        <input placeholder="Телефон" value={phone} onChange={(e)=>setPhone(e.target.value)} required />
        <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} required />
        <input type="time" value={start} onChange={(e)=>setStart(e.target.value)} />
        <div style={{ display:'flex', gap:8 }}>
          <input type="number" min={10} step={5} value={duration} onChange={(e)=>setDuration(Number(e.target.value))} style={{ width:100 }} />
          <button type="submit">Добавить</button>
        </div>
      </form>
      {loading ? (
        <div>Загрузка...</div>
      ) : (
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign:'left' }}>ФИО</th>
              <th style={{ textAlign:'left' }}>Телефон</th>
              <th style={{ textAlign:'left' }}>Начало</th>
              <th style={{ textAlign:'left' }}>Конец</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it._id}>
                <td>{it.fullName}</td>
                <td>{it.phone}</td>
                <td>{new Date(it.startsAt).toLocaleString()}</td>
                <td>{new Date(it.endsAt).toLocaleString()}</td>
                <td><button onClick={() => handleDelete(it._id)}>Удалить</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function Admin() {
  const [token] = useState(() => localStorage.getItem('admin_token'));
  const [tab, setTab] = useState('appointments');
  if (!token) return <Login onLoggedIn={() => window.location.reload()} />;
  return (
    <div>
      <div style={{ display:'flex', gap:8, padding:16 }}>
        <button onClick={() => setTab('appointments')} disabled={tab==='appointments'}>Записи</button>
        <button onClick={() => setTab('schedule')} disabled={tab==='schedule'}>Расписание</button>
      </div>
      {tab === 'appointments' ? <Appointments /> : <ScheduleEditor />}
    </div>
  );
}

function ScheduleEditor() {
  const [loading, setLoading] = useState(true);
  const [timezone, setTimezone] = useState('Europe/Moscow');
  const [days, setDays] = useState(() => Array.from({ length: 7 }, (_, i) => ({ weekday: i, slots: [] })));
  const [overrides, setOverrides] = useState([]);
  const labels = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];

  useEffect(() => { (async () => {
    try {
      const s = await apiGetSchedule();
      setTimezone(s?.timezone || 'Europe/Moscow');
      // merge existing days into 0..6 template
      const byWeekday = new Map((s?.days||[]).map(d => [d.weekday, d]));
      setDays(Array.from({ length: 7 }, (_, i) => byWeekday.get(i) || { weekday: i, slots: [] }));
      setOverrides(s?.overrides || []);
    } finally {
      setLoading(false);
    }
  })(); }, []);

  function minutesToHHMM(total) {
    const h = String(Math.floor(total / 60)).padStart(2, '0');
    const m = String(total % 60).padStart(2, '0');
    return `${h}:${m}`;
  }

  function hhmmToMinutes(hhmm) {
    const [h, m] = (hhmm || '').split(':').map((n) => Number(n));
    if (Number.isFinite(h) && Number.isFinite(m)) return h * 60 + m;
    return 0;
  }

  function updateSlot(weekday, idx, field, value) {
    setDays(prev => prev.map(d => {
      if (d.weekday !== weekday) return d;
      const slots = d.slots.slice();
      if (field === 'startTime') {
        slots[idx] = { ...slots[idx], startMinute: hhmmToMinutes(value) };
      } else if (field === 'endTime') {
        slots[idx] = { ...slots[idx], endMinute: hhmmToMinutes(value) };
      } else {
        slots[idx] = { ...slots[idx], [field]: Number(value) };
      }
      return { ...d, slots };
    }));
  }

  function addSlot(weekday) {
    setDays(prev => prev.map(d => d.weekday === weekday ? { ...d, slots: [...d.slots, { startMinute: 600, endMinute: 1080, durationMinutes: 60 }] } : d));
  }

  function removeSlot(weekday, idx) {
    setDays(prev => prev.map(d => d.weekday === weekday ? { ...d, slots: d.slots.filter((_, i) => i !== idx) } : d));
  }

  async function save() {
    setLoading(true);
    try {
      await apiSaveSchedule({ timezone, days, overrides });
      alert('Сохранено');
    } catch {
      alert('Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ padding:16 }}>Загрузка...</div>;

  return (
    <div style={{ padding:16, display:'grid', gap:16 }}>
      <div>
        <label>Часовой пояс: </label>
        <input value={timezone} onChange={(e)=>setTimezone(e.target.value)} style={{ width:240 }} />
      </div>
      {days.map((d) => (
        <div key={d.weekday} style={{ border:'1px solid #ddd', padding:12 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <strong>{labels[d.weekday]}</strong>
            <button onClick={() => addSlot(d.weekday)}>+ слот</button>
          </div>
          {d.slots.length === 0 ? (
            <div style={{ color:'#666', marginTop:8 }}>Нет слотов</div>
          ) : (
            <div style={{ display:'grid', gap:8, marginTop:8 }}>
              {d.slots.map((s, idx) => (
                <div key={idx} style={{ display:'grid', gridTemplateColumns:'repeat(7, auto)', gap:8, alignItems:'center' }}>
                  <label>С</label>
                  <input type="time" value={minutesToHHMM(s.startMinute)} onChange={(e)=>updateSlot(d.weekday, idx, 'startTime', e.target.value)} />
                  <label>до</label>
                  <input type="time" value={minutesToHHMM(s.endMinute)} onChange={(e)=>updateSlot(d.weekday, idx, 'endTime', e.target.value)} />
                  <label>длит. (мин)</label>
                  <input type="number" min={5} step={5} value={s.durationMinutes} onChange={(e)=>updateSlot(d.weekday, idx, 'durationMinutes', e.target.value)} />
                  <button onClick={() => removeSlot(d.weekday, idx)}>-</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      <div>
        <button onClick={save}>Сохранить</button>
      </div>
    </div>
  );
}


