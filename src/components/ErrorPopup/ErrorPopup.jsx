import "./ErrorPopup.css";
import { useEffect } from "react";

function ErrorPopup({ isOpen, onClose, title, message }) {
  useEffect(() => {
    if (isOpen) {
      // Закрываем попап через 5 секунд (дольше чем успех, чтобы пользователь успел прочитать)
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="error-popup-overlay" onClick={onClose}>
      <div className="error-popup-content" onClick={(e) => e.stopPropagation()}>
        <button className="error-popup-close" onClick={onClose}>
          ×
        </button>
        <div className="error-popup-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3 className="error-popup-title">{title || "Ошибка при отправке формы"}</h3>
        <p className="error-popup-message">
          {message || "Произошла ошибка. Пожалуйста, попробуйте еще раз."}
        </p>
      </div>
    </div>
  );
}

export default ErrorPopup;

