"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";

const NAV_ITEMS = [
  { name: "Live Floor", href: "/" },
  { name: "New Job", href: "/new-job" },
  { name: "The Vault", href: "/vault" },
  { name: "Admin Master", href: "/admin" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white sticky top-0 z-50 print:hidden font-sans border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center pr-8 mr-4 border-r border-slate-100 h-8">
              <span className="text-xl font-bold text-teal-600 tracking-tight flex items-center gap-2">
                <div className="w-6 h-6 bg-teal-500 rounded-md"></div>
                DVN COACH
              </span>
            </div>
            <div className="hidden sm:flex sm:space-x-2">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                      isActive
                        ? "bg-teal-50 text-teal-700"
                        : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile nav */}
      <div className="sm:hidden flex overflow-x-auto px-4 py-2 space-x-2 pb-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-teal-50 text-teal-700 font-semibold"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              )}
            >
              {item.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
