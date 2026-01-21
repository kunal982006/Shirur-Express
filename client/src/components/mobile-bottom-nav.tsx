// Mobile Bottom Navigation Component - Similar to Amazon/Flipkart/Blinkit style
import React from "react";
import { Home, BookOpen, LayoutDashboard, Settings, Tag, ClipboardList, UtensilsCrossed, Sparkles, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
    activeTab: string;
    onTabChange: (value: string) => void;
    tabs: { value: string; label: string }[];
    providerType: string;
}

// Map tab values to icons
const getTabIcon = (tabValue: string) => {
    switch (tabValue) {
        case "live-orders":
            return <ClipboardList className="h-5 w-5" />;
        case "grocery-orders":
            return <ClipboardList className="h-5 w-5" />;
        case "bookings":
            return <Home className="h-5 w-5" />;
        case "menu":
            return <UtensilsCrossed className="h-5 w-5" />;
        case "beauty-services":
            return <Sparkles className="h-5 w-5" />;
        case "rental-listings":
            return <Building2 className="h-5 w-5" />;
        case "offers":
            return <Tag className="h-5 w-5" />;
        case "profile":
            return <Settings className="h-5 w-5" />;
        case "specializations":
            return <LayoutDashboard className="h-5 w-5" />;
        default:
            return <LayoutDashboard className="h-5 w-5" />;
    }
};

// Shorten labels for mobile
const getShortLabel = (label: string) => {
    const labelMap: Record<string, string> = {
        "Live Orders": "Orders",
        "Bookings": "Bookings",
        "Menu / Services": "Menu",
        "Menu Management": "Menu",
        "My Services": "Services",
        "My Properties": "Properties",
        "Profile Settings": "Settings",
        "My Specializations": "Skills",
        "Offers": "Offers",
    };
    return labelMap[label] || label.split(" ")[0];
};

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
    activeTab,
    onTabChange,
    tabs,
    providerType,
}) => {
    // Show maximum 4 tabs in bottom nav for better spacing
    const displayTabs = tabs.slice(0, 4);

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 safe-area-bottom"
            style={{
                boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)'
            }}
        >
            <div className="flex items-center justify-around h-16 px-1 max-w-md mx-auto">
                {displayTabs.map((tab) => {
                    const isActive = activeTab === tab.value;
                    return (
                        <button
                            key={tab.value}
                            onClick={() => onTabChange(tab.value)}
                            className={cn(
                                "relative flex flex-col items-center justify-center flex-1 py-2 px-1 transition-all duration-200",
                                "focus:outline-none focus:ring-0 active:scale-95",
                                isActive
                                    ? "text-primary"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            )}
                        >
                            {/* Background pill for active state */}
                            <div
                                className={cn(
                                    "flex items-center justify-center w-12 h-8 rounded-2xl transition-all duration-300",
                                    isActive
                                        ? "bg-primary/15 scale-105"
                                        : "bg-transparent"
                                )}
                            >
                                {getTabIcon(tab.value)}
                            </div>
                            <span
                                className={cn(
                                    "text-[10px] mt-0.5 font-medium transition-all duration-200",
                                    isActive ? "font-semibold text-primary" : ""
                                )}
                            >
                                {getShortLabel(tab.label)}
                            </span>
                            {/* Active indicator line at top */}
                            {isActive && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default MobileBottomNav;

