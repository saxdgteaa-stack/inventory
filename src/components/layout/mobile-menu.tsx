"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Receipt,
  CalendarCheck,
  Users,
  Settings,
  LogOut,
  Wine,
  Lock,
} from "lucide-react";

interface MobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const menuItems = [
  {
    title: "Expenses",
    href: "/expenses",
    icon: Receipt,
  },
  {
    title: "Daily Closing",
    href: "/closing",
    icon: CalendarCheck,
  },
  {
    title: "Users",
    href: "/users",
    icon: Users,
    ownerOnly: true,
  },
];

export function MobileMenu({ open, onOpenChange }: MobileMenuProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const isOwner = session?.user?.role === "OWNER";

  const filteredItems = menuItems.filter((item) => !item.ownerOnly || isOwner);

  const handleLinkClick = () => {
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto rounded-t-2xl px-0 pt-0">
        <SheetHeader className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Wine className="h-6 w-6 text-amber-500" />
            </div>
            <div className="text-left">
              <SheetTitle className="text-lg">LSMS</SheetTitle>
              <p className="text-xs text-muted-foreground">More Options</p>
            </div>
          </div>
        </SheetHeader>

        <Separator />

        {/* User Info */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 font-semibold">
              {session?.user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{session?.user?.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" />
                {session?.user?.role}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Menu Items */}
        <div className="px-6 py-4 space-y-1">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-amber-500/10 text-amber-500"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.title}</span>
              </Link>
            );
          })}
        </div>

        <Separator />

        {/* Sign Out */}
        <div className="px-6 py-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 text-destructive border-destructive/20 hover:bg-destructive/10"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        </div>

        {/* App Version */}
        <div className="px-6 pb-6 text-center">
          <p className="text-xs text-muted-foreground">LSMS v1.0.0 • © 2025</p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
