import { useState, useRef, useEffect, useCallback } from 'react';
import { loadGoogleMaps } from "@/lib/google-maps";

import { Loader2, MapPin, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface LocationPickerProps {
    onAddressSelect: (address: string) => void;
    currentAddress?: string;
}

declare global {
    interface Window {
        initGoogleMapsCallback?: () => void;
    }
}

export function LocationPicker({ onAddressSelect, currentAddress }: LocationPickerProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [showPredictions, setShowPredictions] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);

    const mapRef = useRef<google.maps.Map | null>(null);
    const markerRef = useRef<google.maps.Marker | null>(null);
    const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
    const geocoderRef = useRef<google.maps.Geocoder | null>(null);
    const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

    const { toast } = useToast();
    const mapContainerId = "google-map-container";

    // Initialize map after script loads
    const initMap = useCallback(() => {
        const mapElement = document.getElementById(mapContainerId);
        if (!mapElement || !window.google?.maps) {
            console.warn("Map element or Google Maps not found");
            setIsLoading(false);
            return;
        }

        try {
            // Default center: Shirur, Maharashtra
            const defaultCenter = { lat: 18.8285, lng: 74.3734 };

            mapRef.current = new google.maps.Map(mapElement, {
                center: defaultCenter,
                zoom: 15,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                zoomControl: true,
                styles: [
                    {
                        featureType: "poi",
                        elementType: "labels",
                        stylers: [{ visibility: "off" }]
                    }
                ]
            });

            // Initialize services
            autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
            geocoderRef.current = new google.maps.Geocoder();
            placesServiceRef.current = new google.maps.places.PlacesService(mapRef.current);

            // Add click listener
            mapRef.current.addListener('click', (e: google.maps.MapMouseEvent) => {
                if (e.latLng) {
                    handleMapClick(e.latLng.lat(), e.latLng.lng());
                }
            });

            setIsLoading(false);
            setMapLoaded(true);
        } catch (error) {
            console.error("Error initializing map:", error);
            setIsLoading(false);
            toast({
                title: "Error",
                description: "Failed to initialize Google Maps",
                variant: "destructive"
            });
        }
    }, [toast]);

    // Load Google Maps Script
    useEffect(() => {
        loadGoogleMaps()
            .then(() => {
                initMap();
            })
            .catch((error: any) => {
                console.error(error);
                setIsLoading(false);
                toast({
                    title: "Error",
                    description: "Failed to load Google Maps. Please check your API key/restrictions.",
                    variant: "destructive"
                });
            });

        return () => {
            // Cleanup marker
            if (markerRef.current) {
                markerRef.current.setMap(null);
            }
        };
    }, [initMap, toast]);

    // Handle search input
    const handleSearchChange = useCallback((value: string) => {
        setSearchQuery(value);

        if (!value.trim() || !autocompleteServiceRef.current) {
            setPredictions([]);
            setShowPredictions(false);
            return;
        }

        autocompleteServiceRef.current.getPlacePredictions(
            {
                input: value,
                componentRestrictions: { country: 'in' }, // Restrict to India
            },
            (results, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                    setPredictions(results);
                    setShowPredictions(true);
                } else {
                    setPredictions([]);
                    setShowPredictions(false);
                }
            }
        );
    }, []);

    // Handle place selection from autocomplete
    const handlePlaceSelect = useCallback((placeId: string, description: string) => {
        setShowPredictions(false);
        setSearchQuery(description);
        setIsLoadingAddress(true);

        if (!placesServiceRef.current) {
            setIsLoadingAddress(false);
            return;
        }

        placesServiceRef.current.getDetails(
            { placeId, fields: ['geometry', 'formatted_address'] },
            (place, status) => {
                setIsLoadingAddress(false);
                if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();

                    mapRef.current?.setCenter({ lat, lng });
                    mapRef.current?.setZoom(17);

                    updateMarker(lat, lng);
                    onAddressSelect(place.formatted_address || description);
                }
            }
        );
    }, [onAddressSelect]);

    // Reverse geocode to get address from coordinates
    const fetchAddress = useCallback((lat: number, lng: number) => {
        setIsLoadingAddress(true);

        if (!geocoderRef.current) {
            setIsLoadingAddress(false);
            return;
        }

        geocoderRef.current.geocode(
            { location: { lat, lng } },
            (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
                setIsLoadingAddress(false);
                if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
                    const address = results[0].formatted_address;
                    onAddressSelect(address);
                    setSearchQuery(address);
                } else {
                    toast({
                        title: "Info",
                        description: "Address details not found.",
                        variant: "default"
                    });
                }
            }
        );
    }, [onAddressSelect, toast]);

    // Update or create marker
    const updateMarker = useCallback((lat: number, lng: number) => {
        const position = { lat, lng };

        if (markerRef.current) {
            markerRef.current.setPosition(position);
        } else if (mapRef.current) {
            markerRef.current = new google.maps.Marker({
                map: mapRef.current,
                position: position,
                draggable: true,
                animation: google.maps.Animation.DROP
            });

            markerRef.current.addListener('dragend', () => {
                const newPosition = markerRef.current?.getPosition();
                if (newPosition) {
                    fetchAddress(newPosition.lat(), newPosition.lng());
                }
            });
        }
    }, [fetchAddress]);

    // Handle map click
    const handleMapClick = useCallback((lat: number, lng: number) => {
        updateMarker(lat, lng);
        fetchAddress(lat, lng);
    }, [updateMarker, fetchAddress]);

    // Get current location
    const handleCurrentLocation = useCallback(() => {
        setIsLoadingAddress(true);

        if (!navigator.geolocation) {
            setIsLoadingAddress(false);
            toast({
                title: "Error",
                description: "Geolocation not supported",
                variant: "destructive"
            });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                mapRef.current?.setCenter({ lat, lng });
                mapRef.current?.setZoom(17);

                updateMarker(lat, lng);
                fetchAddress(lat, lng);
            },
            (error) => {
                setIsLoadingAddress(false);
                let msg = "Could not fetch location.";
                if (error.code === 1) msg = "Location permission denied.";
                toast({
                    title: "Error",
                    description: msg,
                    variant: "destructive"
                });
            },
            { enableHighAccuracy: true }
        );
    }, [updateMarker, fetchAddress, toast]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground">
                    Search or pin your exact location
                </p>
                <button
                    type="button"
                    onClick={handleCurrentLocation}
                    className="text-xs flex items-center gap-1.5 text-primary font-medium hover:underline bg-primary/5 px-2 py-1 rounded-md transition-colors"
                >
                    <MapPin className="h-3 w-3" />
                    Use Current Location
                </button>
            </div>

            {/* Search Input */}
            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search for a location..."
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onFocus={() => predictions.length > 0 && setShowPredictions(true)}
                        onBlur={() => setTimeout(() => setShowPredictions(false), 200)}
                        className="pl-10"
                    />
                </div>

                {/* Autocomplete Predictions */}
                {showPredictions && predictions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {predictions.map((prediction) => (
                            <button
                                key={prediction.place_id}
                                type="button"
                                className="w-full px-4 py-3 text-left text-sm hover:bg-muted transition-colors border-b last:border-b-0"
                                onMouseDown={() => handlePlaceSelect(prediction.place_id, prediction.description)}
                            >
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                    <span className="line-clamp-2">{prediction.description}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Map Container */}
            <div className="relative rounded-lg overflow-hidden border">
                <div
                    id={mapContainerId}
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
