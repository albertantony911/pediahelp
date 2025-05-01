import Link from "next/link";
import Logo from "@/components/logo";
import DesktopNav from "@/components/header/desktop-nav";
import BottomNav from "@/components/header/bottom-nav"


const navItems = [
  {
    label: "Home",
    href: "/",
    target: false,
  },
  {
    label: "Blog",
    href: "/blog",
    target: false,
  },
  {
    label: "About",
    href: "/about",
    target: false,
  },
];

export default function Header() {
  return (
    <header className="w-full z-50">
      {/* Desktop Header */}
      <div className="sticky top-0 w-full border-b bg-background/95 max-xl:hidden">
        <div className="container flex items-center justify-between h-14">
          <Link href="/" aria-label="Home page">
            <Logo />
          </Link>
          <div className="hidden xl:flex gap-7 items-center justify-between">
            <DesktopNav navItems={[]} />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation (inside header, but visually separate) */}
      <div className="xl:hidden">
        <BottomNav />
      </div>
    </header>
  );
}
