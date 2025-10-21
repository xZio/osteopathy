import { NavLink } from "react-router-dom"; // Измененный импорт
import logo from "../../images/logo.png";
import "./NavBar.css";
import { FiAlignJustify } from "react-icons/fi";
import { useState } from "react";

function NavBar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <nav className="navbar">
        <div id="navbar" className="colapsed-container">
          <div className="navbar-brand">
            <NavLink to="/" end>
              <img
                src={logo}
                width="70"
                height="70"
                className="d-inline-block logo"
                alt="logo"
              />
            </NavLink>
          </div>
          <button
            id="navButton"
            aria-controls="basic-navbar-nav"
            aria-expanded={isOpen}
            aria-label="Toggle navigation"
            className={`navbar-toggler ${isOpen ? "menu-open" : ""}`}
            onClick={() => setIsOpen((v) => !v)}
          >
            <FiAlignJustify size={40} className="button-icon" />
          </button>
        </div>
        <div
          id="basic-navbar-nav"
          className={`navbar-collapse ${isOpen ? "show" : ""}`}
        >
          <div className="navbar-nav">
            <div className="nav-link">
              <NavLink
                to="/"
                end
                className={({ isActive }) => (isActive ? "active-link" : "")}
              >
                О себе
              </NavLink>
            </div>
            <div className="nav-link">
              <NavLink
                to="/certificates"
                className={({ isActive }) => (isActive ? "active-link" : "")}
              >
                Опыт
              </NavLink>
            </div>
            <div className="nav-link">
              <NavLink
                to="/contacts"
                className={({ isActive }) => (isActive ? "active-link" : "")}
              >
                Контакты
              </NavLink>
            </div>
            <div className="nav-link">
              <NavLink
                to="/prices"
                className={({ isActive }) => (isActive ? "active-link" : "")}
              >
                Цены и отзывы
              </NavLink>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}

export default NavBar;
