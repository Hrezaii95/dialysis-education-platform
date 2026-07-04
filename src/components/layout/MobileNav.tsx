"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, Award, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const PRIMARY = [
  { href: "/", label: "Home", icon: Home },
  { href: "/my-path", label: "My Path", icon: Map },
  { href: "/assessment", label: "Assess", icon: Award },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
];

export function MobileNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 border-t border-white/10 bg-canvas/95 backdrop-blur-xl md:hidden pb-[env(safe-area-inset-bottom)]"
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch justify-around px-1 pt-1">
        {PRIMARY.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex min-h-[52px] min-w-[64px] flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1 text-[10px] font-medium transition-colors",
              isActive(href) ? "text-accent" : "text-muted"
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
