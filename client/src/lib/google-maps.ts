export async function loadGoogleMaps(): Promise<void> {
  if (window.google?.maps) {
    return Promise.resolve();
  }

  const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error("Failed to load Google Maps script")));
    });
  }

  return new Promise((resolve, reject) => {
    window.initGoogleMapsCallback = () => {
      resolve();
      delete window.initGoogleMapsCallback;
    };

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      reject(new Error("VITE_GOOGLE_MAPS_API_KEY is not defined"));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMapsCallback`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Failed to script load Google Maps"));
    document.head.appendChild(script);
  });
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  await loadGoogleMaps();
  
  return new Promise((resolve, reject) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
        resolve(pickBestAddress(results));
      } else {
        console.error("Geocoder failed due to:", status);
        reject(new Error(`Geocoding failed: ${status}`));
      }
    });
  });
}

// Google often ranks a plus code ("R999+FHG, Shirur") or a vague area first.
// Prefer the most specific real address and strip any leading plus code.
const PREFERRED_TYPES = ["street_address", "premise", "subpremise", "establishment", "point_of_interest", "route", "neighborhood", "sublocality_level_2", "sublocality_level_1", "sublocality"];
const PLUS_CODE_PREFIX = /^[A-Z0-9]{4,8}\+[A-Z0-9]{2,3},?\s*/;

export function pickBestAddress(results: google.maps.GeocoderResult[]): string {
  const real = results.filter((result) => !result.types.includes("plus_code"));
  const best =
    PREFERRED_TYPES.map((type) => real.find((result) => result.types.includes(type))).find(Boolean) ||
    real[0] ||
    results[0];
  return best.formatted_address.replace(PLUS_CODE_PREFIX, "") || best.formatted_address;
}

// Phones report a rough network fix first and a precise GPS fix a few seconds
// later. Watch briefly and keep the most accurate reading instead of the first one.
export function getAccuratePosition(
  onUpdate?: (position: GeolocationPosition) => void,
  { targetAccuracy = 25, maxWaitMs = 8000 } = {}
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    let best: GeolocationPosition | null = null;
    let watchId = 0;
    const finish = () => {
      navigator.geolocation.clearWatch(watchId);
      clearTimeout(timer);
    };
    const timer = setTimeout(() => {
      finish();
      if (best) resolve(best);
      else reject(new Error("Location timed out"));
    }, maxWaitMs);
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        if (best && position.coords.accuracy >= best.coords.accuracy) return;
        best = position;
        onUpdate?.(position);
        if (position.coords.accuracy <= targetAccuracy) {
          finish();
          resolve(position);
        }
      },
      (error) => {
        finish();
        if (best) resolve(best);
        else reject(error);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: maxWaitMs }
    );
  });
}
