'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Smartphone,
  Printer,
  Check,
  Package,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  reorderLevel: number;
  category: { name: string };
}

interface CartItem extends Product {
  quantity: number;
}

interface Category {
  id: string;
  name: string;
  _count?: { products: number };
}

type PaymentMethod = 'CASH' | 'MPESA' | 'CARD';

export default function POSPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [completedSale, setCompletedSale] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [discount, setDiscount] = useState(0);
  const [amountReceived, setAmountReceived] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch products and categories
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/products/categories'),
        ]);
        
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData);
        }
        
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load products',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = 
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase()) ||
      (product.barcode && product.barcode.includes(search));
    
    const matchesCategory = 
      selectedCategory === 'all' || 
      product.category.name === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Cart calculations
  const subtotal = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const total = subtotal - discount;

  // Add to cart
  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.currentStock) {
          toast({
            title: 'Stock limit reached',
            description: `Only ${product.currentStock} units available`,
            variant: 'destructive',
          });
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }, [toast]);

  // Update quantity
  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev.map((item) => {
        if (item.id === productId) {
          const newQuantity = item.quantity + delta;
          if (newQuantity <= 0) return item;
          if (newQuantity > item.currentStock) {
            toast({
              title: 'Stock limit reached',
              description: `Only ${item.currentStock} units available`,
              variant: 'destructive',
            });
            return item;
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
    });
  };

  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setDiscount(0);
  };

  // Process sale
  const processSale = async () => {
    if (cart.length === 0) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
          paymentMethod,
          paymentReference: paymentReference || null,
          discount,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process sale');
      }

      const sale = await response.json();
      setCompletedSale(sale);
      setShowPaymentDialog(false);
      setShowReceiptDialog(true);
      clearCart();
      setPaymentReference('');
      setAmountReceived(0);

      // Refresh products to get updated stock
      const productsRes = await fetch('/api/products');
      if (productsRes.ok) {
        setProducts(await productsRes.json());
      }

      toast({
        title: 'Sale completed',
        description: `Receipt: ${sale.receiptNumber}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process sale',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return `KES ${price.toLocaleString()}`;
  };

  const change = amountReceived - total;

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-4">
      {/* Products Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <Card className="flex-1 flex flex-col bg-card border-border">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products by name, SKU, or barcode..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-0">
            <ScrollArea className="h-full px-6 pb-6">
              {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mb-4 opacity-50" />
                  <p>No products found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => addToCart(product)}
                      disabled={product.currentStock <= 0}
                      className={cn(
                        'p-3 rounded-lg border text-left transition-all',
                        'hover:border-amber-500 hover:bg-amber-500/5',
                        product.currentStock <= 0
                          ? 'opacity-50 cursor-not-allowed bg-muted'
                          : 'bg-background border-border'
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xs text-muted-foreground">
                          {product.category.name}
                        </span>
                        {product.currentStock <= product.reorderLevel && (
                          <AlertCircle className="h-3 w-3 text-amber-500" />
                        )}
                      </div>
                      <p className="font-medium text-sm text-foreground line-clamp-2 mb-2">
                        {product.name}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-amber-500">
                          {formatPrice(product.sellingPrice)}
                        </span>
                        <span className={cn(
                          'text-xs',
                          product.currentStock <= 0
                            ? 'text-red-500'
                            : product.currentStock <= product.reorderLevel
                            ? 'text-amber-500'
                            : 'text-muted-foreground'
                        )}>
                          {product.currentStock}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Cart Section */}
      <Card className="lg:w-96 flex flex-col bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart
            </CardTitle>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart}>
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0 p-0">
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground px-6">
              <ShoppingCart className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-center">Add products to cart</p>
              <p className="text-xs text-center mt-1">
                Click on products to add them
              </p>
            </div>
          ) : (
            <>
              <ScrollArea className="flex-1 px-6">
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(item.sellingPrice)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-500 hover:text-red-600"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Totals */}
              <div className="border-t border-border p-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-500">
                      <span>Discount</span>
                      <span>-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-amber-500">{formatPrice(total)}</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-amber-500 hover:bg-amber-600 text-zinc-900 font-semibold"
                  size="lg"
                  onClick={() => setShowPaymentDialog(true)}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Process Payment
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Select payment method and complete the sale
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-3xl font-bold text-amber-500">{formatPrice(total)}</p>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
                className="grid grid-cols-3 gap-3"
              >
                <div>
                  <RadioGroupItem value="CASH" id="cash" className="peer sr-only" />
                  <Label
                    htmlFor="cash"
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-amber-500 [&:has([data-state=checked])]:border-amber-500 cursor-pointer"
                  >
                    <Banknote className="h-5 w-5 mb-1" />
                    Cash
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="MPESA" id="mpesa" className="peer sr-only" />
                  <Label
                    htmlFor="mpesa"
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-amber-500 [&:has([data-state=checked])]:border-amber-500 cursor-pointer"
                  >
                    <Smartphone className="h-5 w-5 mb-1" />
                    M-Pesa
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="CARD" id="card" className="peer sr-only" />
                  <Label
                    htmlFor="card"
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-amber-500 [&:has([data-state=checked])]:border-amber-500 cursor-pointer"
                  >
                    <CreditCard className="h-5 w-5 mb-1" />
                    Card
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {paymentMethod === 'MPESA' && (
              <div className="space-y-2">
                <Label htmlFor="reference">M-Pesa Reference</Label>
                <Input
                  id="reference"
                  placeholder="Transaction ID"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
              </div>
            )}

            {paymentMethod === 'CARD' && (
              <div className="space-y-2">
                <Label htmlFor="cardRef">Card Reference</Label>
                <Input
                  id="cardRef"
                  placeholder="Last 4 digits or ref"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                />
              </div>
            )}

            {paymentMethod === 'CASH' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="received">Amount Received</Label>
                  <Input
                    id="received"
                    type="number"
                    placeholder="0"
                    value={amountReceived || ''}
                    onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                  />
                </div>
                {amountReceived >= total && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-sm text-green-500">Change</p>
                    <p className="text-xl font-bold text-green-500">
                      {formatPrice(change)}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="discount">Discount (Optional)</Label>
              <Input
                id="discount"
                type="number"
                placeholder="0"
                value={discount || ''}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-zinc-900"
              onClick={processSale}
              disabled={isProcessing || (paymentMethod === 'CASH' && amountReceived < total)}
            >
              {isProcessing ? 'Processing...' : 'Complete Sale'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Sale Completed
            </DialogTitle>
          </DialogHeader>
          {completedSale && (
            <div className="py-4">
              <div className="bg-white text-black p-4 rounded-lg font-mono text-sm">
                <div className="text-center mb-4">
                  <p className="font-bold text-lg">LSMS</p>
                  <p className="text-xs">Liquor Store</p>
                  <p className="text-xs mt-1">Receipt #: {completedSale.receiptNumber}</p>
                  <p className="text-xs">
                    {new Date(completedSale.createdAt).toLocaleString()}
                  </p>
                </div>
                <Separator className="my-3 bg-black/20" />
                <div className="space-y-1">
                  {completedSale.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-xs">
                      <span>{item.productName} x{item.quantity}</span>
                      <span>{formatPrice(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
                <Separator className="my-3 bg-black/20" />
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatPrice(completedSale.subtotal)}</span>
                  </div>
                  {completedSale.discount > 0 && (
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-{formatPrice(completedSale.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm pt-1">
                    <span>Total:</span>
                    <span>{formatPrice(completedSale.total)}</span>
                  </div>
                </div>
                <Separator className="my-3 bg-black/20" />
                <div className="text-center text-xs">
                  <p>Payment: {completedSale.paymentMethod}</p>
                  <p className="mt-2">Thank you for your business!</p>
                  <p>Please drink responsibly.</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowReceiptDialog(false)}>
              New Sale
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-zinc-900"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
