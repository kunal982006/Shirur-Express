import { Card, CardContent } from "@/components/ui/card";

interface Category {
    id: string;
    name: string;
    image: string;
}

const categories: Category[] = [
    { id: "biryani", name: "Biryani", image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
    { id: "pizza", name: "Pizza", image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
    { id: "burger", name: "Burger", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
    { id: "dosa", name: "Dosa", image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
    { id: "thali", name: "Thali", image: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
    { id: "sandwich", name: "Sandwich", image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
    { id: "momos", name: "Momos", image: "https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
    { id: "chinese", name: "Chinese", image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
    { id: "cake", name: "Cake", image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
    { id: "paneer", name: "Paneer", image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
    { id: "rolls", name: "Rolls", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
    { id: "chaat", name: "Chaat", image: "https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
    { id: "coffee", name: "Coffee", image: "https://images.unsplash.com/photo-1517244683847-7456b63c5969?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3" },
];

export function CategoryCarousel({ onSelect }: { onSelect: (id: string) => void }) {
    return (
        <div className="py-5 bg-muted/20 -mx-4 px-4 mb-2">
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
                        <span className="font-medium text-sm text-muted-foreground group-hover:text-primary transition-colors">{cat.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
