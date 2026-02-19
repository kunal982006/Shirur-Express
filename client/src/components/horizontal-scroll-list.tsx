import { useRef } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HorizontalScrollListProps<T> {
    title: string;
    items: T[];
    renderItem: (item: T) => React.ReactNode;
    onSeeAll?: () => void;
    isLoading?: boolean;
}

export function HorizontalScrollList<T extends { id: string | number }>({
    title,
    items,
    renderItem,
    onSeeAll,
    isLoading
}: HorizontalScrollListProps<T>) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = direction === 'left' ? -current.offsetWidth / 1.5 : current.offsetWidth / 1.5;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (!isLoading && (!items || items.length === 0)) return null;

    return (
        <div className="py-2 md:py-4 bg-white mb-2">
            <div className="flex items-center justify-between px-4 mb-3">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h2>
                {onSeeAll && (
                    <Button variant="ghost" size="sm" onClick={onSeeAll} className="text-blue-600 hover:text-blue-700 h-8 font-semibold">
                        See All <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                )}
            </div>

            <div className="relative group">
                {/* Scroll Buttons (Desktop only) */}
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md border border-gray-100 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hidden md:block"
                >
                    <ChevronLeft className="h-5 w-5 text-gray-700" />
                </button>

                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto px-4 pb-4 scrollbar-hide snap-x snap-mandatory"
                    style={{ scrollBehavior: 'smooth', scrollPaddingLeft: '16px' }}
                >
                    {isLoading ? (
                        Array(5).fill(0).map((_, i) => (
                            <div key={i} className="min-w-[140px] md:min-w-[200px] h-48 bg-gray-100 rounded-xl animate-pulse snap-start" />
                        ))
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="min-w-[140px] md:min-w-[200px] snap-start">
                                {renderItem(item)}
                            </div>
                        ))
                    )}
                </div>

                <button
                    onClick={() => scroll('right')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md border border-gray-100 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hidden md:block"
                >
                    <ChevronRight className="h-5 w-5 text-gray-700" />
                </button>
            </div>
        </div>
    );
}
