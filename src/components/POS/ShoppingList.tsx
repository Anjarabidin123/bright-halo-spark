import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart as CartIcon, 
  Plus, 
  Trash2, 
  Edit,
  Check,
  X,
  AlertTriangle 
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ShoppingItem {
  id: string;
  name: string;
  quantity?: number;
  currentStock?: number;
  notes?: string;
  isCompleted: boolean;
  dateAdded: Date;
}

export const ShoppingList = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: '',
    currentStock: '',
    notes: ''
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    quantity: '',
    currentStock: '',
    notes: ''
  });

  // Load shopping items from database
  useEffect(() => {
    if (user) {
      loadShoppingItems();
    }
  }, [user]);

  const loadShoppingItems = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from('shopping_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedItems: ShoppingItem[] = data.map(item => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity || undefined,
        currentStock: item.current_stock || undefined,
        notes: item.notes || undefined,
        isCompleted: item.is_completed,
        dateAdded: new Date(item.created_at)
      }));

      setItems(formattedItems);
    } catch (error) {
      console.error('Error loading shopping items:', error);
      toast.error('Gagal memuat daftar belanja');
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    if (!newItem.name.trim()) {
      toast.error('Nama barang harus diisi!');
      return;
    }

    if (!user) {
      toast.error('Anda harus login terlebih dahulu!');
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('shopping_items')
        .insert({
          user_id: user.id,
          name: newItem.name.trim(),
          quantity: newItem.quantity ? Number(newItem.quantity) : null,
          current_stock: newItem.currentStock ? Number(newItem.currentStock) : null,
          notes: newItem.notes.trim() || null,
          is_completed: false
        })
        .select()
        .single();

      if (error) throw error;

      const item: ShoppingItem = {
        id: data.id,
        name: data.name,
        quantity: data.quantity || undefined,
        currentStock: data.current_stock || undefined,
        notes: data.notes || undefined,
        isCompleted: data.is_completed,
        dateAdded: new Date(data.created_at)
      };

      setItems(prev => [item, ...prev]);
      setNewItem({ name: '', quantity: '', currentStock: '', notes: '' });
      toast.success('Item berhasil ditambahkan ke daftar belanja!');
    } catch (error) {
      console.error('Error adding shopping item:', error);
      toast.error('Gagal menambahkan item ke daftar belanja');
    }
  };

  const removeItem = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('shopping_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setItems(prev => prev.filter(item => item.id !== id));
      toast.success('Item dihapus dari daftar belanja');
    } catch (error) {
      console.error('Error removing shopping item:', error);
      toast.error('Gagal menghapus item');
    }
  };

  const toggleComplete = async (id: string) => {
    try {
      const item = items.find(i => i.id === id);
      if (!item) return;

      const { error } = await (supabase as any)
        .from('shopping_items')
        .update({ is_completed: !item.isCompleted })
        .eq('id', id);

      if (error) throw error;

      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
      ));
    } catch (error) {
      console.error('Error updating shopping item:', error);
      toast.error('Gagal mengupdate status item');
    }
  };

  const startEdit = (item: ShoppingItem) => {
    setEditingId(item.id);
    setEditForm({
      name: item.name,
      quantity: item.quantity?.toString() || '',
      currentStock: item.currentStock?.toString() || '',
      notes: item.notes || ''
    });
  };

  const saveEdit = async () => {
    if (!editForm.name.trim()) {
      toast.error('Nama barang harus diisi!');
      return;
    }

    if (!editingId) return;

    try {
      const { error } = await (supabase as any)
        .from('shopping_items')
        .update({
          name: editForm.name.trim(),
          quantity: editForm.quantity ? Number(editForm.quantity) : null,
          current_stock: editForm.currentStock ? Number(editForm.currentStock) : null,
          notes: editForm.notes.trim() || null
        })
        .eq('id', editingId);

      if (error) throw error;

      setItems(prev => prev.map(item => 
        item.id === editingId ? {
          ...item,
          name: editForm.name.trim(),
          quantity: editForm.quantity ? Number(editForm.quantity) : undefined,
          currentStock: editForm.currentStock ? Number(editForm.currentStock) : undefined,
          notes: editForm.notes.trim() || undefined
        } : item
      ));

      setEditingId(null);
      setEditForm({ name: '', quantity: '', currentStock: '', notes: '' });
      toast.success('Item berhasil diperbarui!');
    } catch (error) {
      console.error('Error updating shopping item:', error);
      toast.error('Gagal mengupdate item');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: '', quantity: '', currentStock: '', notes: '' });
  };

  const clearCompleted = async () => {
    const completedItems = items.filter(item => item.isCompleted);
    if (completedItems.length === 0) return;

    try {
      const { error } = await (supabase as any)
        .from('shopping_items')
        .delete()
        .in('id', completedItems.map(item => item.id));

      if (error) throw error;

      setItems(prev => prev.filter(item => !item.isCompleted));
      toast.success(`${completedItems.length} item selesai dihapus dari daftar`);
    } catch (error) {
      console.error('Error clearing completed items:', error);
      toast.error('Gagal menghapus item selesai');
    }
  };

  const pendingItems = items.filter(item => !item.isCompleted);
  const completedItems = items.filter(item => item.isCompleted);

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
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
              />
            </div>
            
            <div>
              <Label htmlFor="quantity">Jumlah (opsional)</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="Berapa yang perlu dibeli?"
                value={newItem.quantity}
                onChange={(e) => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
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

            <Button onClick={addItem} className="w-full">
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
                      onClick={clearCompleted}
                    >
                      Hapus Selesai
                    </Button>
                  </>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Memuat daftar belanja...</p>
              </div>
            ) : items.length === 0 ? (
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
                              <div className="grid grid-cols-2 gap-2">
                                <Input
                                  type="number"
                                  value={editForm.quantity}
                                  onChange={(e) => setEditForm(prev => ({ ...prev, quantity: e.target.value }))}
                                  placeholder="Jumlah"
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
                                      Qty: {item.quantity}
                                    </Badge>
                                  )}
                                  {item.currentStock !== undefined && (
                                    <Badge variant={item.currentStock <= 5 ? "destructive" : "secondary"} className="text-xs">
                                      Stok: {item.currentStock}
                                    </Badge>
                                  )}
                                </div>
                                {item.notes && (
                                  <p className="text-sm text-muted-foreground mb-2">{item.notes}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  Ditambahkan: {item.dateAdded.toLocaleDateString('id-ID')}
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
                                  onClick={() => toggleComplete(item.id)}
                                  className="h-7 w-7 p-0"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeItem(item.id)}
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
                                      Qty: {item.quantity}
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
                                  onClick={() => toggleComplete(item.id)}
                                  className="h-7 w-7 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeItem(item.id)}
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