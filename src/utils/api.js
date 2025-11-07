const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function getToken() {
  return localStorage.getItem('admin_token') || '';
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function handleAuthError(res) {
  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    window.location.reload();
    throw new Error('Unauthorized');
  }
}

export async function apiLogin(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (!res.ok) {
    const error = new Error('Login failed');
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function apiListAppointments() {
  const res = await fetch(`${API_BASE}/appointments`, { headers: { ...authHeaders() } });
  handleAuthError(res);
  if (!res.ok) throw new Error('Failed to load appointments');
  return res.json();
}

export async function apiCreateAppointment(payload) {
  const res = await fetch(`${API_BASE}/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload)
  });
  handleAuthError(res);
  if (!res.ok) throw new Error('Failed to create appointment');
  return res.json();
}

export async function apiUpdateAppointment(id, payload) {
  const res = await fetch(`${API_BASE}/appointments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload)
  });
  handleAuthError(res);
  if (!res.ok) throw new Error('Failed to update appointment');
  return res.json();
}

export async function apiDeleteAppointment(id) {
  const res = await fetch(`${API_BASE}/appointments/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() }
  });
  handleAuthError(res);
  if (!res.ok) throw new Error('Failed to delete appointment');
}

export async function apiGetAvailability(startISODate, endISODate) {
  const params = new URLSearchParams({ start: startISODate, end: endISODate });
  const res = await fetch(`${API_BASE}/public/availability?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load availability');
  return res.json();
}

export async function apiPublicCreateAppointment(payload) {
  const res = await fetch(`${API_BASE}/public/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (res.status === 409) throw new Error('Slot already booked');
  if (!res.ok) throw new Error('Booking failed');
  return res.json();
}

export async function apiGetSchedule() {
  const res = await fetch(`${API_BASE}/schedule`, { headers: { ...authHeaders() } });
  handleAuthError(res);
  if (!res.ok) throw new Error('Failed to load schedule');
  return res.json();
}

export async function apiSaveSchedule(schedule) {
  const res = await fetch(`${API_BASE}/schedule`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(schedule),
  });
  handleAuthError(res);
  if (!res.ok) throw new Error('Failed to save schedule');
  return res.json();
}


