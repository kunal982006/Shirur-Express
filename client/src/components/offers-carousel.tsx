import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useEffect, useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface ProviderOffer {
    id: string;
    providerId: string;
    title: string;
    description?: string;
    imageUrl: string;
    productType: string;
    expiryDate: string;
    isActive: boolean;
    provider?: {
        id: string;
        businessName: string;
        profileImageUrl?: string;
    };
}

export function OffersCarousel() {
    const [emblaRef, emblaApi] = useEmblaCarousel(
        { loop: true, align: "start" },
        [Autoplay({ delay: 4000, stopOnInteraction: false })]
    );

    const [selectedIndex, setSelectedIndex] = useState(0);
    const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

    const { data: offers, isLoading } = useQuery<ProviderOffer[]>({
        queryKey: ["/api/offers/active"],
    });

    const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
    const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

    const onSelect = useCallback(() => {
        if (!emblaApi) return;
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, [emblaApi]);

    useEffect(() => {
        if (!emblaApi) return;
        setScrollSnaps(emblaApi.scrollSnapList());
        emblaApi.on("select", onSelect);
        onSelect();
    }, [emblaApi, onSelect]);

    // Don't show carousel if no offers
    if (isLoading) {
        return (
            <div className="w-full h-40 flex items-center justify-center bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    if (!offers || offers.length === 0) {
        return null;
    }

    return (
        <div className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5">
            {/* Carousel Container */}
            <div ref={emblaRef} className="overflow-hidden">
                <div className="flex">
                    {offers.map((offer) => (
                        <Link
                            key={offer.id}
                            href={`/offer/${offer.id}`}
                            className="flex-[0_0_100%] min-w-0 md:flex-[0_0_50%] lg:flex-[0_0_33.33%] pl-2 pr-2 first:pl-0 last:pr-0"
                        >
                            <div className="relative aspect-[16/9] rounded-xl overflow-hidden cursor-pointer group shadow-md hover:shadow-xl transition-all duration-300">
                                <img
                                    src={offer.imageUrl}
                                    alt={offer.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                                {/* Offer Info */}
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                    <h3 className="text-white font-bold text-sm md:text-base line-clamp-1">
                                        {offer.title}
                                    </h3>
                                    {offer.provider && (
                                        <p className="text-white/80 text-xs mt-0.5">
                                            By {offer.provider.businessName}
                                        </p>
                                    )}
                                </div>

                                {/* Expiry Badge */}
                                <div className="absolute top-2 right-2">
                                    <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                                        Limited Time
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Navigation Arrows (Desktop Only) */}
            {offers.length > 1 && (
                <>
                    <button
                        onClick={scrollPrev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5 text-gray-800" />
                    </button>
                    <button
                        onClick={scrollNext}
                        className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
                    >
                        <ChevronRight className="h-5 w-5 text-gray-800" />
                    </button>
                </>
            )}

            {/* Dots Indicator */}
            {offers.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-3 pb-2">
                    {scrollSnaps.map((_, index) => (
                        <button
                            key={index}
                            className={`h-1.5 rounded-full transition-all duration-300 ${index === selectedIndex
                                    ? "w-6 bg-primary"
                                    : "w-1.5 bg-gray-300 hover:bg-gray-400"
                                }`}
                            onClick={() => emblaApi?.scrollTo(index)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
