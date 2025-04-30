"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Home,
  BookOpen,
  Stethoscope,
  MoreHorizontal,
  X,
  MessageSquareHeart,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerClose,
} from "@/components/ui/drawer"
import { DoctorSearchDrawer } from "@/components/blocks/doctor/DoctorSearchDrawer"

// helpers
const vibrate = () => navigator.vibrate?.([10])
const isActive = (current: string, href: string) => current === href

// nav item config
type NavItem = {
  label: string
  href: string
  icon: React.ElementType
  primary?: boolean
  overflow?: boolean
}

const navItems: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Resources", href: "/blog", icon: BookOpen },
  {
    label: "Consult",
    href: "/booking",
    icon: Stethoscope,
    primary: true,
  },
  { label: "Ask", href: "/ask-doctor", icon: MessageSquareHeart },
  { label: "More", href: "#", icon: MoreHorizontal, overflow: true },
]

const overflowItems = [
  { label: "Settings", href: "/settings" },
  { label: "Profile", href: "/profile" },
]

export default function BottomNav() {
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // auto-close overflow drawer on route change
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  const moreIsActive = overflowItems.some((o) => isActive(pathname, o.href))

  return (
    <nav
      aria-label="Primary navigation"
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 xl:hidden",
        "flex h-16 items-center justify-between border-t bg-background/95",
        "backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "px-4 pb-[calc(env(safe-area-inset-bottom))]"
      )}
    >
      {navItems.map(({ label, href, icon: Icon, primary, overflow }) => {
        // --- overflow trigger ---
        if (overflow) {
          return (
            <Drawer key={label} open={drawerOpen} onOpenChange={setDrawerOpen}>
              <DrawerTrigger asChild>
                <button
                  aria-label="More options"
                  onClick={vibrate}
                  className={cn(
                    "flex flex-col items-center justify-center w-16 h-full gap-1",
                    "text-sm font-medium text-muted-foreground hover:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    moreIsActive && "text-primary"
                  )}
                >
                  <Icon className={cn("h-6 w-6", moreIsActive && "font-bold")} />
                  {label}
                </button>
              </DrawerTrigger>

              <DrawerContent className="max-h-[75vh] bg-background/95 backdrop-blur">
                <div className="mx-auto mt-4 mb-6 h-1.5 w-12 rounded-full bg-muted" />
                <ul className="space-y-3 px-6 pb-10">
                  {overflowItems.map(({ label, href }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        onClick={vibrate}
                        className={cn(
                          "block text-base font-medium transition-colors hover:text-primary",
                          isActive(pathname, href) && "text-primary font-semibold"
                        )}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>

                <DrawerClose asChild>
                  <button
                    aria-label="Close menu"
                    onClick={vibrate}
                    className="absolute right-4 top-4 rounded-full p-2 bg-muted/50 hover:bg-muted"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </DrawerClose>
              </DrawerContent>
            </Drawer>
          )
        }

        // --- primary CTA trigger (DoctorSearchDrawer) ---
        if (primary) {
          return (
            <DoctorSearchDrawer key={label}>
              <button
                aria-label={label}
                onClick={vibrate}
                className={cn(
                  "relative -mt-6 flex h-14 w-14 items-center justify-center rounded-full",
                  "bg-primary text-primary-foreground shadow-md transform hover:scale-105",
                  "ring-offset-background focus-visible:outline-none focus-visible:ring-2",
                  "focus-visible:ring-ring ring-offset-2"
                )}
              >
                <Icon className="h-7 w-7" />
              </button>
            </DoctorSearchDrawer>
          )
        }

        // --- regular nav items ---
        return (
          <Link
            key={label}
            href={href}
            onClick={vibrate}
            aria-label={label}
            className={cn(
              "flex flex-col items-center justify-center w-16 h-full gap-1",
              "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive(pathname, href) && "text-primary"
            )}
          >
            <Icon
              className={cn("h-6 w-6", isActive(pathname, href) && "font-bold")}
            />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}