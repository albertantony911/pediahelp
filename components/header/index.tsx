import DesktopNav from "@/components/header/desktop-nav";
import BottomNav from "@/components/header/bottom-nav"


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
