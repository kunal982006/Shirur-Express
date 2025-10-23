import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// --- BADLAV: useCart ki jagah useCartStore import kiya ---
import { useCartStore } from "@/hooks/use-cart-store";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Network,
  ShoppingCart,
  User,
  Menu,
  X,
  LogOut,
  Settings
} from "lucide-react";

export default function Header() {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- BADLAV: useCart ki jagah useCartStore use kiya ---
  const itemCount = useCartStore((state) => state.getItemCount());
  const { user, isAuthenticated, logout } = useAuth();

  // --- BADLAV: totalItems ki calculation ab useCartStore se aayegi ---
  // const totalItems = items.reduce((total, item) => total + item.quantity, 0); // Is line ki ab zaroorat nahi
  const totalItems = itemCount; // useCartStore se direct itemCount use kiya

  const navigation = [
    { name: "Services", href: "/#services" },
    { name: "How It Works", href: "/#how-it-works" },
    { name: "Offers", href: "/#offers" }
  ];

  return (
    <header className="bg-card shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center text-2xl font-bold text-primary">
              <Network className="h-6 w-6 mr-2" />
              {/* --- BADLAV: Logo ka text 'Shirur Express' kiya --- */}
              Shirur Express
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`font-medium transition ${
                  location === item.href
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {item.name}
              </a>
            ))}
            {/* NEW: My Bookings Link for Authenticated Users */}
            {isAuthenticated && (
              <Link
                href="/my-bookings"
                className={`font-medium transition ${
                  location === "/my-bookings"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                My Bookings
              </Link>
            )}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart Icon */}
            {/* --- BADLAV: Cart icon ka link /checkout kiya --- */}
            <Link href="/checkout">
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                data-testid="button-cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <Badge
                    variant="secondary"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs cart-badge bg-accent text-accent-foreground"
                  >
                    {totalItems}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="hidden sm:flex items-center space-x-2"
                    data-testid="button-user-menu"
                  >
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <span className="text-sm font-medium">{user?.username}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {user?.role === "provider" && (
                    <DropdownMenuItem onClick={() => setLocation("/provider-dashboard")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Provider Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setLocation("/my-bookings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    My Bookings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} data-testid="button-logout">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => setLocation("/login")}
                  data-testid="button-login"
                >
                  Login
                </Button>
                <Button
                  onClick={() => setLocation("/signup")}
                  data-testid="button-signup"
                >
                  Sign Up
                </Button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-card border-t">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-primary hover:bg-muted rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </a>
            ))}
            {isAuthenticated && (
              <Link
                href="/my-bookings"
                className="block px-3 py-2 text-base font-medium text-muted-foreground hover:text-primary hover:bg-muted rounded-md"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Bookings
              </Link>
            )}
            <div className="px-3 py-2">
              {isAuthenticated ? (
                <Button
                  className="w-full flex items-center space-x-2"
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  variant="outline" // Changed variant for logout button
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout ({user?.username})</span>
                </Button>
              ) : (
                <Button
                  className="w-full flex items-center space-x-2"
                  onClick={() => { setLocation("/login"); setMobileMenuOpen(false); }}
                >
                  <User className="h-4 w-4" />
                  <span>Sign In</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}