import { useState } from "react";
import { apiLogin } from "../../utils/api";
import "./Login.css";

function Login({ onLoggedIn }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const { token } = await apiLogin(username, password);
      localStorage.setItem("admin_token", token);
      onLoggedIn();
    } catch (err) {
      if (err.status === 429) {
        setError("Превышено количество попыток входа. Попробуйте через 10 минут.");
      } else {
        setError("Неверные данные");
      }
    }
  }

  return (
    <div className="login-wrapper">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Вход для администратора</h2>
        <input
          placeholder="Логин"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
        <input
          placeholder="Пароль"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
        {error && <div className="login-error">{error}</div>}
        <button type="submit">Войти</button>
      </form>
    </div>
  );
}

export default Login;
