import { useState, useRef, useEffect } from 'react';
import { Loader2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MAPPLS_API_KEY = "42efe16c5428370049af77c0998cb927";

interface LocationPickerProps {
    onAddressSelect: (address: string) => void;
    currentAddress?: string;
}

declare global {
    interface Window {
        mappls: any;
        MapmyIndia: any;
    }
}

export function LocationPicker({ onAddressSelect, currentAddress }: LocationPickerProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);
    // Removed isSatellite state as requested
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const searchRef = useRef<any>(null);
    const { toast } = useToast();
    const mapId = "mappls-map-container";
    const searchId = "mappls-search-container";

    // Removed toggleSatellite function as requested

    useEffect(() => {
        const loadMapScript = () => {
            // Check if already loaded
            if (window.mappls && window.mappls.Map && window.mappls.search && window.mappls.Geolocation) {
                initMap();
                return;
            }

            // Load Map SDK with all libraries
            const script = document.createElement('script');
            script.src = `https://apis.mappls.com/advancedmaps/api/${MAPPLS_API_KEY}/map_sdk?layer=vector&v=3.0&libraries=services,search,nearby,geolocation`;
            script.async = true;
            script.onload = () => {
                console.log("Mappls SDK Loaded");
                initMap();
            };
            script.onerror = () => {
                setIsLoading(false);
                toast({
                    title: "Error",
                    description: "Failed to load MapMyIndia maps",
                    variant: "destructive"
                });
            };
            document.head.appendChild(script);
        };

        const initMap = () => {
            if (!window.mappls) return;

            const mapElement = document.getElementById(mapId);
            if (!mapElement) {
                console.warn("Map element not found, skipping initialization");
                return;
            }

            const mapProps = {
                center: { lat: 18.8285, lng: 74.3734 },
                zoom: 15,
                location: true,
                draggable: true,
            };

            try {
                if (!mapRef.current) {
                    try {
                        mapRef.current = new window.mappls.Map(mapId, mapProps);
                    } catch (err) {
                        console.error("Map constructor failed", err);
                        setIsLoading(false);
                        return;
                    }

                    mapRef.current.addListener('load', () => {
                        setIsLoading(false);
                        initSearchWidget();
                    });

                    mapRef.current.addListener('click', (e: any) => {
                        if (e && e.lngLat) {
                            const lat = e.lngLat.lat;
                            const lng = e.lngLat.lng;
                            handleMapClick(lat, lng);
                        }
                    });
                } else {
                    // Check if map is properly attached to DOM? 
                    // Mappls map might lose context if element was removed and recreated
                    // Re-instantiating might be safer if the element was replaced
                    const currentMapElement = mapRef.current.getDiv?.();
                    if (currentMapElement && !document.body.contains(currentMapElement)) {
                        // Map instance exists but its element is gone from DOM. 
                        // We are likely in a new render of the component.
                        // We should probably re-initialize.
                        console.log("Map instance detached, re-initializing...");
                        mapRef.current.remove?.();
                        mapRef.current = new window.mappls.Map(mapId, mapProps);
                        mapRef.current.addListener('load', () => {
                            setIsLoading(false);
                            initSearchWidget();
                        });
                        mapRef.current.addListener('click', (e: any) => {
                            if (e && e.lngLat) {
                                const lat = e.lngLat.lat;
                                const lng = e.lngLat.lng;
                                handleMapClick(lat, lng);
                            }
                        });
                    } else {
                        setIsLoading(false);
                        if (!searchRef.current) initSearchWidget();
                    }
                }
            } catch (error) {
                console.error("Error initializing map:", error);
                setIsLoading(false);
            }
        };

        const initSearchWidget = () => {
            if (!mapRef.current || !window.mappls || searchRef.current) return;

            const searchElement = document.getElementById(searchId);
            if (!searchElement) {
                console.warn("Search element not found, skipping initialization");
                return;
            }

            try {
                if (typeof window.mappls.search === 'function') {
                    const options = {
                        map: mapRef.current,
                        placeholder: "Search for a location...",
                        callback: (data: any) => {
                            if (data) {
                                const lat = parseFloat(data.latitude || data.lat);
                                const lng = parseFloat(data.longitude || data.lng);
                                if (!isNaN(lat) && !isNaN(lng)) {
                                    mapRef.current.setCenter({ lat, lng });
                                    mapRef.current.setZoom(17);
                                    handleMapClick(lat, lng);
                                }
                            }
                        }
                    };
                    searchRef.current = new window.mappls.search(searchElement, options);
                }
            } catch (e) {
                console.warn("Error initializing search widget", e);
            }
        }

        loadMapScript();

        return () => {
            if (mapRef.current && typeof mapRef.current.remove === 'function') {
                try {
                    mapRef.current.remove();
                } catch (e) {
                    console.warn("Failed to cleanup map instance", e);
                }
            }
        };

    }, []);

    const fetchAddress = async (lat: number, lng: number) => {
        setIsLoadingAddress(true);

        const handleGeocodeResponse = (data: any) => {
            setIsLoadingAddress(false);
            const getAddr = (obj: any) => obj?.formatted_address || obj?.addressString;

            let address = "";
            if (Array.isArray(data) && data.length > 0) address = getAddr(data[0]);
            else if (data?.results?.[0]) address = getAddr(data.results[0]);
            else if (data && typeof data === 'object') address = getAddr(data);

            if (address) {
                onAddressSelect(address);
            } else {
                toast({
                    title: "Info",
                    description: "Address details not found.",
                    variant: "default"
                });
            }
        };

        // Attempt 1: SDK Static
        if (typeof window.mappls.reverseGeocoding === 'function') {
            try {
                window.mappls.reverseGeocoding({ lat, lng }, (data: any) => {
                    handleGeocodeResponse(data);
                });
                return;
            } catch (e) { console.warn(e); }
        }

        // Attempt 2: REST API
        try {
            const response = await fetch(`https://apis.mappls.com/advancedmaps/v1/${MAPPLS_API_KEY}/rev_geocode?lat=${lat}&lng=${lng}`);
            if (!response.ok) throw new Error("API Error");
            const data = await response.json();
            handleGeocodeResponse(data);
        } catch (e: any) {
            console.error("Geocoding failed", e);
            setIsLoadingAddress(false);
            toast({
                title: "Error",
                description: `Failed to fetch address details.`,
                variant: "destructive"
            });
        }
    };

    const handleMapClick = async (lat: number, lng: number) => {
        if (!mapRef.current || !window.mappls) return;

        const position = { lat: Number(lat), lng: Number(lng) };

        if (markerRef.current) {
            markerRef.current.setPosition(position);
        } else {
            markerRef.current = new window.mappls.Marker({
                map: mapRef.current,
                position: position,
                draggable: true
            });
            markerRef.current.addListener('dragend', (e: any) => {
                const newPos = e.target.getPosition();
                let newLat = newPos.lat;
                let newLng = newPos.lng;
                if (typeof newLat === 'function') newLat = newLat();
                if (typeof newLng === 'function') newLng = newLng();
                fetchAddress(newLat, newLng);
            });
        }
        fetchAddress(lat, lng);
    };

    const handleCurrentLocation = () => {
        setIsLoadingAddress(true);

        const onGeoSuccess = (lat: number, lng: number) => {
            setIsLoadingAddress(false);
            if (!isNaN(lat) && !isNaN(lng)) {
                if (mapRef.current) {
                    mapRef.current.setCenter({ lat, lng });
                    mapRef.current.setZoom(17);
                }
                handleMapClick(lat, lng);
            } else {
                toast({ title: "Error", description: "Invalid location received.", variant: "destructive" });
            }
        };

        const onGeoFail = (err: any) => {
            console.error("Geolocation failed:", err);
            setIsLoadingAddress(false);
            let msg = "Could not fetch location.";
            if (err.code === 1) msg = "Location permission denied.";
            toast({ title: "Error", description: msg, variant: "destructive" });
        };

        // Use browser geolocation directly
        fallbackToBrowserGeo(onGeoSuccess, onGeoFail);
    };

    const fallbackToBrowserGeo = (successCb: Function, failCb: Function) => {
        if (!navigator.geolocation) {
            failCb({ message: "Geolocation not supported" });
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => successCb(pos.coords.latitude, pos.coords.longitude),
            (err) => failCb(err),
            { enableHighAccuracy: true }
        );
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                    Search or pin your exact location
                </p>
                <div className="flex gap-2">
                    {/* Satellite button removed as requested */}
                    <button
                        type="button"
                        onClick={handleCurrentLocation}
                        className="text-xs flex items-center gap-1.5 text-primary font-medium hover:underline bg-primary/5 px-2 py-1 rounded-md transition-colors"
                    >
                        <MapPin className="h-3 w-3" />
                        Use Current Location
                    </button>
                </div>
            </div>

            <div id={searchId} className="w-full relative z-10" style={{ minHeight: '40px' }} />

            <div className="relative rounded-lg overflow-hidden border">
                <div
                    id={mapId}
                    style={{ width: '100%', height: '300px' }}
                    className="bg-muted/20"
                />

                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                )}

                {isLoadingAddress && (
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center backdrop-blur-[1px] z-20">
                        <div className="bg-white px-3 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            Fetching Address...
                        </div>
                    </div>
                )}
            </div>

            <p className="text-xs text-muted-foreground">
                Click on the map to refine your location if needed.
            </p>
        </div>
    );
}
