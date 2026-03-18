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
        resolve(results[0].formatted_address);
      } else {
        console.error("Geocoder failed due to:", status);
        reject(new Error(`Geocoding failed: ${status}`));
      }
    });
  });
}
