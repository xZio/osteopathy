import { useState } from "react";
import "./Admin.css";
import Login from "../Login/Login";
import Appointments from "../Appointments/Appointments";
import ScheduleEditor from "../ScheduleEditor/ScheduleEditor";
import CalendarView from "../CalendarView/CalendarView";

function Admin() {
  const [token] = useState(() => localStorage.getItem("admin_token"));
  const [tab, setTab] = useState(() => {
    const savedTab = localStorage.getItem("admin_tab");
    return savedTab || "appointments";
  });

  const handleTabChange = (newTab) => {
    setTab(newTab);
    localStorage.setItem("admin_tab", newTab);
  };

  if (!token) return <Login onLoggedIn={() => window.location.reload()} />;
  return (
    <div className="admin-container">
      <div className="admin-wrap">
        <div className="admin-header">
          <div className="admin-title">Администрирование</div>
          <div className="admin-tabs">
            <button
              className="admin-btn"
              onClick={() => handleTabChange("appointments")}
              disabled={tab === "appointments"}
            >
              Записи
            </button>
            <button
              className="admin-btn"
              onClick={() => handleTabChange("schedule")}
              disabled={tab === "schedule"}
            >
              Расписание
            </button>
            <button
              className="admin-btn"
              onClick={() => handleTabChange("calendar")}
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

export default Admin;