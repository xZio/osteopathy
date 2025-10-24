import "./Certificates.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { certificatesList } from "../../data/certificates";
import frIcon from "../../images/french-icon.png";

function Certificates() {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState('none');
  const closeButtonRef = useRef(null);

  const total = certificatesList.length;

  const openLightbox = useCallback((index) => {
    setActiveIndex(index);
    setSlideDirection('none');
    setIsLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false);
  }, []);

  const showPrev = useCallback(() => {
    setSlideDirection('slide-right');
    setActiveIndex((prev) => (prev - 1 + total) % total);
    // Сброс анимации после завершения
    setTimeout(() => setSlideDirection('none'), 500);
  }, [total]);

  const showNext = useCallback(() => {
    setSlideDirection('slide-left');
    setActiveIndex((prev) => (prev + 1) % total);
    // Сброс анимации после завершения
    setTimeout(() => setSlideDirection('none'), 500);
  }, [total]);

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showNext();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, closeLightbox, showNext, showPrev]);

  useEffect(() => {
    if (isLightboxOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isLightboxOpen]);

  // Body scroll lock while lightbox is open
  useEffect(() => {
    if (isLightboxOpen) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [isLightboxOpen]);

  return (
    <>
      <h2 className="serts-header"> Сертификаты:</h2>
      <div className="serts-paragraf">
        <p> Друзья, часть моих сертификатов и дипломов.</p>
        <p>
          Первый сертификат с лентой для меня самый значимый и ценный: <span> Институт остеопатической медицины им. В.Л. Андрианова</span>. 4
          года обучения. Данный институт сотрудничает с преподавателями из
          Франции, выпускные экзамены принимают французские преподаватели,
          выпускники получают диплом <span>Парижской остеопатической школы</span>{" "}
          <i>
            <img src={frIcon} alt="иконка флага Франции"></img>
          </i>
          . С остальными можно ознакомиться лично, в моем кабинете.
        </p>
      </div>

      <div className="cert-grid" role="list" aria-label="Список сертификатов">
        {certificatesList.map((certificate, index) => (
          <div className="cert-card" role="listitem" key={`${certificate.title}-${index}`}>
            <button
              type="button"
              className="cert-thumbButton"
              onClick={() => openLightbox(index)}
              aria-label={`Открыть сертификат: ${certificate.title}`}
            >
              <img
                src={certificate.imgSrc}
                alt={certificate.title}
                loading="lazy"
                decoding="async"
                className="cert-thumbImage"
              />
            </button>
            <div className="cert-caption">
              {certificate.date && <p className="certificate-date">{certificate.date}</p>}
              <p className="certificate-title">{certificate.title}</p>
            </div>
          </div>
        ))}
      </div>

      {isLightboxOpen && (
        <div className="lightbox-overlay" role="dialog" aria-modal="true" aria-label="Просмотр сертификата">
          <div className="lightbox-content">
            <div className="lightbox-header">
              <span className="lightbox-header-spacer" />
              <p className="lightbox-header-title">{certificatesList[activeIndex].title}</p>
              <button
                type="button"
                className="lightbox-close"
                onClick={closeLightbox}
                aria-label="Закрыть"
                ref={closeButtonRef}
              >
                ×
              </button>
            </div>
            <div className="lightbox-body">
              <button type="button" className="lightbox-nav prev" onClick={showPrev} aria-label="Предыдущий">❮</button>
              <img
                src={certificatesList[activeIndex].imgSrc}
                alt={certificatesList[activeIndex].title}
                className={`lightbox-image ${slideDirection}`}
                decoding="async"
                key={activeIndex}
              />
              <button type="button" className="lightbox-nav next" onClick={showNext} aria-label="Следующий">❯</button>
            </div>
            <div className="lightbox-meta">
              {certificatesList[activeIndex].date && (
                <p className="lightbox-date">{certificatesList[activeIndex].date}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            className="lightbox-backdrop"
            aria-label="Закрыть"
            onClick={closeLightbox}
          />
        </div>
      )}
    </>
  );
}

export default Certificates;
