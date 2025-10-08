
import './YandexFeedback.css';

const YandexMapWidget = () => {
  return (
    <div className="yandex-map-widget-container">
      <iframe
        className="yandex-map-widget-iframe"
        title="Яндекс Карты"
        src="https://yandex.ru/maps-reviews-widget/153948909927?comments"
        allowFullScreen
      />
      <a
        className="yandex-map-widget-link"
        href="https://yandex.ru/maps/org/kabinet_osteopata/153948909927/"
        target="_blank"
        rel="noopener noreferrer"
      >
        Кабинет остеопата на карте Санкт‑Петербурга — Яндекс Карты
      </a>
    </div>
  )
}

export default YandexMapWidget;