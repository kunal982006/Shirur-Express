import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const libraries: ("places")[] = ["places"];

const containerStyle = {
    width: '100%',
    height: '300px'
};

const defaultCenter = {
    lat: 18.8285, // Shirur default coordinates
    lng: 74.3734
};

interface LocationPickerProps {
    onAddressSelect: (address: string) => void;
    currentAddress?: string;
}

export function LocationPicker({ onAddressSelect, currentAddress }: LocationPickerProps) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
        libraries
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(null);
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);
    const { toast } = useToast();

    // If we have an initial address, strictly speaking we might want to geocode it to show on map, 
    // but for now we will just start at default center if no coordinates known.

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    const onUnmount = useCallback((map: google.maps.Map) => {
        setMap(null);
    }, []);

    const onMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;

        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        setMarkerPosition({ lat, lng });
        setIsLoadingAddress(true);

        try {
            const geocoder = new google.maps.Geocoder();
            const response = await geocoder.geocode({ location: { lat, lng } });

            if (response.results[0]) {
                const address = response.results[0].formatted_address;
                onAddressSelect(address);
            }
        } catch (error) {
            console.error("Geocoding failed", error);
            toast({
                title: "Error",
                description: "Could not fetch address for this location.",
                variant: "destructive"
            });
        } finally {
            setIsLoadingAddress(false);
        }
    }, [onAddressSelect, toast]);

    if (!import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
        return (
            <div className="p-4 border border-dashed rounded-lg bg-muted/50 text-center text-sm text-muted-foreground">
                <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Google Maps API Key is missing.</p>
                <p className="text-xs mt-1">Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.</p>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center bg-muted/20 rounded-lg border">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="relative rounded-lg overflow-hidden border">
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={markerPosition || defaultCenter}
                    zoom={15}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    onClick={onMapClick}
                    options={{
                        streetViewControl: false,
                        mapTypeControl: false,
                    }}
                >
                    {markerPosition && <Marker position={markerPosition} />}
                </GoogleMap>
                {isLoadingAddress && (
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center backdrop-blur-[1px]">
                        <div className="bg-white px-3 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            Fetching Address...
                        </div>
                    </div>
                )}
            </div>
            <p className="text-xs text-muted-foreground">
                Click on the map to pin your exact location.
            </p>
        </div>
    );
}
