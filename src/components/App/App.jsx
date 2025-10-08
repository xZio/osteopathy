import "./App.css";
import { useState } from "react";
import { Route, Routes } from "react-router";
import About from "../About/About";
import Header from "../Header/Header";
import Footer from "../Footer/Footer";
import Contacts from "../Contacts/Contacts";
import Prices from "../Prices/Prices";
import Experience from "../Experience/Experience";

function App() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  const toggleForm = () => {
    setIsFormOpen(!isFormOpen);
  };

  return (
    <div className="app">
      <Header toggleForm={toggleForm} isFormOpen={isFormOpen} />
      <Routes>
        <Route index element={<About />} />
        <Route path="certificates" element={<Experience />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="prices" element={<Prices toggleForm={toggleForm} />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
