/**
 * Утилита для отправки сообщений в Telegram
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

/**
 * Отправляет сообщение в Telegram канал
 * @param {string} message - Текст сообщения
 * @param {string} source - Источник сообщения (для логирования)
 * @returns {Promise<boolean>} - true если успешно, false если ошибка
 */
export async function sendToTelegram(message, source = "Unknown") {
  try {
    const response = await fetch(`${API_BASE}/notifications/telegram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });

    if (response.ok) {
      return true;
    } else {
      console.error(
        `❌ ${source}: Ошибка отправки в Telegram:`,
        response.status
      );
      return false;
    }
  } catch (error) {
    console.error(`❌ ${source}: Ошибка сети при отправке в Telegram:`, error);
    return false;
  }
}

/**
 * Форматирует данные формы в сообщение для Telegram
 * @param {Object} formData - Данные формы
 * @param {string} formType - Тип формы ("contacts" или "callback")
 * @returns {string} - Отформатированное сообщение
 */
export function formatFormMessage(formData, formType = "contacts") {
  const emoji = formType === "contacts" ? "🆕" : "📞";
  const title =
    formType === "contacts"
      ? "Новая запись с сайта"
      : "Новая запись из Callback формы";

  return `
${emoji} ${title}

👤 Имя: ${formData.name}
📞 Телефон: ${formData.phone}
📅 Дата: ${formData.date}
🕐 Время: ${formData.time}
${formData.message ? `📝 Сообщение: ${formData.message}` : ""}

⏰ Время отправки: ${new Date().toLocaleString("ru-RU")}
  `;
}

/**
 * Отправляет данные формы в Telegram
 * @param {Object} formData - Данные формы
 * @param {string} formType - Тип формы ("contacts" или "callback")
 * @returns {Promise<boolean>} - true если успешно, false если ошибка
 */
export async function sendFormToTelegram(formData, formType = "contacts") {
  const message = formatFormMessage(formData, formType);
  return await sendToTelegram(message, formType);
}
