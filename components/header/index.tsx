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
    <header className="w-full z-50 ">
      <div className="max-xl:hidden ">
        <DesktopNav />
      </div>

      <div className="xl:hidden">
        <BottomNav />
      </div>
    </header>
  );
}
