let isScriptLoading = false;
let resolvePromise = null;
const promise = new Promise((resolve) => {
  resolvePromise = resolve;
});

export const loadYandexMaps = () => {
  if (window.ymaps) {
    return Promise.resolve(window.ymaps);
  }

  if (!isScriptLoading) {
    isScriptLoading = true;
    const script = document.createElement("script");
    script.src =
      "https://api-maps.yandex.ru/2.1/?&lang=ru_RU";
    script.onload = () => {
      window.ymaps.ready(() => resolvePromise(window.ymaps));
    };
    document.head.appendChild(script);
  }

  return promise;
};
