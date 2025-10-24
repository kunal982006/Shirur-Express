import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, Home, Settings, LogOut, Package, User, LayoutDashboard } from "lucide-react"; // LayoutDashboard icon add kiya
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { name: "Home", href: "/", icon: Home },
  { name: "My Bookings", href: "/my-bookings", icon: Package },
  // Settings link ko user-specific settings ke liye rakha hai
  // Provider Dashboard ka link alag se handle kiya gaya hai
];

export default function Header() {
  const [, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoading, logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    await logout();
    toast({
      title: "👋 Logged Out!",
      description: "You have been successfully logged out.",
    });
    setLocation("/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b h-16 flex items-center px-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center w-full">
        <div className="flex items-center gap-4">
          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <nav className="flex flex-col gap-4 py-6">
                {navItems.map((item) => (
                  <Button
                    key={item.name}
                    variant="ghost"
                    className="justify-start px-4 py-2 text-lg font-medium"
                    onClick={() => {
                      setLocation(item.href);
                      setIsOpen(false);
                    }}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Button>
                ))}

                {/* Mobile: Provider Dashboard link */}
                {user?.role === 'provider' && (
                  <Button
                    variant="ghost"
                    className="justify-start px-4 py-2 text-lg font-medium"
                    onClick={() => {
                      setLocation("/provider/dashboard");
                      setIsOpen(false);
                    }}
                  >
                    <LayoutDashboard className="mr-3 h-5 w-5" />
                    Provider Dashboard
                  </Button>
                )}
                 {/* Mobile: Settings link */}
                 {user && ( // Settings sirf logged-in user ke liye
                    <Button
                      variant="ghost"
                      className="justify-start px-4 py-2 text-lg font-medium"
                      onClick={() => {
                        setLocation("/settings");
                        setIsOpen(false);
                      }}
                    >
                      <Settings className="mr-3 h-5 w-5" />
                      Settings
                    </Button>
                 )}

                {/* Mobile: Logout / Login Button */}
                {user ? (
                  <Button
                    variant="ghost"
                    className="justify-start px-4 py-2 text-lg font-medium text-red-500 hover:text-red-600"
                    onClick={() => {
                      handleLogout();
                      setIsOpen(false);
                    }}
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    Logout
                  </Button>
                ) : (
                  !isLoading && (
                    <Button
                      variant="ghost"
                      className="justify-start px-4 py-2 text-lg font-medium"
                      onClick={() => {
                        setLocation("/login");
                        setIsOpen(false);
                      }}
                    >
                      <User className="mr-3 h-5 w-5" />
                      Login
                    </Button>
                  )
                )}
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo / Home link */}
          <Button variant="ghost" className="text-xl font-bold" onClick={() => setLocation("/")}>
            ServiceConnect
          </Button>

          {/* Desktop Navigation (optional, if needed) */}
          <nav className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Button
                key={item.name}
                variant="ghost"
                onClick={() => setLocation(item.href)}
                className="text-sm font-medium"
              >
                {item.name}
              </Button>
            ))}
             {user?.role === 'provider' && (
                <Button
                    variant="ghost"
                    onClick={() => setLocation("/provider/dashboard")}
                    className="text-sm font-medium"
                >
                    <LayoutDashboard className="mr-2 h-4 w-4" /> {/* Icon ke saath */}
                    Provider Dashboard
                </Button>
            )}
             {user && (
                <Button
                    variant="ghost"
                    onClick={() => setLocation("/settings")}
                    className="text-sm font-medium"
                >
                    <Settings className="mr-2 h-4 w-4" /> {/* Icon ke saath */}
                    Settings
                </Button>
            )}
          </nav>
        </div>

        {/* User Dropdown / Login Button */}
        <div className="flex items-center space-x-2">
          {isLoading ? (
            <div className="w-8 h-8 rounded-full bg-muted animate-pulse"></div> // Loading state for avatar
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="/placeholder-user.jpg" alt="User Avatar" />
                    <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLocation("/my-bookings")}>
                  <Package className="mr-2 h-4 w-4" />
                  <span>My Bookings</span>
                </DropdownMenuItem>
                {/* Desktop Dropdown: Provider Dashboard link */}
                {user.role === 'provider' && (
                  <DropdownMenuItem onClick={() => setLocation("/provider/dashboard")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Provider Dashboard</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setLocation("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-600 focus:bg-red-50">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button onClick={() => setLocation("/login")}>
              Login / Signup
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}