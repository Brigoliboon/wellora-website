import Navbar from "@/components/sections/Navbar";

export default function Header() {
  return (
    <header data-nav="main" className="fixed inset-x-0 top-0 z-50 bg-transparent">
      <Navbar />
    </header>
  );
}
