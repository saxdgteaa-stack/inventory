"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./sidebar";
import { TopBar } from "./top-bar";
import { BottomNav } from "./bottom-nav";
import { MobileMenu } from "./mobile-menu";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed(!collapsed)}
        />
      </div>

      {/* Mobile Sidebar Overlay - Keep for backward compatibility but not shown */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar - Hidden, using bottom nav instead */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 lg:hidden transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "hidden",
        )}
      >
        <Sidebar collapsed={false} />
      </div>

      {/* Main Content */}
      <div
        className={cn(
          "main-content-transition min-h-screen flex flex-col",
          collapsed ? "lg:pl-16" : "lg:pl-64",
          "pb-20 lg:pb-0",
        )}
      >
        <TopBar title={title} onMenuClick={() => setMobileMenuOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>

        {/* Footer - Hidden on mobile */}
        <footer className="hidden lg:block border-t border-border py-4 px-6 text-center text-sm text-muted-foreground">
          <p>
            LSMS - Liquor Store Management System &copy;{" "}
            {new Date().getFullYear()}
          </p>
        </footer>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav onMenuClick={() => setMobileMenuOpen(true)} />

      {/* Mobile Menu Sheet */}
      <MobileMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
    </div>
  );
}
