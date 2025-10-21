import CallbackForm from "../CallbackForm/CallbackForm";
import "./Header.css";
import { FaPhoneVolume } from "react-icons/fa6";
import NavBar from "../NavBar/NavBar";

function Header({ toggleForm, isFormOpen }) {
  return (
    <header className="header" id="header">
      <div className="header-container">
        <NavBar></NavBar>

        <div className="header-info">
          <div className="header-city">Санкт‑Петербург</div>
          <div className="header-phone">
            <FaPhoneVolume className="phone-number-logo" />
            <a
              href="tel:+79119577446"
              target="_blank"
              rel="noopener noreferrer"
            >
              +7 (911) 957-74-46
            </a>
          </div>
        </div>
        <CallbackForm toggleForm={toggleForm} isFormOpen={isFormOpen} />
      </div>
    </header>
  );
}

export default Header;
