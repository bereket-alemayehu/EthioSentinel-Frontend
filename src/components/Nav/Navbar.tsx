import * as React from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { 
  LayoutDashboard, 
  Search, 
  Bell,
  Menu,
  X,
  Settings,
  LogOut,
  User,
  Activity
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { languages } from "@/lib/i18n"
import { ModeToggle } from "./ModeToggle"
import { useAuth } from "@/context/AuthContext"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Toaster } from "sonner"

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const location = useLocation()
  const navigate = useNavigate()
   const { user, logout } = useAuth()
   const { t, i18n } = useTranslation()
  

  const navItems = [
    { name: t("dashboard"), href: "/dashboard", icon: LayoutDashboard, roles: ["citizen", "hew", "admin"] },
    { name: t("citizenService"), href: "/citizen", icon: Activity, roles: ["citizen"] },
    { name: t("healthWorker"), href: "/hew", icon: Search, roles: ["hew", "admin"] },
    { name: t("adminPanel"), href: "/admin", icon: Settings, roles: ["admin"] },
  ]

  const filteredItems = navItems.filter(item => user && item.roles.includes(user.role))

  const handleLogout = async () => {
    try {
      await logout();
      toast.success(t("logoutSuccess") || "Logged out successfully");
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
      toast.error("Logout failed");
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery("")
    }
  }

  const userInitials = user?.name 
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : "U"

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
      <div className="w-full flex h-16 items-center justify-between px-6">
        {/* Left: Logo & Desktop Nav */}
        <div className="flex items-center gap-10">
          <Link to={user ? `/${user.role}` : "/"} className="flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-95">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-10 w-auto object-contain" 
            />
            <span className="text-2xl font-bold tracking-tighter sm:inline-block font-heading">
              Ethio<span className="primary-text-gradient font-black">Sentinel</span>
            </span>
          </Link>
          <div className="h-8 w-px bg-border/50 mx-2 hidden md:block" />
        </div>

        {/* Right: Search, Notifications, Theme, User */}
        <div className="flex items-center gap-2 md:gap-4">
          <form onSubmit={handleSearch} className="relative hidden lg:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9 md:w-80 lg:w-96"
            />
          </form>

          <div className="flex items-center gap-1 md:gap-2">
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-primary-500" />
              <span className="sr-only">{t("notifications")}</span>
            </Button>
            
            <Toaster position="top-right" />
            <ModeToggle />

            <div className="hidden sm:flex items-center gap-1 overflow-hidden rounded-full border border-border mr-2">
              {languages.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => i18n.changeLanguage(item.code)}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-bold transition-colors",
                    i18n.language === item.code
                      ? "bg-primary-500 text-white"
                      : "bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 p-0 rounded-full ring-2 ring-primary-500/20 transition-all hover:ring-primary-500/40 focus:ring-primary-500/60">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src="" alt={user.name || "User"} />
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem 
                      onClick={() => navigate("/profile")}
                      className="cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span>{t("profile")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => navigate("/settings")}
                      className="cursor-pointer"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>{t("settings")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t("logout")}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button className="primary-gradient text-white">{t("login")}</Button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Content */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background py-4 flex flex-col gap-1 px-4 animate-in fade-in slide-in-from-top-2">
          {filteredItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                location.pathname === item.href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          ))}
          <div className="pt-4 mt-4 border-t border-border">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t("searchPlaceholder")}
                className="w-full pl-10 h-10"
              />
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
