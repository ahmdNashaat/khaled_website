import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { MapPin, Plus, Edit, Trash2, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UserAddress } from '@/types';

const addressSchema = z.object({
  label: z.string().min(2, 'الرجاء إدخال اسم للعنوان').max(100),
  city: z.string().min(2, 'المدينة مطلوبة').max(100),
  area: z.string().min(2, 'المنطقة مطلوبة').max(100),
  street: z.string().min(2, 'اسم الشارع مطلوب').max(200),
  building: z.string().max(50).optional().or(z.literal('')),
  floor: z.string().max(50).optional().or(z.literal('')),
  apartment: z.string().max(50).optional().or(z.literal('')),
  is_default: z.boolean().optional(),
});

type AddressFormState = z.infer<typeof addressSchema>;

interface AddressBookProps {
  userId: string | null | undefined;
  mode?: 'manage' | 'select';
  selectedAddressId?: string | null;
  onSelect?: (address: UserAddress | null) => void;
  onAddressesChange?: (addresses: UserAddress[]) => void;
}

const emptyForm: AddressFormState = {
  label: '',
  city: '',
  area: '',
  street: '',
  building: '',
  floor: '',
  apartment: '',
  is_default: false,
};

const formatAddress = (address: UserAddress) => {
  const parts = [
    `${address.city} - ${address.area}`,
    address.street,
    address.building ? `عمارة ${address.building}` : null,
    address.floor ? `الدور ${address.floor}` : null,
    address.apartment ? `شقة ${address.apartment}` : null,
  ];
  return parts.filter(Boolean).join('، ');
};

