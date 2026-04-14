"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";

const NAV_ITEMS = [
  { name: "New Job", href: "/new-job" },
  { name: "The Vault", href: "/vault" },
  { name: "Admin Master", href: "/admin-master" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="bg-white sticky top-0 z-50 print:hidden font-sans border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="hidden sm:flex items-center h-20 gap-6">

          {/* Shield Logo */}
          <Image
            src="/images/dvn-logo-2.png"
            alt="DVN Coach Warriors"
            width={52}
            height={60}
            className="object-contain drop-shadow-sm flex-shrink-0"
            priority
          />

          {/* Wordmark */}
          <div className="flex flex-col justify-center pr-6 border-r border-slate-200">
            <span className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">DVN Coach</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-1">Warriors Since 1972</span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
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

      {/* Mobile nav: logo + tabs stacked */}
      <div className="sm:hidden">
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          <Image
            src="/images/dvn-logo-2.png"
            alt="DVN Coach Warriors"
            width={32}
            height={37}
            className="object-contain"
            priority
          />
          <span className="text-sm font-black text-slate-800 uppercase tracking-widest">DVN Coach</span>
        </div>
        <div className="flex overflow-x-auto px-4 pb-3 space-x-2">
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
      </div>
    </nav>
  );
}
