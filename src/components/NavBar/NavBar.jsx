import { NavLink } from "react-router-dom"; // Измененный импорт
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import logo from "../../images/logo.png";
import "./NavBar.css";
import { FiAlignJustify } from "react-icons/fi";
import { useState } from "react";

function NavBar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Navbar
        expand="sm"
        expanded={isOpen}
        onToggle={(isOpen) => setIsOpen(isOpen)}
      >
        <Container id="navbar" fluid className="d-flex justify-content-between align-items-center w-100">
          <Navbar.Brand>
            <NavLink to="/" end>
              <img
                src={logo}
                width="70"
                height="70"
                className="d-inline-block logo"
                alt="logo"
              />
            </NavLink>
          </Navbar.Brand>
          <Navbar.Toggle
            id="navButton"
            aria-controls="basic-navbar-nav "
            className={isOpen ? "menu-open" : ""}
            children={<FiAlignJustify size={40} className="button-icon" />}
          />

          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as="div">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) => (isActive ? "active-link" : "")}
                >
                  О себе
                </NavLink>
              </Nav.Link>
              <Nav.Link as="div">
                <NavLink
                  to="/certificates"
                  className={({ isActive }) => (isActive ? "active-link" : "")}
                >
                  Опыт
                </NavLink>
              </Nav.Link>
              <Nav.Link as="div">
                <NavLink
                  to="/contacts"
                  className={({ isActive }) => (isActive ? "active-link" : "")}
                >
                  Контакты
                </NavLink>
              </Nav.Link>
              <Nav.Link as="div">
                <NavLink
                  to="/prices"
                  className={({ isActive }) => (isActive ? "active-link" : "")}
                >
                  Цены и отзывы
                </NavLink>
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </>
  );
}

export default NavBar;
