'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  Package,
  AlertTriangle,
  Edit,
  ArrowUpDown,
  History,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  reorderLevel: number;
  isActive: boolean;
  category: { id: string; name: string };
}

interface Category {
  id: string;
  name: string;
}

interface StockMovement {
  id: string;
  type: string;
  quantity: number;
  reason: string | null;
  createdAt: string;
  product: { name: string };
  user: { name: string };
}

export default function InventoryPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const isOwner = session?.user?.role === 'OWNER';

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>('all');

  // Dialogs
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    sku: '',
    barcode: '',
    name: '',
    description: '',
    categoryId: '',
    costPrice: '',
    sellingPrice: '',
    currentStock: '',
    reorderLevel: '10',
  });

  const [stockData, setStockData] = useState({
    type: 'ADJUSTMENT',
    quantity: '',
    reason: '',
  });

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/products/categories'),
      ]);

      if (productsRes.ok) setProducts(await productsRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load inventory data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch stock movements
  const fetchStockMovements = async () => {
    try {
      const res = await fetch('/api/inventory/movements');
      if (res.ok) {
        setStockMovements(await res.json());
      }
    } catch (error) {
      console.error('Error fetching stock movements:', error);
    }
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.sku.toLowerCase().includes(search.toLowerCase()) ||
      (product.barcode && product.barcode.includes(search));

    const matchesCategory =
      categoryFilter === 'all' || product.category.name === categoryFilter;

    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'low' && product.currentStock <= product.reorderLevel) ||
      (stockFilter === 'out' && product.currentStock === 0);

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Open product dialog for editing
  const openProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        sku: product.sku,
        barcode: product.barcode || '',
        name: product.name,
        description: product.description || '',
        categoryId: product.category.id,
        costPrice: product.costPrice.toString(),
        sellingPrice: product.sellingPrice.toString(),
        currentStock: product.currentStock.toString(),
        reorderLevel: product.reorderLevel.toString(),
      });
    } else {
      setEditingProduct(null);
      setFormData({
        sku: '',
        barcode: '',
        name: '',
        description: '',
        categoryId: categories[0]?.id || '',
        costPrice: '',
        sellingPrice: '',
        currentStock: '0',
        reorderLevel: '10',
      });
    }
    setShowProductDialog(true);
  };

  // Save product
  const saveProduct = async () => {
    if (!formData.name || !formData.sku || !formData.categoryId) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const url = editingProduct
        ? `/api/products/${editingProduct.id}`
        : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          costPrice: parseFloat(formData.costPrice) || 0,
          sellingPrice: parseFloat(formData.sellingPrice) || 0,
          currentStock: parseInt(formData.currentStock) || 0,
          reorderLevel: parseInt(formData.reorderLevel) || 10,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save product');
      }

      toast({
        title: 'Success',
        description: editingProduct ? 'Product updated' : 'Product created',
      });
      setShowProductDialog(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save product',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Open stock adjustment dialog
  const openStockDialog = (productId: string) => {
    setSelectedProductId(productId);
    setStockData({ type: 'ADJUSTMENT', quantity: '', reason: '' });
    setShowStockDialog(true);
  };

  // Adjust stock
  const adjustStock = async () => {
    if (!selectedProductId || !stockData.quantity || !stockData.reason) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProductId,
          type: stockData.type,
          quantity: parseInt(stockData.quantity),
          reason: stockData.reason,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to adjust stock');
      }

      toast({
        title: 'Success',
        description: 'Stock adjusted successfully',
      });
      setShowStockDialog(false);
      fetchData();
      fetchStockMovements();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to adjust stock',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return `KES ${price.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground">
            Manage products and stock levels
          </p>
        </div>
        {isOwner && (
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-zinc-900"
            onClick={() => openProductDialog()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        )}
      </div>

      <Tabs defaultValue="products" className="space-y-4">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="movements" onClick={fetchStockMovements}>
            Stock Movements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          {/* Filters */}
          <Card className="bg-card border-border">
            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="All Stock" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="out">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card className="bg-card border-border">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                        <TableHead className="text-right">Reorder Level</TableHead>
                        <TableHead>Status</TableHead>
                        {isOwner && <TableHead className="text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={isOwner ? 9 : 8} className="text-center py-8 text-muted-foreground">
                            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            No products found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProducts.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-mono text-xs">
                              {product.sku}
                            </TableCell>
                            <TableCell className="font-medium">
                              {product.name}
                            </TableCell>
                            <TableCell>{product.category.name}</TableCell>
                            <TableCell className="text-right">
                              {formatPrice(product.costPrice)}
                            </TableCell>
                            <TableCell className="text-right font-medium text-amber-500">
                              {formatPrice(product.sellingPrice)}
                            </TableCell>
                            <TableCell className="text-right">
                              <span
                                className={cn(
                                  'font-medium',
                                  product.currentStock === 0
                                    ? 'text-red-500'
                                    : product.currentStock <= product.reorderLevel
                                    ? 'text-amber-500'
                                    : 'text-foreground'
                                )}
                              >
                                {product.currentStock}
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {product.reorderLevel}
                            </TableCell>
                            <TableCell>
                              {product.currentStock === 0 ? (
                                <Badge variant="destructive">Out of Stock</Badge>
                              ) : product.currentStock <= product.reorderLevel ? (
                                <Badge variant="outline" className="border-amber-500 text-amber-500">
                                  Low Stock
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-green-500 text-green-500">
                                  In Stock
                                </Badge>
                              )}
                            </TableCell>
                            {isOwner && (
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openStockDialog(product.id)}
                                    title="Adjust Stock"
                                  >
                                    <ArrowUpDown className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openProductDialog(product)}
                                    title="Edit"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Stock Movement History
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockMovements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No stock movements yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      stockMovements.map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell className="text-sm">
                            {new Date(movement.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell>{movement.product.name}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                movement.type === 'SALE' && 'border-red-500 text-red-500',
                                movement.type === 'PURCHASE' && 'border-green-500 text-green-500',
                                movement.type === 'ADJUSTMENT' && 'border-amber-500 text-amber-500'
                              )}
                            >
                              {movement.type}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className={cn(
                              'text-right font-medium',
                              movement.quantity > 0 ? 'text-green-500' : 'text-red-500'
                            )}
                          >
                            {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {movement.reason || '-'}
                          </TableCell>
                          <TableCell>{movement.user.name}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product Dialog */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? 'Update product information'
                : 'Add a new product to inventory'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU *</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="JWB-750"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode">Barcode</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="5000267123456"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Johnnie Walker Black 750ml"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product description..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(v) => setFormData({ ...formData, categoryId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price *</Label>
                <Input
                  id="costPrice"
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  placeholder="2500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Selling Price *</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  placeholder="3200"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentStock">Current Stock</Label>
                <Input
                  id="currentStock"
                  type="number"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reorderLevel">Reorder Level</Label>
                <Input
                  id="reorderLevel"
                  type="number"
                  value={formData.reorderLevel}
                  onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                  placeholder="10"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProductDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-zinc-900"
              onClick={saveProduct}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
            <DialogDescription>
              Add or remove stock for this product
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={stockData.type}
                onValueChange={(v) => setStockData({ ...stockData, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                  <SelectItem value="PURCHASE">Purchase (Add)</SelectItem>
                  <SelectItem value="RETURN">Return (Remove)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={stockData.quantity}
                onChange={(e) => setStockData({ ...stockData, quantity: e.target.value })}
                placeholder="Enter quantity (positive or negative)"
              />
              <p className="text-xs text-muted-foreground">
                Use positive numbers to add stock, negative to remove
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                value={stockData.reason}
                onChange={(e) => setStockData({ ...stockData, reason: e.target.value })}
                placeholder="Reason for adjustment..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStockDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-zinc-900"
              onClick={adjustStock}
              disabled={isSaving}
            >
              {isSaving ? 'Processing...' : 'Adjust Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
