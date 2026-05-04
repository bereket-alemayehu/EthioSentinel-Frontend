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

import { cn } from "@/shared/utils/cn"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { languages } from "@/shared/lib/i18n"
import { ModeToggle } from "@/shared/components/ui/ModeToggle"
import { useAuth } from "@/app/providers/auth/AuthProvider"
import { useTranslation } from "react-i18next"
import { useTheme } from "next-themes"
import { toast, Toaster } from "sonner"
import { logoB64 } from "@/assets/logo-b64"
import { useNotifications } from "@/shared/hooks/useNotifications"
import { markNotificationsReadNow } from "@/shared/lib/notificationsPrefs"

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const location = useLocation()
  const navigate = useNavigate()
   const { user, logout } = useAuth()
   const { t, i18n } = useTranslation()
   const { theme } = useTheme()
   const {
     items: notificationItems,
     unreadCount,
     enabled: notificationsEnabled,
     isLoading: notificationsLoading,
   } = useNotifications()
  

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
      toast.success(t("logoutSuccess"));
      navigate("/login");
    } catch (err) {
      console.error("Logout error:", err);
      toast.error(t("logoutFailed"));
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery("")
    }
  }

  const userInitials = user?.username 
    ? user.username.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : "U"

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60">
      <div className="w-full flex h-16 items-center justify-between px-6">
        {/* Left: Logo & Desktop Nav */}
        <div className="flex items-center gap-10">
          <Link
            to={
              user
                ? user.role === "admin"
                  ? "/admin"
                  : user.role === "hew"
                    ? "/hew"
                    : "/citizen"
                : "/"
            }
            className="flex items-center gap-2 md:gap-3 transition-all hover:scale-[1.02] active:scale-95"
          >
            <img 
              src={logoB64} 
              alt="Logo" 
              className="h-8 w-auto md:h-10 object-contain" 
            />
            <span className="text-xl md:text-2xl font-bold tracking-tighter hidden md:inline-block font-heading">
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
            <DropdownMenu
              onOpenChange={(open) => {
                if (open && user && notificationsEnabled) {
                  markNotificationsReadNow()
                }
              }}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9"
                  aria-label={t("notifications")}
                >
                  <Bell className="h-5 w-5" />
                  {user && notificationsEnabled && unreadCount > 0 ? (
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
                  ) : null}
                  <span className="sr-only">{t("notifications")}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 sm:w-96 p-0" align="end">
                <div className="flex items-center justify-between border-b px-3 py-2">
                  <span className="text-sm font-bold">{t("notifications")}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      markNotificationsReadNow()
                      toast.success(t("markAllReadDone"))
                    }}
                  >
                    {t("markAllRead")}
                  </Button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {!user ? (
                    <p className="p-4 text-sm text-muted-foreground">
                      {t("loginForNotifications")}
                    </p>
                  ) : !notificationsEnabled ? (
                    <p className="p-4 text-sm text-muted-foreground">
                      {t("notificationsDisabledHint")}
                    </p>
                  ) : notificationsLoading ? (
                    <p className="p-4 text-sm text-muted-foreground">{t("loadingNotifications")}</p>
                  ) : notificationItems.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">{t("notificationsEmpty")}</p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {notificationItems.slice(0, 10).map((n) => {
                        const sev = String(n.severity).toUpperCase()
                        const dot =
                          sev === "CRITICAL"
                            ? "bg-red-500"
                            : sev === "HIGH"
                              ? "bg-orange-500"
                              : sev === "MEDIUM"
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                        return (
                          <li key={n.id} className="px-3 py-2.5 hover:bg-muted/50">
                            <div className="flex gap-2">
                              <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", dot)} />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold leading-tight line-clamp-2">{n.title}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                  {n.targetZone}
                                  {n.disease ? ` · ${n.disease}` : ""}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {new Date(n.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Toaster 
              position="top-right" 
              richColors 
              expand={true}
              closeButton
              theme={theme as "light" | "dark" | "system"}
            />
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
                      <AvatarImage src="" alt={user.username || "User"} />
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.username}</p>
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
