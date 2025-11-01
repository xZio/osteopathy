import "./App.css";
import { useState } from "react";
import { Route, Routes, useLocation } from "react-router";
import About from "../About/About";
import Symptoms from "../Symptoms/Symptoms";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import Contacts from "../Contacts/Contacts";
import Prices from "../Prices/Prices";
import Experience from "../Experience/Experience";
import Admin from "../Admin/Admin";

function App() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const toggleForm = () => {
    setIsFormOpen(!isFormOpen);
  };

  const location = useLocation();
  const isAdminPage = location.pathname === "/admin" || location.pathname.startsWith("/admin/");

  return (
    <div className="app">
      {!isAdminPage && <Header toggleForm={toggleForm} isFormOpen={isFormOpen} />}
      <Routes>
        <Route index element={<About />} />
        <Route path="symptoms" element={<Symptoms toggleForm={toggleForm}/>} />
        <Route path="certificates" element={<Experience />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="prices" element={<Prices toggleForm={toggleForm} />} />
        <Route path="admin" element={<Admin />} />
      </Routes>
      {!isAdminPage && <Footer />}
    </div>
  );
}

export default App;
