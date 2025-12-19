import { Button } from "@/components/ui/button";
import { Filter, ChevronDown } from "lucide-react";

interface FilterBarProps {
    filters: { label: string; value: string; active?: boolean }[];
    onFilterChange: (value: string) => void;
}

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
    return (
        <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide sticky top-0 bg-background/95 backdrop-blur z-30 py-4 border-b">
            <Button variant="outline" size="sm" className="rounded-lg h-9 gap-1 text-muted-foreground">
                <Filter className="h-4 w-4" />
                Filters
            </Button>
            {filters.map((filter) => (
                <Button
                    key={filter.value}
                    variant={filter.active ? "default" : "outline"}
                    size="sm"
                    onClick={() => onFilterChange(filter.value)}
                    className={`rounded-lg h-9 shadow-sm ${filter.active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/50"}`}
                >
                    {filter.label}
                    {filter.value === 'sort' && <ChevronDown className="ml-1 h-3 w-3" />}
                </Button>
            ))}
        </div>
    );
}
