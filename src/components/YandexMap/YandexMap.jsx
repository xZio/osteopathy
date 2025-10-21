import "./YandexMap.css";
import { useYandexMap } from "../../hooks/useYandexMap";
import { useEffect, useRef } from "react";
import mark from "../../images/mark.png";

const YandexMap = () => {
  const mapRef = useRef(null);
  const ymaps = useYandexMap();
  const mapInstance = useRef(null);

  useEffect(() => {
    if (!ymaps || !mapRef.current || mapInstance.current) return;

    const isMobile = window.innerWidth <= 768;
    const initialParams = {
      center: [59.86401, 30.408437],
      zoom: 18,
      controls: ["zoomControl", "fullscreenControl"],
      margin: isMobile ? [100, 90, 50, 90] : [200, 200, 100, 200],
    };

    if (isMobile) {
      initialParams.zoom = 17;
      initialParams.center = [59.86406, 30.407847];
    }

    // Кастомный макет балуна
    const MyBalloonLayout = ymaps.templateLayoutFactory.createClass(
      '<div class="custom-balloon">' +
        '<button class="balloon-close">&times;</button>' +
        '<div class="arrow"></div>' +
        '<div class="balloon-content">' +
        "$[[options.contentLayout observeSize]]" +
        "</div>" +
        "</div>",
      {
        build: function () {
          this.constructor.superclass.build.call(this);
          const closeButton = this.getElement().querySelector(".balloon-close");
          closeButton.addEventListener("click", () => {
            this.getData().geoObject.balloon.close();
          });
        },

        clear: function () {
          this._element
            .querySelector(".balloon-close")
            .removeEventListener("click", this.onCloseClick);
          this.constructor.superclass.clear.call(this);
        },

        onSublayoutSizeChange: function () {
          this.constructor.superclass.onSublayoutSizeChange.apply(
            this,
            arguments
          );
          this.applyElementOffset();
          this.events.fire("shapechange");
        },

        applyElementOffset: function () {
          if (!this._element) return;

          const arrow = this._element.querySelector(".arrow");
          const arrowHeight = arrow ? arrow.offsetHeight : 0;

          this._element.style.left = `-${this._element.offsetWidth / 2}px`;
          this._element.style.top = `-${
            this._element.offsetHeight + arrowHeight
          }px`;
        },

        onCloseClick: function (e) {
          e.preventDefault();
          this.events.fire("userclose");
        },

        getShape: function () {
          if (!this._element) return null;

          const arrow = this._element.querySelector(".arrow");
          const arrowHeight = arrow ? arrow.offsetHeight : 0;

          return new ymaps.shape.Rectangle(
            new ymaps.geometry.pixel.Rectangle([
              [0, 0],
              [
                this._element.offsetWidth,
                this._element.offsetHeight + arrowHeight,
              ],
            ])
          );
        },
      }
    );

    // Макет содержимого балуна
    const MyBalloonContentLayout = ymaps.templateLayoutFactory.createClass(
      '<h3 class="balloon-title">$[properties.balloonHeader]</h3>' +
        '<div class="balloon-body">$[properties.balloonContent]</div>'
    );

    // Инициализация карты
    mapInstance.current = new ymaps.Map(
      mapRef.current,
      initialParams /* {
      center: [59.86401, 30.408437],
      zoom: 18,
      controls: ["zoomControl", "fullscreenControl"],
      margin: [200, 200, 100, 200],

      // mobileScrollZoom: false,
    }  */
    );

    // Кастомный пресет метки
    ymaps.option.presetStorage.add("clinicPreset", {
      iconLayout: "default#image",
      iconImageHref: mark,
      iconImageSize: [80, 80],
      iconImageOffset: [-35, -68],
      balloonPanelMaxMapArea: 0,
    });

    // Создание метки
    const placemark = new ymaps.Placemark(
      [59.86406, 30.407847],
      {
        balloonHeader: "Биодинамическая остеопатия",
        balloonContent: "Адрес: проспект Славы, 52, корп. 1",
      },
      {
        preset: "clinicPreset",
        balloonLayout: MyBalloonLayout,
        balloonContentLayout: MyBalloonContentLayout,
        // balloonAutoPan: true,
        // balloonCloseButton: false,
        //balloonPanelMaxMapArea: Infinity,
      }
    );

    mapInstance.current.geoObjects.add(placemark);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.destroy();
        mapInstance.current = null;
      }
    };
  }, [ymaps]);

  return <div id="map" className="yandex-map" ref={mapRef}></div>;
};

export default YandexMap;
