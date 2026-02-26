"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  TrendingUp,
  Receipt,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Banknote,
  Smartphone,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";

interface DashboardData {
  todaySales: number;
  todaySalesCount: number;
  todaySalesChange: number;
  grossProfit?: number;
  grossProfitMargin?: number;
  expenses?: number;
  pendingExpenses: number;
  netProfit?: number;
  lowStockCount: number;
  totalProducts: number;
  paymentBreakdown: {
    cash: number;
    mpesa: number;
    card: number;
  };
  recentSales: Array<{
    id: string;
    amount: number;
    items: number;
    time: string;
    paymentMethod: string;
  }>;
  lowStockProducts: Array<{
    name: string;
    stock: number;
    reorderLevel: number;
  }>;
  weeklySales?: Array<{
    day: string;
    date: string;
    sales: number;
    profit: number;
  }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const isOwner = session?.user?.role === "OWNER";
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const response = await fetch("/api/dashboard");
        if (response.ok) {
          const dashboardData = await response.json();
          setData(dashboardData);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-card border-border">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Failed to load dashboard data</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {session?.user?.name?.split(" ")[0] || "User"}
          </h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        {!isOwner && (
          <Button
            asChild
            className="bg-amber-500 hover:bg-amber-600 text-zinc-900"
          >
            <Link href="/pos">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Open POS
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today&apos;s Sales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              KES {data.todaySales.toLocaleString()}
            </div>
            <div className="flex items-center text-xs mt-1">
              {data.todaySalesChange >= 0 ? (
                <span className="text-green-500 flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-1" />+
                  {data.todaySalesChange}%
                </span>
              ) : (
                <span className="text-red-500 flex items-center">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  {data.todaySalesChange}%
                </span>
              )}
              <span className="text-muted-foreground ml-1">vs yesterday</span>
            </div>
          </CardContent>
        </Card>

        {isOwner && data.grossProfit !== undefined && (
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Gross Profit
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                KES {data.grossProfit.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {data.grossProfitMargin}% margin
              </div>
            </CardContent>
          </Card>
        )}

        {isOwner && data.expenses !== undefined && (
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Today&apos;s Expenses
              </CardTitle>
              <Receipt className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                KES {data.expenses.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {data.pendingExpenses} pending approvals
              </div>
            </CardContent>
          </Card>
        )}

        {isOwner && data.netProfit !== undefined && (
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Net Profit
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                KES {data.netProfit.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                After expenses
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock Items
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {data.lowStockCount}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              of {data.totalProducts} products
            </div>
          </CardContent>
        </Card>

        {!isOwner && (
          <Card className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href="/expenses">Add Expense</Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/closing">Daily Closing</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Payment Breakdown</CardTitle>
            <CardDescription>Today&apos;s payment methods</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-green-500" />
                <span className="text-sm">Cash</span>
              </div>
              <span className="font-medium">
                KES {data.paymentBreakdown.cash.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-purple-500" />
                <span className="text-sm">M-Pesa</span>
              </div>
              <span className="font-medium">
                KES {data.paymentBreakdown.mpesa.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Card</span>
              </div>
              <span className="font-medium">
                KES {data.paymentBreakdown.card.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Recent Sales</CardTitle>
              <CardDescription>Latest transactions</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/reports">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentSales.length > 0 ? (
                data.recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">{sale.id}</p>
                      <p className="text-xs text-muted-foreground">
                        {sale.items} items • {sale.time}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        KES {sale.amount.toLocaleString()}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {sale.paymentMethod}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No sales today</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Low Stock Alert</CardTitle>
              <CardDescription>Products below reorder level</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/inventory">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.lowStockProducts.length > 0 ? (
                data.lowStockProducts.map((product, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{product.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {product.stock}/{product.reorderLevel}
                      </span>
                    </div>
                    <Progress
                      value={(product.stock / product.reorderLevel) * 100}
                      className="h-1.5"
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  All products are well stocked
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {isOwner && data.weeklySales && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">
              Weekly Sales Overview
            </CardTitle>
            <CardDescription>
              Sales performance for the past 7 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-48">
              {data.weeklySales.map((day, index) => {
                const maxSales = Math.max(
                  ...data.weeklySales!.map((d) => d.sales),
                  1,
                );
                const height = (day.sales / maxSales) * 100;
                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <div
                      className="w-full bg-zinc-800 rounded-t relative"
                      style={{ height: `${height}%` }}
                    >
                      <div
                        className="absolute bottom-0 w-full bg-amber-500 rounded-t transition-all"
                        style={{ height: "100%" }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {day.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
