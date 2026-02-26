"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart3,
  Menu,
} from "lucide-react";

interface BottomNavProps {
  onMenuClick: () => void;
}

const navItems = [
  {
    title: "Home",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "POS",
    href: "/pos",
    icon: ShoppingCart,
  },
  {
    title: "Inventory",
    href: "/inventory",
    icon: Package,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    ownerOnly: true,
  },
];

export function BottomNav({ onMenuClick }: BottomNavProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isOwner = session?.user?.role === "OWNER";

  const filteredItems = navItems.filter((item) => !item.ownerOnly || isOwner);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-sidebar border-t border-sidebar-border lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center min-w-[60px] h-full py-2 px-3 rounded-lg transition-colors",
                isActive
                  ? "text-amber-500"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-amber-500")} />
              <span
                className={cn(
                  "text-[10px] mt-1 font-medium",
                  isActive && "text-amber-500",
                )}
              >
                {item.title}
              </span>
            </Link>
          );
        })}

        {/* More Menu Button */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center min-w-[60px] h-full py-2 px-3 rounded-lg transition-colors text-sidebar-foreground/60 hover:text-sidebar-foreground"
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] mt-1 font-medium">More</span>
        </button>
      </div>
    </nav>
  );
}
