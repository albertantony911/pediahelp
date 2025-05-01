import Link from "next/link";
import Logo from "@/components/logo";
import DesktopNav from "@/components/header/desktop-nav";
import BottomNav from "@/components/header/bottom-nav";

// Updated navItems with dropdowns
const navItems = [
  {
    label: "Home",
    href: "/",
    target: false,
  },
  {
    label: "About",
    href: "/about",
    target: false,
  },
  {
    label: "Specialties",
    href: "#",
    target: false,
    subItems: [
      { label: "Cardiology", href: "/specialties/cardiology", target: false },
      { label: "Neurology", href: "/specialties/neurology", target: false },
      { label: "Pediatrics", href: "/specialties/pediatrics", target: false },
    ],
  },
  {
    label: "Resources",
    href: "#",
    target: false,
    subItems: [
      { label: "Health Tips", href: "/resources/health-tips", target: false },
      { label: "FAQs", href: "/resources/faqs", target: false },
      { label: "Guides", href: "/resources/guides", target: false },
    ],
  },
  {
    label: "Contact",
    href: "/contact",
    target: false,
  },
];

export default function Header() {
  return (
    <header className="w-full z-50">
      {/* Desktop Header */}
      <div className="sticky top-0 w-full bg-teal-900 text-white">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Link href="/" aria-label="Home page">
            <Logo />
          </Link>
          <div className="hidden xl:flex items-center gap-4">
            <DesktopNav navItems={navItems} />
            {/* Action Buttons */}
            <Link
              href="/ask-doctor"
              className="border-2 border-teal-600 text-white px-4 py-1 rounded-full hover:bg-teal-700 transition"
            >
              Ask Doctor
            </Link>
            <Link
              href="/book-consultation"
              className="bg-teal-600 text-white px-4 py-1 rounded-full hover:bg-teal-500 transition"
            >
              Book Consultation
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="xl:hidden">
        <BottomNav />
      </div>
    </header>
  );
}