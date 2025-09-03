import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ShoppingCart as CartIcon, 
  Plus, 
  Trash2, 
  Edit,
  Check,
  X,
  AlertTriangle,
  Download,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { useShoppingList, ShoppingItem } from '@/hooks/useShoppingList';
import { useAuth } from '@/contexts/AuthContext';
import { generateShoppingListPDF, shareShoppingListPDF } from '@/lib/pdf-utils';
import { QuantitySelector } from './QuantitySelector';

export const ShoppingList = () => {
  const { user } = useAuth();
  const { items, loading, addItem, updateItem, removeItem, toggleComplete, clearCompleted } = useShoppingList();
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 1,
    unit: 'pcs',
    currentStock: '',
    notes: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    quantity: 1,
    unit: 'pcs',
    currentStock: '',
    notes: ''
  });

  const handleAddItem = async () => {
    if (!newItem.name.trim()) {
      toast.error('Nama barang harus diisi!');
      return;
    }

    await addItem({
      name: newItem.name.trim(),
      quantity: newItem.quantity || undefined,
      unit: newItem.unit,
      current_stock: newItem.currentStock ? Number(newItem.currentStock) : undefined,
      notes: newItem.notes.trim() || undefined,
      is_completed: false
    });

    setNewItem({ name: '', quantity: 1, unit: 'pcs', currentStock: '', notes: '' });
  };

  const handleRemoveItem = async (id: string) => {
    await removeItem(id);
  };

  const handleToggleComplete = async (id: string) => {
    await toggleComplete(id);
  };

  const startEdit = (item: ShoppingItem) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      quantity: item.quantity || 1,
      unit: item.unit || 'pcs',
      currentStock: item.current_stock?.toString() || '',
      notes: item.notes || ''
    });
  };

  const saveEdit = async () => {
    if (!editForm.name.trim()) {
      toast.error('Nama barang harus diisi!');
      return;
    }

    await updateItem(editingId!, {
      name: editForm.name.trim(),
      quantity: editForm.quantity || undefined,
      unit: editForm.unit,
      current_stock: editForm.currentStock ? Number(editForm.currentStock) : undefined,
      notes: editForm.notes.trim() || undefined
    });

    setEditingId(null);
    setEditForm({ name: '', quantity: 1, unit: 'pcs', currentStock: '', notes: '' });
    toast.success('Item berhasil diperbarui!');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', quantity: 1, unit: 'pcs', currentStock: '', notes: '' });
  };

  const handleClearCompleted = async () => {
    await clearCompleted();
  };

  const handleDownloadPDF = () => {
    const pdf = generateShoppingListPDF(items, user?.email);
    pdf.save('daftar-belanja.pdf');
    toast.success('PDF berhasil diunduh!');
  };

  const handleSharePDF = async () => {
    await shareShoppingListPDF(items, user?.email);
  };

  const pendingItems = items.filter(item => !item.is_completed);
  const completedItems = items.filter(item => item.is_completed);

  if (loading) {
    return <div className="text-center p-4">Memuat daftar belanja...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Add Item Form */}
      <div>
        <Card className="pos-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Tambah ke Daftar Belanja
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="itemName">Nama Barang *</Label>
              <Input
                id="itemName"
                placeholder="Nama barang yang perlu dibeli..."
                value={newItem.name}
                onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              />
            </div>
            
            <div>
              <Label htmlFor="quantity">Jumlah & Unit</Label>
              <QuantitySelector
                quantity={newItem.quantity}
                productName={newItem.name}
                onQuantityChange={(qty) => setNewItem(prev => ({ ...prev, quantity: qty }))}
                showUnitSelector={true}
                allowBulkPricing={false}
              />
            </div>

            <div>
              <Label htmlFor="currentStock">Stok Saat Ini (opsional)</Label>
              <Input
                id="currentStock"
                type="number"
                min="0"
                placeholder="Stok yang tersisa saat ini"
                value={newItem.currentStock}
                onChange={(e) => setNewItem(prev => ({ ...prev, currentStock: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="notes">Catatan (opsional)</Label>
              <Textarea
                id="notes"
                placeholder="Catatan tambahan (merek, ukuran, dll)"
                value={newItem.notes}
                onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>

            <Button onClick={handleAddItem} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Tambah ke Daftar
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Shopping List */}
      <div className="lg:col-span-2">
        <Card className="pos-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CartIcon className="h-5 w-5" />
                Daftar Belanja
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {pendingItems.length} pending
                </Badge>
                {completedItems.length > 0 && (
                  <>
                    <Badge variant="outline">
                      {completedItems.length} selesai
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleClearCompleted}
                    >
                      Hapus Selesai
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDownloadPDF}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleSharePDF}
                    >
                      <Share2 className="h-3 w-3 mr-1" />
                      Bagikan
                    </Button>
                  </>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {items.length === 0 ? (
              <div className="text-center py-8">
                <CartIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  Daftar belanja kosong. Tambahkan barang yang perlu dibeli.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Pending Items */}
                {pendingItems.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      Perlu Dibeli ({pendingItems.length})
                    </h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {pendingItems.map((item) => (
                        <div key={item.id} className="border rounded-lg p-4">
                          {editingId === item.id ? (
                            <div className="space-y-3">
                              <Input
                                value={editForm.name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Nama barang"
                              />
                               <div className="space-y-2">
                                <QuantitySelector
                                  quantity={editForm.quantity}
                                  productName={editForm.name}
                                  onQuantityChange={(qty) => setEditForm(prev => ({ ...prev, quantity: qty }))}
                                  showUnitSelector={true}
                                  allowBulkPricing={false}
                                />
                                <Input
                                  type="number"
                                  value={editForm.currentStock}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, currentStock: e.target.value }))}
                                  placeholder="Stok saat ini"
                                />
                              </div>
                              <Textarea
                                value={editForm.notes}
                                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Catatan"
                                rows={2}
                              />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={saveEdit}>
                                  <Check className="h-3 w-3 mr-1" />
                                  Simpan
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelEdit}>
                                  <X className="h-3 w-3 mr-1" />
                                  Batal
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium">{item.name}</h4>
                                  {item.quantity && (
                                    <Badge variant="outline" className="text-xs">
                                      {item.quantity} {item.unit || 'pcs'}
                                    </Badge>
                                  )}
                                  {item.current_stock !== undefined && (
                                    <Badge variant={item.current_stock <= 5 ? "destructive" : "secondary"} className="text-xs">
                                      Stok: {item.current_stock}
                                    </Badge>
                                  )}
                                </div>
                                {item.notes && (
                                  <p className="text-sm text-muted-foreground mb-2">{item.notes}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  Ditambahkan: {item.created_at.toLocaleDateString('id-ID')}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEdit(item)}
                                  className="h-7 w-7 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleComplete(item.id)}
                                  className="h-7 w-7 p-0"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="h-7 w-7 p-0 text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed Items */}
                {completedItems.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Check className="h-4 w-4 text-success" />
                        Sudah Dibeli ({completedItems.length})
                      </h3>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {completedItems.map((item) => (
                          <div key={item.id} className="border rounded-lg p-3 bg-muted/30">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium line-through text-muted-foreground">{item.name}</h4>
                                   {item.quantity && (
                                    <Badge variant="outline" className="text-xs">
                                      {item.quantity} {item.unit || 'pcs'}
                                    </Badge>
                                  )}
                                </div>
                                {item.notes && (
                                  <p className="text-sm text-muted-foreground">{item.notes}</p>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleComplete(item.id)}
                                  className="h-7 w-7 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRemoveItem(item.id)}
                                  className="h-7 w-7 p-0 text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};