const AddressBook = ({
  userId,
  mode = 'manage',
  selectedAddressId,
  onSelect,
  onAddressesChange,
}: AddressBookProps) => {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activeAddress, setActiveAddress] = useState<UserAddress | null>(null);
  const [formState, setFormState] = useState<AddressFormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const hasSelection = mode === 'select';

  const loadAddresses = async () => {
    if (!userId) {
      setAddresses([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching addresses:', error);
      toast.error('حدث خطأ أثناء تحميل العناوين');
      setIsLoading(false);
      return;
    }

    const normalized = (data || []) as UserAddress[];
    setAddresses(normalized);
    onAddressesChange?.(normalized);
    setIsLoading(false);
  };

  useEffect(() => {
    loadAddresses();
  }, [userId]);

  const defaultAddress = useMemo(
    () => addresses.find((address) => address.is_default) || null,
    [addresses]
  );

  const openCreateDialog = () => {
    setActiveAddress(null);
    setFormState({ ...emptyForm, is_default: !defaultAddress });
    setDialogOpen(true);
  };

  const openEditDialog = (address: UserAddress) => {
    setActiveAddress(address);
    setFormState({
      label: address.label,
      city: address.city,
      area: address.area,
      street: address.street,
      building: address.building || '',
      floor: address.floor || '',
      apartment: address.apartment || '',
      is_default: address.is_default,
    });
    setDialogOpen(true);
  };

  const clearDefault = async () => {
    if (!userId) return;

    const { error: resetErr } = await supabase
      .from('user_addresses')
      .update({ is_default: false })
      .eq('user_id', userId);

    if (resetErr) throw resetErr;
  };

  const ensureDefault = async (addressId: string) => {
    if (!userId) return;

    await clearDefault();

    const { error: setErr } = await supabase
      .from('user_addresses')
      .update({ is_default: true })
      .eq('id', addressId)
      .eq('user_id', userId);

    if (setErr) throw setErr;
  };

  const handleSave = async () => {
    if (!userId) {
      toast.error('يجب تسجيل الدخول لإدارة العناوين');
      return;
    }

    const parsed = addressSchema.safeParse(formState);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0]?.message || 'يرجى التحقق من البيانات');
      return;
    }

    setIsSaving(true);
    try {
      if (activeAddress) {
        if (parsed.data.is_default) {
          await clearDefault();
        }
        const { error } = await supabase
          .from('user_addresses')
          .update({
            label: parsed.data.label,
            city: parsed.data.city,
            area: parsed.data.area,
            street: parsed.data.street,
            building: parsed.data.building || null,
            floor: parsed.data.floor || null,
            apartment: parsed.data.apartment || null,
            is_default: parsed.data.is_default || false,
          })
          .eq('id', activeAddress.id)
          .eq('user_id', userId);

        if (error) throw error;
        toast.success('تم تحديث العنوان');
      } else {
        if (parsed.data.is_default) {
          await clearDefault();
        }
        const { error } = await supabase.from('user_addresses').insert({
          user_id: userId,
          label: parsed.data.label,
          city: parsed.data.city,
          area: parsed.data.area,
          street: parsed.data.street,
          building: parsed.data.building || null,
          floor: parsed.data.floor || null,
          apartment: parsed.data.apartment || null,
          is_default: parsed.data.is_default || false,
        });

        if (error) throw error;
        toast.success('تم إضافة العنوان');
      }

      setDialogOpen(false);
      await loadAddresses();
    } catch (error: any) {
      console.error('Error saving address:', error);
      toast.error(error?.message || 'حدث خطأ أثناء حفظ العنوان');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!userId || !activeAddress) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', activeAddress.id)
        .eq('user_id', userId);

      if (error) throw error;
      toast.success('تم حذف العنوان');
      setDeleteDialogOpen(false);
      setActiveAddress(null);
      await loadAddresses();
    } catch (error: any) {
      console.error('Error deleting address:', error);
      toast.error(error?.message || 'حدث خطأ أثناء حذف العنوان');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetDefault = async (address: UserAddress) => {
    if (!userId) return;
    try {
      await ensureDefault(address.id);
      toast.success('تم تعيين العنوان الافتراضي');
      await loadAddresses();
    } catch (error: any) {
      console.error('Error setting default address:', error);
      toast.error(error?.message || 'حدث خطأ أثناء تعيين العنوان الافتراضي');
    }
  };

  const handleSelect = (address: UserAddress) => {
    onSelect?.(address);
  };

  if (!userId) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          يجب تسجيل الدخول لإدارة عناوين التوصيل
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold">دفتر العناوين</h3>
          <p className="text-sm text-muted-foreground">
            أضف أكثر من عنوان واحفظ العنوان الافتراضي للتوصيل السريع.
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="h-4 w-4" />
          إضافة عنوان
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {[1, 2].map((idx) => (
            <div key={idx} className="h-20 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            لا توجد عناوين محفوظة حتى الآن.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {addresses.map((address) => {
              const isSelected = selectedAddressId === address.id;
              return (
                <motion.div
                  key={address.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`border rounded-xl p-4 bg-white ${isSelected ? 'border-primary shadow-md' : ''}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{address.label}</p>
                          {address.is_default && (
                            <Badge variant="secondary">افتراضي</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatAddress(address)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 justify-end">
                      {hasSelection && (
                        <Button
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleSelect(address)}
                        >
                          {isSelected ? 'محدد' : 'اختيار'}
                        </Button>
                      )}
                      {!address.is_default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(address)}
                          className="gap-1"
                        >
                          <Star className="h-4 w-4" />
                          افتراضي
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(address)}
                        className="gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        تعديل
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-destructive hover:text-destructive"
                        onClick={() => {
                          setActiveAddress(address);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        حذف
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{activeAddress ? 'تعديل العنوان' : 'إضافة عنوان جديد'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>اسم العنوان</Label>
              <Input
                value={formState.label}
                onChange={(e) => setFormState({ ...formState, label: e.target.value })}
                placeholder="مثال: المنزل"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>المدينة</Label>
                <Input
                  value={formState.city}
                  onChange={(e) => setFormState({ ...formState, city: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>المنطقة</Label>
                <Input
                  value={formState.area}
                  onChange={(e) => setFormState({ ...formState, area: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>الشارع</Label>
              <Input
                value={formState.street}
                onChange={(e) => setFormState({ ...formState, street: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="grid gap-2">
                <Label>العمارة</Label>
                <Input
                  value={formState.building}
                  onChange={(e) => setFormState({ ...formState, building: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>الدور</Label>
                <Input
                  value={formState.floor}
                  onChange={(e) => setFormState({ ...formState, floor: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>الشقة</Label>
                <Input
                  value={formState.apartment}
                  onChange={(e) => setFormState({ ...formState, apartment: e.target.value })}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={formState.is_default}
                onCheckedChange={(checked) =>
                  setFormState({ ...formState, is_default: Boolean(checked) })
                }
              />
              تعيين كعنوان افتراضي
            </label>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'جاري الحفظ...' : 'حفظ العنوان'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف العنوان</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد أنك تريد حذف هذا العنوان؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'جاري الحذف...' : 'حذف نهائي'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AddressBook;
