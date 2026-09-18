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
        <section className="py-1" aria-label={title}>
            <div className="mb-2 flex items-center justify-between">
                <h2 className="text-base font-extrabold tracking-tight text-slate-950 sm:text-lg">{title}</h2>
                {onSeeAll && (
                    <Button variant="ghost" size="sm" onClick={onSeeAll} className="h-8 px-1 text-xs font-semibold text-primary hover:text-primary">
                        See All <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                )}
            </div>

            <div className="relative group">
                {/* Scroll Buttons (Desktop only) */}
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-border bg-card p-2 shadow-md opacity-0 transition-all duration-300 group-hover:opacity-100 md:block"
                >
                    <ChevronLeft className="h-5 w-5 text-gray-700" />
                </button>

                <div
                    ref={scrollRef}
                    className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
                    style={{ scrollBehavior: 'smooth' }}
                >
                    {isLoading ? (
                        Array(5).fill(0).map((_, i) => (
                            <div key={i} className="h-44 min-w-[154px] animate-pulse rounded-xl bg-muted snap-start sm:min-w-[180px]" />
                        ))
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="min-w-[154px] snap-start sm:min-w-[180px]">
                                {renderItem(item)}
                            </div>
                        ))
                    )}
                </div>

                <button
                    onClick={() => scroll('right')}
                    className="absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-border bg-card p-2 shadow-md opacity-0 transition-all duration-300 group-hover:opacity-100 md:block"
                >
                    <ChevronRight className="h-5 w-5 text-gray-700" />
                </button>
            </div>
        </section>
    );
}
