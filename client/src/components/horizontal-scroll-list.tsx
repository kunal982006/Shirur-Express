import { useEffect, useMemo, useRef } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HorizontalScrollListProps<T> {
    title: string;
    items: T[];
    renderItem: (item: T) => React.ReactNode;
    onSeeAll?: () => void;
    isLoading?: boolean;
    autoScroll?: boolean;
    autoScrollSpeed?: number;
}

export function HorizontalScrollList<T extends { id: string | number }>({
    title,
    items,
    renderItem,
    onSeeAll,
    isLoading,
    autoScroll = false,
    autoScrollSpeed = 38,
}: HorizontalScrollListProps<T>) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const isHoveredRef = useRef(false);
    const isInteractingRef = useRef(false);
    const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Compute display items: when autoScroll is enabled, repeat items so it loops seamlessly
    const repeatCount = useMemo(() => {
        if (!autoScroll || !items || items.length === 0) return 1;
        return Math.max(3, Math.ceil(15 / items.length));
    }, [autoScroll, items]);

    const displayItems = useMemo(() => {
        if (!autoScroll || !items || items.length === 0 || repeatCount <= 1) return items || [];
        const result: T[] = [];
        for (let i = 0; i < repeatCount; i++) {
            result.push(...items);
        }
        return result;
    }, [autoScroll, items, repeatCount]);

    useEffect(() => {
        if (!autoScroll || isLoading || !items || items.length === 0) return;

        if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }

        const container = scrollRef.current;
        if (!container) return;

        let animationFrameId: number;
        let lastTime = performance.now();

        const step = (now: number) => {
            const delta = (now - lastTime) / 1000;
            lastTime = now;

            if (!isHoveredRef.current && !isInteractingRef.current && container) {
                container.scrollLeft += autoScrollSpeed * delta;

                const singleSetWidth = container.scrollWidth / repeatCount;
                if (singleSetWidth > 0 && container.scrollLeft >= singleSetWidth) {
                    container.scrollLeft -= singleSetWidth;
                } else if (container.scrollLeft <= 0 && singleSetWidth > 0) {
                    container.scrollLeft += singleSetWidth;
                }
            }
            animationFrameId = requestAnimationFrame(step);
        };

        animationFrameId = requestAnimationFrame(step);

        const onMouseEnter = () => {
            isHoveredRef.current = true;
        };
        const onMouseLeave = () => {
            isHoveredRef.current = false;
        };

        const onTouchStart = () => {
            isInteractingRef.current = true;
            if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
        };

        const onTouchEnd = () => {
            if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
            resumeTimeoutRef.current = setTimeout(() => {
                isInteractingRef.current = false;
            }, 1200);
        };

        container.addEventListener("mouseenter", onMouseEnter);
        container.addEventListener("mouseleave", onMouseLeave);
        container.addEventListener("touchstart", onTouchStart, { passive: true });
        container.addEventListener("touchend", onTouchEnd, { passive: true });

        return () => {
            cancelAnimationFrame(animationFrameId);
            if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
            container.removeEventListener("mouseenter", onMouseEnter);
            container.removeEventListener("mouseleave", onMouseLeave);
            container.removeEventListener("touchstart", onTouchStart);
            container.removeEventListener("touchend", onTouchEnd);
        };
    }, [autoScroll, autoScrollSpeed, isLoading, items, repeatCount]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = direction === 'left' ? -current.offsetWidth / 1.5 : current.offsetWidth / 1.5;
            current.scrollBy({ left: scrollAmount, behavior: 'smooth' });

            if (autoScroll) {
                isInteractingRef.current = true;
                if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
                resumeTimeoutRef.current = setTimeout(() => {
                    isInteractingRef.current = false;
                }, 1800);
            }
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
                    aria-label="Scroll left"
                >
                    <ChevronLeft className="h-5 w-5 text-gray-700" />
                </button>

                <div
                    ref={scrollRef}
                    className={`flex gap-3 overflow-x-auto pb-2 scrollbar-hide ${autoScroll ? 'select-none' : 'snap-x snap-mandatory'}`}
                    style={{ scrollBehavior: autoScroll ? 'auto' : 'smooth' }}
                >
                    {isLoading ? (
                        Array(5).fill(0).map((_, i) => (
                            <div key={i} className="h-44 min-w-[154px] shrink-0 animate-pulse rounded-xl bg-muted snap-start sm:min-w-[180px]" />
                        ))
                    ) : (
                        displayItems.map((item, idx) => (
                            <div key={`${item.id}-${idx}`} className="min-w-[154px] shrink-0 snap-start sm:min-w-[180px]">
                                {renderItem(item)}
                            </div>
                        ))
                    )}
                </div>

                <button
                    onClick={() => scroll('right')}
                    className="absolute right-2 top-1/2 z-20 hidden -translate-y-1/2 rounded-full border border-border bg-card p-2 shadow-md opacity-0 transition-all duration-300 group-hover:opacity-100 md:block"
                    aria-label="Scroll right"
                >
                    <ChevronRight className="h-5 w-5 text-gray-700" />
                </button>
            </div>
        </section>
    );
}
