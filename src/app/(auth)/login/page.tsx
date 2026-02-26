"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  Loader2,
  Wine,
  ShoppingCart,
  Package,
  BarChart3,
  ShieldCheck,
  Zap,
  Users,
  TrendingUp,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/auth/session");
      const session = await response.json();

      if (session?.user?.role === "OWNER") {
        router.push("/");
      } else {
        router.push("/");
      }
      router.refresh();
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const fillCredentials = (role: "owner" | "seller") => {
    if (role === "owner") {
      setEmail("owner@lsms.com");
      setPassword("owner123");
    } else {
      setEmail("seller@lsms.com");
      setPassword("seller123");
    }
  };

  const features = [
    {
      icon: ShoppingCart,
      title: "Point of Sale",
      description: "Fast & intuitive POS system",
    },
    {
      icon: Package,
      title: "Inventory",
      description: "Real-time stock management",
    },
    {
      icon: BarChart3,
      title: "Reports",
      description: "Detailed analytics & insights",
    },
    {
      icon: ShieldCheck,
      title: "Secure",
      description: "Role-based access control",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/20 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-72 h-72 bg-amber-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-amber-600 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Wine className="h-8 w-8 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">LSMS</h1>
              <p className="text-xs text-zinc-500">Liquor Store Management</p>
            </div>
          </div>

          {/* Hero Text */}
          <div className="mt-16">
            <h2 className="text-4xl font-bold text-zinc-100 leading-tight">
              Manage your liquor store
              <span className="text-amber-500"> efficiently</span>
            </h2>
            <p className="mt-4 text-lg text-zinc-400 max-w-md">
              A complete solution for sales, inventory, expenses, and daily
              operations. Built for modern liquor stores.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6">
            <div className="bg-zinc-800/30 backdrop-blur border border-zinc-700/50 rounded-xl p-4">
              <TrendingUp className="h-5 w-5 text-amber-500 mb-2" />
              <p className="text-2xl font-bold text-zinc-100">100%</p>
              <p className="text-xs text-zinc-500">Sales Tracking</p>
            </div>
            <div className="bg-zinc-800/30 backdrop-blur border border-zinc-700/50 rounded-xl p-4">
              <Zap className="h-5 w-5 text-amber-500 mb-2" />
              <p className="text-2xl font-bold text-zinc-100">Fast</p>
              <p className="text-xs text-zinc-500">POS Checkout</p>
            </div>
            <div className="bg-zinc-800/30 backdrop-blur border border-zinc-700/50 rounded-xl p-4">
              <Users className="h-5 w-5 text-amber-500 mb-2" />
              <p className="text-2xl font-bold text-zinc-100">Multi</p>
              <p className="text-xs text-zinc-500">User Support</p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="relative z-10 grid grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-zinc-800/30 backdrop-blur border border-zinc-700/50 rounded-xl p-4 hover:border-amber-500/30 transition-colors"
            >
              <feature.icon className="h-6 w-6 text-amber-500 mb-3" />
              <h3 className="font-semibold text-zinc-100">{feature.title}</h3>
              <p className="text-sm text-zinc-500 mt-1">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-zinc-600">
          © 2025 LSMS. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Wine className="h-8 w-8 text-amber-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-zinc-100">LSMS</h1>
                <p className="text-xs text-zinc-500">Liquor Store Management</p>
              </div>
            </div>
          </div>

          <Card className="border-zinc-800 bg-zinc-900/50 backdrop-blur">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl font-bold text-zinc-100">
                Welcome back
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert
                    variant="destructive"
                    className="bg-red-950/50 border-red-900 text-red-200"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:ring-amber-500 h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-300">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="bg-zinc-800/50 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500 focus:ring-amber-500 h-11"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-900 font-semibold h-11"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>

              {/* Demo Credentials - Clickable */}
              <div className="mt-6 pt-6 border-t border-zinc-800">
                <p className="text-xs text-zinc-500 text-center mb-3">
                  Quick login with demo credentials
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => fillCredentials("owner")}
                    className="group bg-zinc-800/50 hover:bg-amber-500/10 border border-zinc-700 hover:border-amber-500/30 rounded-lg p-3 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldCheck className="h-4 w-4 text-amber-500" />
                      <p className="text-sm font-medium text-zinc-100 group-hover:text-amber-500 transition-colors">
                        Owner
                      </p>
                    </div>
                    <p className="text-xs text-zinc-500 truncate">
                      owner@lsms.com
                    </p>
                    <p className="text-xs text-zinc-600">Click to fill</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillCredentials("seller")}
                    className="group bg-zinc-800/50 hover:bg-amber-500/10 border border-zinc-700 hover:border-amber-500/30 rounded-lg p-3 text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-amber-500" />
                      <p className="text-sm font-medium text-zinc-100 group-hover:text-amber-500 transition-colors">
                        Seller
                      </p>
                    </div>
                    <p className="text-xs text-zinc-500 truncate">
                      seller@lsms.com
                    </p>
                    <p className="text-xs text-zinc-600">Click to fill</p>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Footer */}
          <p className="lg:hidden text-center text-xs text-zinc-600 mt-8">
            © 2025 LSMS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
