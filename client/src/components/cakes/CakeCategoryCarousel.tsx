import { Card, CardContent } from "@/components/ui/card";

interface Category {
    id: string;
    name: string;
    image: string;
}

const categories: Category[] = [
    { id: "anniversary", name: "Anniversary", image: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
    { id: "birthday", name: "Birthday Cake", image: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
    { id: "cupcakes", name: "Cupcakes", image: "https://images.unsplash.com/photo-1550617931-e17a7b70dce2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
    { id: "pastries", name: "Pastries", image: "https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
    { id: "desserts", name: "Desserts", image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
    { id: "accessories", name: "Accessories", image: "https://images.unsplash.com/photo-1530103043960-ef38714abb15?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
];

export function CakeCategoryCarousel({ onSelect }: { onSelect: (id: string) => void }) {
    return (
        <div className="py-5 bg-transparent mb-2">
            <h3 className="text-xl font-bold mb-4 text-foreground/90">Inspiration for your first order</h3>
            <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x">
                {categories.map((cat) => (
                    <div
                        key={cat.id}
                        className="flex flex-col items-center gap-2 min-w-[76px] cursor-pointer snap-start group"
                        onClick={() => onSelect(cat.id)}
                    >
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden shadow-md border-2 border-transparent group-hover:border-primary transition-all duration-300">
                            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <span className="font-medium text-sm text-muted-foreground group-hover:text-primary transition-colors text-center">{cat.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
