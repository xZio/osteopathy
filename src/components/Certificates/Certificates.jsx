import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Scrollbar, A11y } from "swiper/modules";
import "./Certificates.css";
import { certificatesList } from "../../data/certificates";
import frIcon from "../../images/french-icon.png";

function Certificates() {
  return (
    <>
      <h2 className="serts-header"> Сертификаты:</h2>
      <div className="serts-paragraf">
        <p> Друзья, часть моих сертификатов и дипломов.</p>
        <p>
          Первый сертификат с лентой для меня самый значимый и ценный:{" "}
          <span> Институт остеопатической медицины им. В.Л. Андрианова</span>. 4
          года обучения. Данный институт сотрудничает с преподавателями из
          Франции, выпускные экзамены принимают французские преподаватели,
          выпускники получают диплом{" "}
          <span>Парижской остеопатической школы</span>{" "}
          <i>
            <img src={frIcon} alt="иконка флага Франции"></img>
          </i>
          . С остальными можно ознакомиться лично, в моем кабинете.
        </p>
      </div>

      <div className="swiper-container">
        <Swiper
          modules={[Navigation, Pagination, Scrollbar, A11y]}
          spaceBetween={50}
          slidesPerView="auto"
          navigation
          pagination={{ clickable: true }}
          onSwiper={(swiper) => console.log()}
          onSlideChange={() => console.log("slide change")}
          centeredSlides
          slideToClickedSlide
          /*  breakpoints={{
            320: { spaceBetween: 40 },
            650: { spaceBetween: 30 },
            1000: { spaceBetween: 20 },
          }} */
        >
          {certificatesList.map((el, index) => (
            <SwiperSlide key={index}>
              <img
                src={el.imgSrc}
                alt={el.title}
                className="certificate-image"
                key={1}
              ></img>

              <p className="certificate-date">{el.date}</p>
              <p className="certificate-title">{el.title}</p>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </>
  );
}

export default Certificates;
