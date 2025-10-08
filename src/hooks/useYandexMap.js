import { useEffect, useState } from "react";
import { loadYandexMaps } from "../utils/yamaps-loader";

export function useYandexMap() {
  const [ymaps, setYmaps] = useState(null);

  useEffect(() => {
    let isMounted = true;

    loadYandexMaps().then((api) => {
      if (isMounted) setYmaps(api);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return ymaps;
}
