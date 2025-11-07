import "./SuccessPopup.css";
import { useEffect } from "react";

function SuccessPopup({ isOpen, onClose, title, message }) {
  useEffect(() => {
    if (isOpen) {
      // Закрываем попап через 3 секунды
      const timer = setTimeout(() => {
        onClose();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="success-popup-overlay" onClick={onClose}>
      <div className="success-popup-content" onClick={(e) => e.stopPropagation()}>
        <button className="success-popup-close" onClick={onClose}>
          ×
        </button>
        <div className="success-popup-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3 className="success-popup-title">{title || "Форма успешно отправлена!"}</h3>
        <p className="success-popup-message">
          {message || "Спасибо за обращение. Мы свяжемся с вами в ближайшее время."}
        </p>
      </div>
    </div>
  );
}

export default SuccessPopup;
