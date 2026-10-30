import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { dataService } from '../../services/dataService';
import {
  StudentPoloOrder,
  PoloInventoryConfig,
  PoloColorYear,
  PoloSize,
  PoloItemChoice,
  IFRAN_CLASSES,
} from '../../types';
import {
  generatePoloSupplierOrderPDF,
  generatePoloStudentsListPDF,
} from '../../services/pdfService';
import {
  Shirt,
  Plus,
  Search,
  Download,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Package,
  Edit2,
  Trash2,
  X,
  ShoppingCart,
  Wallet,
  Users,
  Check,
  BarChart3,
  PieChart as PieChartIcon,
  Minus,
  Eye,
  FileCheck2,
  Image as ImageIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const POLO_COLORS: {
  key: PoloColorYear;
  label: string;
  shortLabel: string;
  yearLabel: string;
  swatchClass: string;
  headerBgClass: string;
  badgeTextClass: string;
}[] = [
  {
    key: 'BLANC_1A',
    label: 'Polo Blanc - 1ère année',
    shortLabel: 'Polo Blanc',
    yearLabel: '1ère année',
    swatchClass: 'bg-white border-2 border-slate-300',
    headerBgClass: 'bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700',
    badgeTextClass: 'text-slate-800 dark:text-slate-100',
  },
  {
    key: 'ROUGE_2A',
    label: 'Polo Rouge - 2e année',
    shortLabel: 'Polo Rouge',
    yearLabel: '2e année',
    swatchClass: 'bg-rose-600 border-2 border-rose-300',
    headerBgClass: 'bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/60',
    badgeTextClass: 'text-rose-700 dark:text-rose-300',
  },
  {
    key: 'BLEU_3A',
    label: 'Polo Bleu - 3e année',
    shortLabel: 'Polo Bleu',
    yearLabel: '3e année',
    swatchClass: 'bg-blue-600 border-2 border-blue-300',
    headerBgClass: 'bg-blue-50 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-900/60',
    badgeTextClass: 'text-blue-700 dark:text-blue-300',
  },
];

const POLO_SIZES: PoloSize[] = ['S', 'M', 'L', 'XL', 'XXL', '3XL'];

const formatCurrencyDots = (val: number): string => {
  const rounded = Math.round(val || 0);
  const sign = rounded < 0 ? '-' : '';
  return `${sign}${Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')} FCFA`;
};

// High-contrast custom tooltip for Payment Donut Chart
const PaymentDonutTooltip = ({ active, payload, totalStudents }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    const color = item.payload?.color || '#3b82f6';
    const name = item.name || '';
    const value = item.value || 0;
    const pct = totalStudents > 0 ? Math.round((Number(value) / totalStudents) * 100) : 0;
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-700 shadow-2xl text-xs space-y-1 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
          <span className="font-bold text-slate-100">{name}</span>
        </div>
        <div className="font-mono text-emerald-400 font-extrabold text-sm">
          {value} étudiant(s) <span className="text-slate-400 text-xs font-normal">({pct}%)</span>
        </div>
      </div>
    );
  }
  return null;
};

// High-contrast custom tooltip for Stock Bar Chart
const StockBarChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-700 shadow-2xl text-xs space-y-1.5 pointer-events-none">
        <div className="font-bold text-slate-200 border-b border-slate-800 pb-1">{label}</div>
        {payload.map((entry: any, i: number) => (
          <div key={`entry-${i}`} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-300">{entry.name} :</span>
            </div>
            <span className="font-mono font-bold text-white">{entry.value} polo(s)</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const AdminPolos: React.FC = () => {
  const [orders, setOrders] = useState<StudentPoloOrder[]>([]);
  const [inventory, setInventory] = useState<PoloInventoryConfig>(
    dataService.getDefaultPoloInventory()
  );
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterColor, setFilterColor] = useState<'ALL' | PoloColorYear>('ALL');
  const [filterSize, setFilterSize] = useState<'ALL' | PoloSize>('ALL');
  const [filterPayment, setFilterPayment] = useState<'ALL' | 'PAID' | 'PARTIAL' | 'UNPAID'>('ALL');
  const [filterDelivery, setFilterDelivery] = useState<'ALL' | 'DELIVERED' | 'PENDING_STOCK'>('ALL');

  // Student Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<StudentPoloOrder | null>(null);
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [studentClass, setStudentClass] = useState('B1 Créa');
  const [poloType, setPoloType] = useState<PoloColorYear>('BLANC_1A');
  const [selectedQuantities, setSelectedQuantities] = useState<Record<PoloSize, number>>({
    S: 0,
    M: 1,
    L: 0,
    XL: 0,
    XXL: 0,
    '3XL': 0,
  });
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PARTIAL' | 'UNPAID'>('PAID');
  const [amountPaid, setAmountPaid] = useState<number>(10000);
  const [totalPrice, setTotalPrice] = useState<number>(10000);
  const [deliveryStatus, setDeliveryStatus] = useState<'DELIVERED' | 'PENDING_STOCK'>('DELIVERED');
  const [receiptUrl, setReceiptUrl] = useState<string>('');
  const [selectedReceiptPreview, setSelectedReceiptPreview] = useState<{
    studentName: string;
    url: string;
  } | null>(null);

  // Stock Settings Modal State
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [draftInventory, setDraftInventory] = useState<PoloInventoryConfig>(
    dataService.getDefaultPoloInventory()
  );
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [restockToast, setRestockToast] = useState<string | null>(null);

  // Real-time Subscriptions
  useEffect(() => {
    setLoading(true);
    const unsubOrders = dataService.subscribeToPoloOrders((liveOrders) => {
      setOrders(liveOrders);
      setLoading(false);
    });
    const unsubInv = dataService.subscribeToPoloInventory((liveInv) => {
      setInventory(liveInv);
      setDraftInventory(liveInv);
    });

    return () => {
      if (unsubOrders) unsubOrders();
      if (unsubInv) unsubInv();
    };
  }, []);

  // Stock Matrix Calculations per Color x Size (Unified: demands at 0 physical stock become "To Order")
  const stockMatrix = useMemo(() => {
    const result: Record<
      PoloColorYear,
      Record<
        PoloSize,
        {
          initialStock: number;
          delivered: number;
          available: number;
          toOrder: number;
          status: 'OK' | 'LOW' | 'EMPTY' | 'SHORTAGE';
        }
      >
    > = {
      BLANC_1A: {} as any,
      ROUGE_2A: {} as any,
      BLEU_3A: {} as any,
    };

    POLO_COLORS.forEach(({ key: colorKey }) => {
      POLO_SIZES.forEach((sz) => {
        const initialStock = inventory.stock?.[colorKey]?.[sz] ?? 0;
        let delivered = 0;
        let toOrderCount = 0;

        orders.forEach((o) => {
          if (o.items && o.items.length > 0) {
            o.items.forEach((it) => {
              if (it.color === colorKey && it.size === sz) {
                const q = it.quantity || 1;
                if (o.deliveryStatus === 'DELIVERED') delivered += q;
                else toOrderCount += q;
              }
            });
          } else if (o.poloType === colorKey && o.size === sz) {
            const q = o.quantity || 1;
            if (o.deliveryStatus === 'DELIVERED') delivered += q;
            else toOrderCount += q;
          }
        });

        const available = Math.max(0, initialStock - delivered);
        const totalDemand = delivered + toOrderCount;
        const deficit = Math.max(0, totalDemand - initialStock);
        const toOrder = deficit;

        let status: 'OK' | 'LOW' | 'EMPTY' | 'SHORTAGE' = 'OK';
        if (deficit > 0) {
          status = 'SHORTAGE';
        } else if (available === 0) {
          status = 'EMPTY';
        } else if (available <= (inventory.lowStockThreshold || 3)) {
          status = 'LOW';
        }

        result[colorKey][sz] = {
          initialStock,
          delivered,
          available,
          toOrder,
          status,
        };
      });
    });

    return result;
  }, [orders, inventory]);

  // Global KPIs
  const globalStats = useMemo(() => {
    let totalInitial = 0;
    let totalDelivered = 0;
    let totalAvailable = 0;
    let totalToOrder = 0;
    let outOfStockVariants = 0;
    const itemsToOrderList: {
      colorKey: PoloColorYear;
      colorLabel: string;
      size: PoloSize;
      available: number;
      toOrder: number;
    }[] = [];

    POLO_COLORS.forEach(({ key: colorKey, label: colorLabel }) => {
      POLO_SIZES.forEach((sz) => {
        const cell = stockMatrix[colorKey][sz];
        totalInitial += cell.initialStock;
        totalDelivered += cell.delivered;
        totalAvailable += cell.available;
        totalToOrder += cell.toOrder;
        if (cell.available === 0 || cell.toOrder > 0) {
          outOfStockVariants += 1;
        }
        if (cell.toOrder > 0) {
          itemsToOrderList.push({
            colorKey,
            colorLabel,
            size: sz,
            available: cell.available,
            toOrder: cell.toOrder,
          });
        }
      });
    });

    const totalPaidMoney = orders.reduce((acc, o) => acc + (o.amountPaid || 0), 0);
    const totalUnpaidMoney = orders.reduce(
      (acc, o) => acc + Math.max(0, (o.totalPrice || 0) - (o.amountPaid || 0)),
      0
    );
    const paidCount = orders.filter((o) => o.paymentStatus === 'PAID').length;
    const partialCount = orders.filter((o) => o.paymentStatus === 'PARTIAL').length;
    const unpaidCount = orders.filter((o) => o.paymentStatus === 'UNPAID').length;

    return {
      totalInitial,
      totalDelivered,
      totalAvailable,
      totalToOrder,
      outOfStockVariants,
      itemsToOrderList,
      totalPaidMoney,
      totalUnpaidMoney,
      paidCount,
      partialCount,
      unpaidCount,
    };
  }, [stockMatrix, orders]);

  // Compute total polos count selected in student modal
  const totalModalPolos = useMemo(() => {
    return POLO_SIZES.reduce((sum, sz) => sum + (selectedQuantities[sz] || 0), 0);
  }, [selectedQuantities]);

  // Check if any selected size in modal has stock shortfall
  const hasShortfallInSelection = useMemo(() => {
    return POLO_SIZES.some((sz) => {
      const wanted = selectedQuantities[sz] || 0;
      if (wanted <= 0) return false;
      const avail = stockMatrix[poloType]?.[sz]?.available ?? 0;
      return avail < wanted;
    });
  }, [selectedQuantities, stockMatrix, poloType]);

  // Automatically suggest Polo Color when class changes in add mode
  const handleClassChange = (newClass: string) => {
    setStudentClass(newClass);
    let nextPolo: PoloColorYear = poloType;
    if (newClass.startsWith('B1')) {
      nextPolo = 'BLANC_1A';
    } else if (newClass.startsWith('B2')) {
      nextPolo = 'ROUGE_2A';
    } else if (newClass.startsWith('B3')) {
      nextPolo = 'BLEU_3A';
    }
    setPoloType(nextPolo);

    if (!editingOrder) {
      const anyShortfall = POLO_SIZES.some((sz) => {
        const wanted = selectedQuantities[sz] || 0;
        if (wanted <= 0) return false;
        const avail = stockMatrix[nextPolo]?.[sz]?.available ?? 0;
        return avail < wanted;
      });
      setDeliveryStatus(anyShortfall ? 'PENDING_STOCK' : 'DELIVERED');
    }
  };

  const handlePoloTypeChange = (nextPolo: PoloColorYear) => {
    setPoloType(nextPolo);
    if (!editingOrder) {
      const anyShortfall = POLO_SIZES.some((sz) => {
        const wanted = selectedQuantities[sz] || 0;
        if (wanted <= 0) return false;
        const avail = stockMatrix[nextPolo]?.[sz]?.available ?? 0;
        return avail < wanted;
      });
      setDeliveryStatus(anyShortfall ? 'PENDING_STOCK' : 'DELIVERED');
    }
  };

  const handleAdjustQuantity = (sz: PoloSize, delta: number) => {
    const current = selectedQuantities[sz] || 0;
    const nextVal = Math.max(0, current + delta);
    const updated = {
      ...selectedQuantities,
      [sz]: nextVal,
    };
    setSelectedQuantities(updated);

    const totalQty = POLO_SIZES.reduce((sum, s) => sum + (updated[s] || 0), 0);
    const effectiveQty = totalQty > 0 ? totalQty : 1;
    const unitP = inventory.unitPrice || 10000;
    const newTotal = effectiveQty * unitP;
    setTotalPrice(newTotal);

    if (paymentStatus === 'PAID') {
      setAmountPaid(newTotal);
    }

    if (!editingOrder) {
      const anyShortfall = POLO_SIZES.some((s) => {
        const wanted = updated[s] || 0;
        if (wanted <= 0) return false;
        const avail = stockMatrix[poloType]?.[s]?.available ?? 0;
        return avail < wanted;
      });
      setDeliveryStatus(anyShortfall ? 'PENDING_STOCK' : 'DELIVERED');
    }
  };

  // Recharts Data 1: Stacked Bar Chart (Remis, Disponible, À commander)
  const stockChartData = useMemo(() => {
    return POLO_COLORS.map((colorCfg) => {
      const cells = stockMatrix[colorCfg.key];
      const delivered = POLO_SIZES.reduce((acc, sz) => acc + cells[sz].delivered, 0);
      const available = POLO_SIZES.reduce((acc, sz) => acc + cells[sz].available, 0);
      const toOrder = POLO_SIZES.reduce((acc, sz) => acc + cells[sz].toOrder, 0);
      const initial = POLO_SIZES.reduce((acc, sz) => acc + cells[sz].initialStock, 0);

      return {
        name: `${colorCfg.shortLabel} (${colorCfg.yearLabel})`,
        shortName: colorCfg.yearLabel,
        Remis: delivered,
        Disponible: available,
        'À commander': toOrder,
        initial,
      };
    });
  }, [stockMatrix]);

  // Recharts Data 2: Donut Chart of Global Student Payment Rate
  const paymentChartData = useMemo(() => {
    const totalStudents = orders.length;
    const paidPct = totalStudents > 0 ? Math.round((globalStats.paidCount / totalStudents) * 100) : 0;
    const totalExpectedMoney = globalStats.totalPaidMoney + globalStats.totalUnpaidMoney;
    const moneyRatePct =
      totalExpectedMoney > 0
        ? Math.round((globalStats.totalPaidMoney / totalExpectedMoney) * 100)
        : 0;

    const segments = [
      {
        name: 'Payé',
        value: globalStats.paidCount,
        color: '#10b981',
      },
      {
        name: 'Acompte versé',
        value: globalStats.partialCount,
        color: '#f59e0b',
      },
      {
        name: 'Non payé',
        value: globalStats.unpaidCount,
        color: '#e11d48',
      },
    ];

    const hasData = totalStudents > 0;
    const displaySegments = hasData
      ? segments.filter((s) => s.value > 0)
      : [{ name: 'Aucun étudiant', value: 1, color: '#475569' }];

    return {
      hasData,
      totalStudents,
      paidPct,
      moneyRatePct,
      totalExpectedMoney,
      segments,
      displaySegments,
    };
  }, [orders.length, globalStats]);

  // Adjust single size stock directly (+1 / -1)
  const handleQuickAdjustStock = async (
    colorKey: PoloColorYear,
    sz: PoloSize,
    delta: number
  ) => {
    const currentVal = inventory.stock?.[colorKey]?.[sz] ?? 0;
    const nextVal = Math.max(0, currentVal + delta);
    const updatedInv: PoloInventoryConfig = {
      ...inventory,
      stock: {
        ...inventory.stock,
        [colorKey]: {
          ...inventory.stock[colorKey],
          [sz]: nextVal,
        },
      },
    };
    setInventory(updatedInv);
    await dataService.savePoloInventory(updatedInv);
  };

  // Receive all supplier order quantities into stock at once
  const handleReceiveSupplierOrder = async () => {
    if (globalStats.itemsToOrderList.length === 0) return;
    const nextStock = {
      BLANC_1A: { ...inventory.stock.BLANC_1A },
      ROUGE_2A: { ...inventory.stock.ROUGE_2A },
      BLEU_3A: { ...inventory.stock.BLEU_3A },
    };

    globalStats.itemsToOrderList.forEach((item) => {
      nextStock[item.colorKey][item.size] =
        (nextStock[item.colorKey][item.size] || 0) + item.toOrder;
    });

    const updatedInv: PoloInventoryConfig = {
      ...inventory,
      stock: nextStock,
    };
    setInventory(updatedInv);
    await dataService.savePoloInventory(updatedInv);
    setRestockToast(
      `+${globalStats.totalToOrder} polos ajoutés au stock avec succès !`
    );
    setTimeout(() => setRestockToast(null), 4000);
  };

  // Open Modal for New Student Polo
  const openAddModal = () => {
    setEditingOrder(null);
    setLastName('');
    setFirstName('');
    setStudentClass('B1 Créa');
    setPoloType('BLANC_1A');
    setSelectedQuantities({
      S: 0,
      M: 1,
      L: 0,
      XL: 0,
      XXL: 0,
      '3XL': 0,
    });
    setDate(new Date().toISOString().split('T')[0]);
    const defaultPrice = inventory.unitPrice || 10000;
    setTotalPrice(defaultPrice);
    setPaymentStatus('PAID');
    setAmountPaid(defaultPrice);
    const availForM = stockMatrix['BLANC_1A']['M']?.available ?? 0;
    setDeliveryStatus(availForM > 0 ? 'DELIVERED' : 'PENDING_STOCK');
    setNotes('');
    setReceiptUrl('');
    setIsModalOpen(true);
  };

  // Open Modal to Edit Existing Student Polo
  const openEditModal = (order: StudentPoloOrder) => {
    setEditingOrder(order);
    setLastName(order.lastName);
    setFirstName(order.firstName);
    setStudentClass(order.studentClass);
    setPoloType(order.poloType);

    const initialQ: Record<PoloSize, number> = {
      S: 0,
      M: 0,
      L: 0,
      XL: 0,
      XXL: 0,
      '3XL': 0,
    };
    if (order.items && order.items.length > 0) {
      order.items.forEach((it) => {
        initialQ[it.size] = (initialQ[it.size] || 0) + (it.quantity || 1);
      });
    } else {
      initialQ[order.size || 'M'] = order.quantity || 1;
    }
    setSelectedQuantities(initialQ);

    setDate(order.date);
    setPaymentStatus(order.paymentStatus);
    setAmountPaid(order.amountPaid);
    setTotalPrice(order.totalPrice || inventory.unitPrice || 10000);
    setDeliveryStatus(order.deliveryStatus);
    setNotes(order.notes || '');
    setReceiptUrl(order.receiptUrl || '');
    setIsModalOpen(true);
  };

  // Keep payment amount synced when paymentStatus radio changes
  const handlePaymentStatusChange = (newStatus: 'PAID' | 'PARTIAL' | 'UNPAID') => {
    setPaymentStatus(newStatus);
    if (newStatus === 'PAID') {
      setAmountPaid(totalPrice);
    } else if (newStatus === 'UNPAID') {
      setAmountPaid(0);
    } else if (newStatus === 'PARTIAL' && (amountPaid === 0 || amountPaid >= totalPrice)) {
      setAmountPaid(Math.round(totalPrice / 2));
    }
  };

  // Save Student Order
  const handleSaveStudentOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastName.trim() || !firstName.trim()) return;

    const items: PoloItemChoice[] = POLO_SIZES.filter(
      (sz) => (selectedQuantities[sz] || 0) > 0
    ).map((sz) => ({
      color: poloType,
      size: sz,
      quantity: selectedQuantities[sz],
    }));

    const effectiveQty = totalModalPolos > 0 ? totalModalPolos : 1;
    const primarySize: PoloSize = items[0]?.size || 'M';

    const cleanAmountPaid =
      paymentStatus === 'PAID'
        ? totalPrice
        : paymentStatus === 'UNPAID'
        ? 0
        : Math.min(totalPrice, Math.max(0, Number(amountPaid) || 0));

    const payload: Omit<StudentPoloOrder, 'id'> = {
      lastName: lastName.trim(),
      firstName: firstName.trim(),
      studentClass: studentClass.trim() || 'Non précisée',
      poloType,
      size: primarySize,
      quantity: effectiveQty,
      items,
      date,
      paymentStatus,
      amountPaid: cleanAmountPaid,
      totalPrice: Number(totalPrice) || (inventory.unitPrice || 10000),
      deliveryStatus,
      notes: notes.trim(),
      receiptUrl: receiptUrl.trim() || undefined,
    };

    let updatedList: StudentPoloOrder[];
    if (editingOrder) {
      updatedList = await dataService.updatePoloOrder({
        ...payload,
        id: editingOrder.id,
      });
    } else {
      updatedList = await dataService.addPoloOrder(payload);
    }
    setOrders(updatedList);
    setIsModalOpen(false);
    setRestockToast(
      editingOrder
        ? `Commande mise à jour pour ${payload.firstName} ${payload.lastName} (${payload.studentClass}) !`
        : `Nouvelle commande enregistrée pour ${payload.firstName} ${payload.lastName} (${payload.studentClass}) !`
    );
    setTimeout(() => setRestockToast(null), 4000);
  };

  // Quick 1-click toggles in student table
  const handleTogglePaid = async (order: StudentPoloOrder) => {
    const nextStatus = order.paymentStatus === 'PAID' ? 'UNPAID' : 'PAID';
    const nextAmount = nextStatus === 'PAID' ? order.totalPrice || 10000 : 0;
    const updated = {
      ...order,
      paymentStatus: nextStatus,
      amountPaid: nextAmount,
    };
    setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
    await dataService.updatePoloOrder(updated);
  };

  const handleToggleDelivered = async (order: StudentPoloOrder) => {
    const nextDelivery =
      order.deliveryStatus === 'DELIVERED' ? 'PENDING_STOCK' : 'DELIVERED';
    const updated = {
      ...order,
      deliveryStatus: nextDelivery,
    };
    setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
    await dataService.updatePoloOrder(updated);
  };

  const handleConfirmDelete = async (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
    await dataService.deletePoloOrder(id);
    setDeleteConfirmId(null);
  };

  // Save Full Stock Configuration Modal
  const handleSaveStockModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setInventory(draftInventory);
    await dataService.savePoloInventory(draftInventory);
    setIsStockModalOpen(false);
    setRestockToast('Stock mis à jour avec succès en temps réel !');
    setTimeout(() => setRestockToast(null), 4000);
  };

  // Filtered Student List
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchName =
          o.lastName.toLowerCase().includes(q) ||
          o.firstName.toLowerCase().includes(q) ||
          `${o.lastName} ${o.firstName}`.toLowerCase().includes(q) ||
          `${o.firstName} ${o.lastName}`.toLowerCase().includes(q) ||
          o.studentClass.toLowerCase().includes(q) ||
          (o.phone && o.phone.toLowerCase().includes(q));
        if (!matchName) return false;
      }
      if (filterColor !== 'ALL' && o.poloType !== filterColor) return false;
      if (filterSize !== 'ALL') {
        const hasSize =
          o.items && o.items.length > 0
            ? o.items.some((it) => it.size === filterSize)
            : o.size === filterSize;
        if (!hasSize) return false;
      }
      if (filterPayment !== 'ALL' && o.paymentStatus !== filterPayment) return false;
      if (filterDelivery !== 'ALL' && o.deliveryStatus !== filterDelivery) return false;
      return true;
    });
  }, [orders, searchQuery, filterColor, filterSize, filterPayment, filterDelivery]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Nom',
      'Prénom(s)',
      'Classe',
      'Polo (Couleur / Année)',
      'Tailles & Quantités',
      'Nombre Total',
      'Date',
      'Statut Paiement',
      'Montant Payé (FCFA)',
      'Prix Total (FCFA)',
      'Reste à Payer (FCFA)',
      'Statut Remise',
      'Notes',
    ];

    const rows = filteredOrders.map((o) => {
      const poloLabel =
        POLO_COLORS.find((c) => c.key === o.poloType)?.label || o.poloType;
      const sizeStr =
        o.items && o.items.length > 0
          ? o.items.map((it) => `${it.quantity}x${it.size}`).join(' + ')
          : o.size;
      const totalQty = o.quantity || 1;
      const payText =
        o.paymentStatus === 'PAID'
          ? 'Payé'
          : o.paymentStatus === 'PARTIAL'
          ? 'Acompte'
          : 'Non payé';
      const delivText =
        o.deliveryStatus === 'DELIVERED' ? 'Polo remis' : 'À commander';
      const remaining = Math.max(0, (o.totalPrice || 0) - (o.amountPaid || 0));

      return [
        `"${o.lastName.replace(/"/g, '""')}"`,
        `"${o.firstName.replace(/"/g, '""')}"`,
        `"${o.studentClass.replace(/"/g, '""')}"`,
        `"${poloLabel}"`,
        `"${sizeStr}"`,
        totalQty,
        o.date,
        payText,
        o.amountPaid,
        o.totalPrice,
        remaining,
        delivText,
        `"${(o.notes || '').replace(/"/g, '""')}"`,
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Suivi_Polos_Etudiants_IFRAN_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2.5 text-xs font-semibold text-bde-rose mb-1">
              <span>Administration IFRAN</span>
              <span>·</span>
              <span>Gestion Polos & Stocks</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <Shirt className="text-bde-rose shrink-0" size={28} />
              <span>Suivi des Polos Étudiants & Gestion des Stocks</span>
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Enregistrement des demandes étudiantes (multi-polos / multi-tailles), suivi des paiements et calcul automatique des polos à commander.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setDraftInventory(inventory);
                setIsStockModalOpen(true);
              }}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Package size={16} />
              <span>Configurer le Stock</span>
            </button>

            <button
              onClick={() => generatePoloSupplierOrderPDF(orders, inventory)}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <ShoppingCart size={16} className="text-bde-rose" />
              <span>Bon de Commande PDF</span>
            </button>

            <button
              onClick={openAddModal}
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-bde-rose text-white hover:bg-rose-700 transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Plus size={16} />
              <span>Enregistrer un Étudiant</span>
            </button>
          </div>
        </div>

        {restockToast && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} />
              <span>{restockToast}</span>
            </div>
            <button onClick={() => setRestockToast(null)}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* 4 Summary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Étudiants Enregistrés</span>
              <Users size={16} className="text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
              {orders.length}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {globalStats.totalDelivered} remis
              </span>
              <span>·</span>
              <span className="text-rose-600 dark:text-rose-400 font-semibold">
                {globalStats.totalToOrder} à commander
              </span>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Stock Physique Disponible</span>
              <Package size={16} className="text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
              {globalStats.totalAvailable}{' '}
              <span className="text-xs font-normal text-slate-500">
                / {globalStats.totalInitial} appro.
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              <span>Approvisionnement initial total : </span>
              <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                {globalStats.totalInitial} polo(s)
              </strong>
            </div>
          </div>

          <div
            className={`p-5 rounded-xl border ${
              globalStats.totalToOrder > 0
                ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                : 'bg-white dark:bg-[#131b2e] border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-300">
              <span>Polos à Commander</span>
              <AlertTriangle
                size={16}
                className={
                  globalStats.totalToOrder > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-400'
                }
              />
            </div>
            <div
              className={`mt-2 text-2xl font-extrabold font-mono tabular-nums ${
                globalStats.totalToOrder > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {globalStats.totalToOrder} polo(s)
            </div>
            <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              {globalStats.itemsToOrderList.length > 0 ? (
                <span>
                  Besoin calculé sur{' '}
                  <strong className="font-mono tabular-nums">
                    {globalStats.itemsToOrderList.length}
                  </strong>{' '}
                  référence(s) précise(s)
                </span>
              ) : (
                <span>Aucun besoin de réapprovisionnement</span>
              )}
            </div>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Encaissements Polos</span>
              <Wallet size={16} className="text-slate-400" />
            </div>
            <div className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
              {formatCurrencyDots(globalStats.totalPaidMoney)}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              <span>Reste à percevoir :</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400">
                {formatCurrencyDots(globalStats.totalUnpaidMoney)}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Analytics Section: Stock Distribution & Payment Rate */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Chart 1: Stacked Bar Chart */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 size={17} className="text-bde-rose shrink-0" />
                  <span>Répartition des Stocks & Demandes par Année</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Comparaison temps réel : Polos remis, Stock physique disponible et Polos à commander.
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                Total appro. : {globalStats.totalInitial}
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stockChartData}
                  margin={{ top: 10, right: 16, left: -12, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#334155"
                    opacity={0.25}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                    axisLine={{ stroke: '#334155', opacity: 0.3 }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<StockBarChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar
                    dataKey="Remis"
                    stackId="poloStack"
                    fill="#10b981"
                    radius={[0, 0, 4, 4]}
                    barSize={42}
                  />
                  <Bar
                    dataKey="Disponible"
                    stackId="poloStack"
                    fill="#3b82f6"
                    barSize={42}
                  />
                  <Bar
                    dataKey="À commander"
                    stackId="poloStack"
                    fill="#f43f5e"
                    radius={[4, 4, 0, 0]}
                    barSize={42}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Donut Chart - Global Payment Rate */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <PieChartIcon size={17} className="text-bde-rose shrink-0" />
                  <span>Taux de Paiement Global des Étudiants</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Répartition des étudiants selon leur statut de règlement (Payé, Acompte, Non payé).
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                {paymentChartData.moneyRatePct}% encaissé
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4 my-auto">
              <div className="h-56 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentChartData.displaySegments}
                      cx="50%"
                      cy="50%"
                      innerRadius={58}
                      outerRadius={82}
                      paddingAngle={paymentChartData.hasData ? 3 : 0}
                      dataKey="value"
                      stroke="none"
                    >
                      {paymentChartData.displaySegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    {paymentChartData.hasData && (
                      <Tooltip
                        content={
                          <PaymentDonutTooltip totalStudents={paymentChartData.totalStudents} />
                        }
                      />
                    )}
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                    {paymentChartData.paidPct}%
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Soldé (Payé)
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                {paymentChartData.segments.map((seg) => {
                  const pct =
                    paymentChartData.totalStudents > 0
                      ? Math.round(
                          (seg.value / paymentChartData.totalStudents) * 100
                        )
                      : 0;
                  return (
                    <div
                      key={seg.name}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-sm shrink-0"
                          style={{ backgroundColor: seg.color }}
                        />
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {seg.name}
                        </span>
                      </div>
                      <div className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        {seg.value} étud.{' '}
                        <span className="text-slate-400 font-normal">
                          ({pct}%)
                        </span>
                      </div>
                    </div>
                  );
                })}

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono tabular-nums">
                  <span className="text-slate-500">Total attendu :</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrencyDots(paymentChartData.totalExpectedMoney)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Real-time Stock Matrix */}
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              01. État du Stock par Couleur (Année) et Taille (S à 3XL)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ajustez le stock approvisionné avec les boutons <code className="font-mono">-</code> / <code className="font-mono">+</code> ou via « Configurer le Stock ». Les polos à commander se calculent automatiquement à partir des demandes étudiantes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {POLO_COLORS.map((colorCfg) => {
              const colorCells = stockMatrix[colorCfg.key];
              const totalColorAvailable = POLO_SIZES.reduce(
                (acc, sz) => acc + colorCells[sz].available,
                0
              );
              const totalColorDelivered = POLO_SIZES.reduce(
                (acc, sz) => acc + colorCells[sz].delivered,
                0
              );
              const totalColorToOrder = POLO_SIZES.reduce(
                (acc, sz) => acc + colorCells[sz].toOrder,
                0
              );

              return (
                <div
                  key={colorCfg.key}
                  className="rounded-xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
                >
                  {/* Card Header (stays strictly on 1 single line) */}
                  <div className={`p-3.5 sm:p-4 ${colorCfg.headerBgClass} flex items-center justify-between gap-2`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-4 h-4 rounded shrink-0 ${colorCfg.swatchClass}`}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <h3 className={`text-xs sm:text-sm font-extrabold truncate ${colorCfg.badgeTextClass}`}>
                          {colorCfg.label}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                          {totalColorAvailable} dispo · {totalColorDelivered} remis
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {totalColorToOrder > 0 ? (
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums whitespace-nowrap shrink-0">
                          À commander : {totalColorToOrder}
                        </span>
                      ) : totalColorAvailable === 0 ? (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 whitespace-nowrap shrink-0">
                          Épuisé
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 whitespace-nowrap shrink-0">
                          En stock
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sizes Table (Clean 5 columns without redundant 'Attente' column) */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/40">
                          <th className="py-2.5 px-3 font-semibold">Taille</th>
                          <th className="py-2.5 px-2 font-semibold text-center">Appro.</th>
                          <th className="py-2.5 px-2 font-semibold text-center">Remis</th>
                          <th className="py-2.5 px-2 font-semibold text-center">Dispo</th>
                          <th className="py-2.5 px-3 font-semibold text-right whitespace-nowrap">À Commander</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70 font-mono tabular-nums">
                        {POLO_SIZES.map((sz) => {
                          const cell = colorCells[sz];
                          const isShortage = cell.status === 'SHORTAGE';
                          const isEmpty = cell.status === 'EMPTY';
                          const isLow = cell.status === 'LOW';

                          return (
                            <tr
                              key={sz}
                              className={
                                isShortage
                                  ? 'bg-rose-50/70 dark:bg-rose-950/30'
                                  : isEmpty
                                  ? 'bg-amber-50/40 dark:bg-amber-950/20'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                              }
                            >
                              <td className="py-2.5 px-3 font-extrabold text-slate-900 dark:text-white">
                                {sz}
                              </td>

                              {/* Adjustable Initial Stock */}
                              <td className="py-2 px-2 text-center">
                                <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg px-1.5 py-0.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleQuickAdjustStock(colorCfg.key, sz, -1)
                                    }
                                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold"
                                    title="Diminuer le stock initial"
                                  >
                                    -
                                  </button>
                                  <span className="w-6 text-center font-semibold text-slate-800 dark:text-slate-200">
                                    {cell.initialStock}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleQuickAdjustStock(colorCfg.key, sz, 1)
                                    }
                                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold"
                                    title="Augmenter le stock initial"
                                  >
                                    +
                                  </button>
                                </div>
                              </td>

                              <td className="py-2.5 px-2 text-center text-slate-600 dark:text-slate-400">
                                {cell.delivered}
                              </td>

                              <td
                                className={`py-2.5 px-2 text-center font-bold ${
                                  cell.available === 0
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : isLow
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                }`}
                              >
                                {cell.available}
                              </td>

                              <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                {cell.toOrder > 0 ? (
                                  <span className="font-extrabold text-rose-600 dark:text-rose-400">
                                    +{cell.toOrder} à cmd
                                  </span>
                                ) : (
                                  <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                                    0
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Automatic Restock / Supplier Order Calculator */}
        <div className="rounded-xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingCart size={18} className="text-bde-rose" />
                <span>
                  02. Calculateur de Commande Fournisseur (Polos à Commander)
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Liste précise du nombre de polos à commander par couleur et par taille pour satisfaire toutes les demandes étudiantes.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {globalStats.itemsToOrderList.length > 0 && (
                <button
                  onClick={handleReceiveSupplierOrder}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
                >
                  <Check size={15} />
                  <span>
                    Réceptionner ces +{globalStats.totalToOrder} polos dans le stock
                  </span>
                </button>
              )}

              <button
                onClick={() => generatePoloSupplierOrderPDF(orders, inventory)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Download size={15} />
                <span>Exporter le Bon de Commande PDF</span>
              </button>
            </div>
          </div>

          {globalStats.itemsToOrderList.length === 0 ? (
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
              <span>
                Aucun polo à commander actuellement : toutes les demandes enregistrées ont été remises ou le stock disponible est suffisant.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {globalStats.itemsToOrderList.map((item) => (
                <div
                  key={`${item.colorKey}_${item.size}`}
                  className="p-3.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.colorLabel}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
                      Taille <strong>{item.size}</strong> · Stock dispo : {item.available}
                    </div>
                  </div>
                  <div className="text-right font-mono tabular-nums shrink-0">
                    <div className="text-sm font-extrabold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      {item.toOrder} à commander
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Student Polo Distribution & Payment Registry */}
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                03. Registre des Étudiants — Prise de Polos & Suivi des Paiements
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Cliquez directement sur le statut de paiement ou de remise d'un étudiant pour le basculer en 1 clic.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => generatePoloStudentsListPDF(filteredOrders)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Download size={15} />
                <span>Exporter Liste PDF</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <FileSpreadsheet size={15} className="text-emerald-600" />
                <span>Exporter Excel / CSV</span>
              </button>
            </div>
          </div>

          {/* Search & Multi-filter Bar */}
          <div className="p-4 rounded-xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nom, prénom ou classe..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-bde-rose"
              />
            </div>

            <select
              value={filterColor}
              onChange={(e) => setFilterColor(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="ALL">Toutes les Couleurs / Années</option>
              <option value="BLANC_1A">Polo Blanc - 1ère année</option>
              <option value="ROUGE_2A">Polo Rouge - 2e année</option>
              <option value="BLEU_3A">Polo Bleu - 3e année</option>
            </select>

            <select
              value={filterSize}
              onChange={(e) => setFilterSize(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="ALL">Toutes les Tailles (S à 3XL)</option>
              {POLO_SIZES.map((sz) => (
                <option key={sz} value={sz}>
                  Taille {sz}
                </option>
              ))}
            </select>

            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="ALL">Tous les Paiements</option>
              <option value="PAID">Payé uniquement ({globalStats.paidCount})</option>
              <option value="PARTIAL">Acompte versé ({globalStats.partialCount})</option>
              <option value="UNPAID">Non payé ({globalStats.unpaidCount})</option>
            </select>

            <select
              value={filterDelivery}
              onChange={(e) => setFilterDelivery(e.target.value as any)}
              className="px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
            >
              <option value="ALL">Tous les Statuts de Remise</option>
              <option value="DELIVERED">Polo déjà remis ({globalStats.totalDelivered})</option>
              <option value="PENDING_STOCK">À commander ({globalStats.totalToOrder})</option>
            </select>
          </div>

          {/* Student Polo Table */}
          <div className="rounded-xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 overflow-hidden">
            {loading ? (
              <div className="p-10 text-center text-sm text-slate-500">
                Synchronisation temps réel des données Polos en cours...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Shirt size={36} className="mx-auto text-slate-400" />
                <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Aucun étudiant enregistré pour ces critères
                </div>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Enregistrez chaque étudiant qui commande ou réserve ses polos pour suivre les tailles, les paiements et le stock en temps réel.
                </p>
                <button
                  onClick={openAddModal}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-bde-rose text-white hover:bg-rose-700 transition-colors inline-flex items-center gap-2"
                >
                  <Plus size={15} />
                  <span>Enregistrer le premier étudiant</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-900/50">
                      <th className="py-3 px-4 font-semibold">Nom & Prénom(s)</th>
                      <th className="py-3 px-3 font-semibold">Classe</th>
                      <th className="py-3 px-3 font-semibold">Polo (Couleur / Année)</th>
                      <th className="py-3 px-3 font-semibold text-center">Tailles & Quantités</th>
                      <th className="py-3 px-3 font-semibold text-center">Date & Heure</th>
                      <th className="py-3 px-3 font-semibold">Paiement</th>
                      <th className="py-3 px-3 font-semibold text-center">Reçu</th>
                      <th className="py-3 px-3 font-semibold">Remise du Polo</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/70">
                    {filteredOrders.map((order) => {
                      const colorObj = POLO_COLORS.find(
                        (c) => c.key === order.poloType
                      );
                      const remaining = Math.max(
                        0,
                        (order.totalPrice || 0) - (order.amountPaid || 0)
                      );

                      return (
                        <tr
                          key={order.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">
                              {order.lastName.toUpperCase()} {order.firstName}
                            </div>
                            {order.phone && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                                Tél: {order.phone}
                              </div>
                            )}
                            {order.notes && !order.notes.startsWith('Tél:') && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {order.notes}
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                            {order.studentClass}
                          </td>

                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-3.5 h-3.5 rounded shrink-0 ${
                                  colorObj?.swatchClass || 'bg-slate-400'
                                }`}
                              />
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {colorObj?.label || order.poloType}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-3 text-center">
                            {order.items && order.items.length > 0 ? (
                              <div className="space-y-0.5">
                                <div className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                                  {order.items
                                    .map((it) => `${it.quantity}× ${it.size}`)
                                    .join(', ')}
                                </div>
                                {order.quantity && order.quantity > 1 && (
                                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                                    ({order.quantity} polos au total)
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white">
                                {order.size}
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-600 dark:text-slate-400">
                            {order.date ? (
                              <div className="leading-tight">
                                <div>
                                  {new Date(order.date).toLocaleDateString('fr-FR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                  })}
                                </div>
                                {order.date.includes('T') && (
                                  <div className="text-[10px] text-slate-400 font-normal">
                                    {new Date(order.date).toLocaleTimeString('fr-FR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </div>
                                )}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => handleTogglePaid(order)}
                              title="Cliquer pour basculer Payé / Non payé"
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 font-mono tabular-nums ${
                                order.paymentStatus === 'PAID'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : order.paymentStatus === 'PARTIAL'
                                  ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                  : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              }`}
                            >
                              {order.paymentStatus === 'PAID' ? (
                                <>
                                  <CheckCircle2 size={13} />
                                  <span>Payé ({formatCurrencyDots(order.amountPaid)})</span>
                                </>
                              ) : order.paymentStatus === 'PARTIAL' ? (
                                <>
                                  <Clock size={13} />
                                  <span>
                                    Acompte {formatCurrencyDots(order.amountPaid)} (Reste{' '}
                                    {formatCurrencyDots(remaining)})
                                  </span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle size={13} />
                                  <span>Non payé</span>
                                </>
                              )}
                            </button>
                          </td>

                          <td className="py-3 px-3 text-center">
                            {order.receiptUrl ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setSelectedReceiptPreview({
                                    studentName: `${order.lastName.toUpperCase()} ${order.firstName}`,
                                    url: order.receiptUrl!,
                                  })
                                }
                                className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-800 transition-colors inline-flex items-center gap-1 font-semibold text-[11px]"
                                title="Voir le reçu de paiement"
                              >
                                <Eye size={12} />
                                <span>Voir reçu</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                Aucun
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => handleToggleDelivered(order)}
                              title="Cliquer pour basculer Polo remis / À commander"
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 ${
                                order.deliveryStatus === 'DELIVERED'
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
                                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                              }`}
                            >
                              {order.deliveryStatus === 'DELIVERED' ? (
                                <>
                                  <Check size={13} className="text-emerald-600" />
                                  <span>Polo remis</span>
                                </>
                              ) : (
                                <>
                                  <Clock size={13} />
                                  <span>À commander</span>
                                </>
                              )}
                            </button>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEditModal(order)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Modifier"
                              >
                                <Edit2 size={15} />
                              </button>

                              {deleteConfirmId === order.id ? (
                                <div className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-800">
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmDelete(order.id)}
                                    className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline"
                                  >
                                    Confirmer
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="text-[11px] text-slate-500 px-1"
                                  >
                                    Annuler
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(order.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal 1: Add / Edit Student Polo Order (Multi-Polos & Multi-Tailles) - Fully Responsive max-h-[92vh] */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Sticky Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-[#131b2e] z-10">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Shirt size={20} className="text-bde-rose shrink-0" />
                <span className="truncate">
                  {editingOrder
                    ? "Modifier la commande de Polo"
                    : 'Enregistrer la commande de Polo'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="student-polo-form" onSubmit={handleSaveStudentOrder} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nom de l'étudiant *
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ex: KOUASSI"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-bde-rose"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Prénom(s) *
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ex: Jean-Marc"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-bde-rose"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Classe / Filière *
                  </label>
                  <select
                    required
                    value={studentClass}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-bde-rose focus:border-bde-rose transition-colors"
                  >
                    <option value="" disabled>-- Sélectionner la classe --</option>
                    {IFRAN_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    {studentClass && !IFRAN_CLASSES.includes(studentClass as any) && (
                      <option value={studentClass}>{studentClass} (Personnalisée)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date de commande / prise *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-bde-rose"
                  />
                </div>
              </div>

              {/* Polo Color / Year Selection */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Couleur du Polo & Année *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {POLO_COLORS.map((c) => {
                    const isSelected = poloType === c.key;
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => handlePoloTypeChange(c.key)}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-2 ${
                          isSelected
                            ? 'border-bde-rose bg-rose-50/60 dark:bg-rose-950/40 font-bold text-slate-900 dark:text-white ring-1 ring-bde-rose'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <span
                          className={`w-3.5 h-3.5 rounded shrink-0 ${c.swatchClass}`}
                        />
                        <div className="leading-tight min-w-0">
                          <div className="text-xs font-bold truncate">{c.shortLabel}</div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {c.yearLabel}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Multi-Size Selection with Quantity Steppers */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Tailles et Quantités souhaitées *
                  </label>
                  <span className="font-mono text-xs font-bold text-bde-rose">
                    Total : {totalModalPolos} polo(s)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {POLO_SIZES.map((sz) => {
                    const count = selectedQuantities[sz] || 0;
                    const avail = stockMatrix[poloType]?.[sz]?.available ?? 0;
                    const isShortage = count > 0 && avail < count;

                    return (
                      <div
                        key={sz}
                        className={`p-2 rounded-xl border transition-all flex flex-col justify-between ${
                          count > 0
                            ? 'border-bde-rose bg-rose-50/30 dark:bg-rose-950/20'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                            Taille {sz}
                          </span>
                          <span
                            className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                              avail === 0
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {avail} dispo
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                          <span className="text-[10px] text-slate-500">Qté :</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleAdjustQuantity(sz, -1)}
                              disabled={count <= 0}
                              className="w-5 h-5 flex items-center justify-center rounded-md border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
                            >
                              <Minus size={11} />
                            </button>
                            <span className="w-5 text-center font-mono font-bold text-xs text-slate-900 dark:text-white">
                              {count}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdjustQuantity(sz, 1)}
                              className="w-5 h-5 flex items-center justify-center rounded-md bg-bde-rose text-white hover:bg-rose-700 transition-colors"
                            >
                              <Plus size={11} />
                            </button>
                          </div>
                        </div>

                        {isShortage && (
                          <div className="mt-1 text-[9px] font-semibold text-rose-600 dark:text-rose-400">
                            À commander ({count - avail} manquant{count - avail > 1 ? 's' : ''})
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Alerte contextuelle si rupture de stock physique */}
              {hasShortfallInSelection && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
                  <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="leading-tight">
                    <span className="font-bold">Rupture de stock physique sur les tailles sélectionnées.</span>
                    <p className="text-[11px] mt-0.5 opacity-90">
                      Les quantités manquantes s'ajouteront automatiquement dans <strong>« Polos à commander »</strong> pour la commande fournisseur.
                    </p>
                  </div>
                </div>
              )}

              {/* Payment Status & Amounts */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Statut du Paiement *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePaymentStatusChange('PAID')}
                    className={`py-1.5 px-2.5 rounded-lg font-semibold border transition-colors text-xs ${
                      paymentStatus === 'PAID'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Payé
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePaymentStatusChange('PARTIAL')}
                    className={`py-1.5 px-2.5 rounded-lg font-semibold border transition-colors text-xs ${
                      paymentStatus === 'PARTIAL'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Acompte versé
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePaymentStatusChange('UNPAID')}
                    className={`py-1.5 px-2.5 rounded-lg font-semibold border transition-colors text-xs ${
                      paymentStatus === 'UNPAID'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Non payé
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Montant payé (FCFA)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                      disabled={paymentStatus !== 'PARTIAL'}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono disabled:opacity-60 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Prix Total Calculé (FCFA)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={totalPrice}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setTotalPrice(val);
                        if (paymentStatus === 'PAID') setAmountPaid(val);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Physical Delivery Status */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Remise physique du Polo *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryStatus('DELIVERED')}
                    className={`py-2 px-3 rounded-xl font-semibold border transition-colors flex items-center justify-center gap-1.5 text-xs ${
                      deliveryStatus === 'DELIVERED'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <CheckCircle2 size={14} />
                    <span>Polos déjà remis</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryStatus('PENDING_STOCK')}
                    className={`py-2 px-3 rounded-xl font-semibold border transition-colors flex items-center justify-center gap-1.5 text-xs ${
                      deliveryStatus === 'PENDING_STOCK'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Clock size={14} />
                    <span>À commander</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observation / Note (Optionnel)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Paiement Mobile Money Wave, demande spécifique..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                />
              </div>
            </form>

            {/* Sticky Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5 shrink-0 bg-slate-50/90 dark:bg-slate-900/90 z-10">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                form="student-polo-form"
                className="px-5 py-2 rounded-xl bg-bde-rose text-white font-bold text-xs hover:bg-rose-700 transition-colors shadow-sm"
              >
                {editingOrder ? 'Enregistrer les modifications' : 'Ajouter au registre'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Configure Full Initial Stock & Parameters - Fully Responsive max-h-[92vh] */}
      {isStockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden">
          <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Sticky Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-[#131b2e] z-10">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  Configuration du Stock Approvisionné & Paramètres Polos
                </h3>
                <p className="text-xs text-slate-500">
                  Saisissez le nombre de polos approvisionnés par couleur et taille. Pour mettre à zéro, saisissez 0 dans chaque champ.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsStockModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <form id="stock-modal-form" onSubmit={handleSaveStockModal} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Prix unitaire par défaut d'un Polo (FCFA)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={500}
                    value={draftInventory.unitPrice}
                    onChange={(e) =>
                      setDraftInventory({
                        ...draftInventory,
                        unitPrice: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Seuil d'alerte « Stock faible » (unités)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={draftInventory.lowStockThreshold}
                    onChange={(e) =>
                      setDraftInventory({
                        ...draftInventory,
                        lowStockThreshold: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {POLO_COLORS.map((colorCfg) => (
                  <div
                    key={colorCfg.key}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
                  >
                    <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                      <span
                        className={`w-4 h-4 rounded ${colorCfg.swatchClass}`}
                      />
                      <span>{colorCfg.label}</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {POLO_SIZES.map((sz) => (
                        <div key={sz}>
                          <label className="block text-[11px] font-mono font-bold text-slate-500 mb-1">
                            Taille {sz}
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={draftInventory.stock[colorCfg.key][sz] ?? 0}
                            onChange={(e) =>
                              setDraftInventory({
                                ...draftInventory,
                                stock: {
                                  ...draftInventory.stock,
                                  [colorCfg.key]: {
                                    ...draftInventory.stock[colorCfg.key],
                                    [sz]: Math.max(0, Number(e.target.value)),
                                  },
                                },
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-center font-bold"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </form>

            {/* Sticky Footer */}
            <div className="p-3.5 sm:p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5 shrink-0 bg-slate-50/90 dark:bg-slate-900/90 z-10">
              <button
                type="button"
                onClick={() => setIsStockModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                form="stock-modal-form"
                className="px-5 py-2 rounded-xl bg-bde-rose text-white font-bold text-xs hover:bg-rose-700 transition-colors shadow-sm"
              >
                Sauvegarder le Stock en Temps Réel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Aperçu Reçu de Paiement */}
      {selectedReceiptPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white dark:bg-[#131b2e] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileCheck2 size={18} className="text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Reçu de paiement : {selectedReceiptPreview.studentName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReceiptPreview(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-slate-950/20">
              <img
                src={selectedReceiptPreview.url}
                alt={`Reçu de paiement - ${selectedReceiptPreview.studentName}`}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-md"
              />
            </div>

            <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50 dark:bg-slate-900/60">
              <span className="text-[11px] text-slate-500">
                Photo fournie par l'étudiant lors de sa réservation en ligne
              </span>
              <a
                href={selectedReceiptPreview.url}
                download={`Recu_${selectedReceiptPreview.studentName.replace(/\s+/g, '_')}.jpg`}
                className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity"
              >
                <Download size={13} />
                <span>Télécharger</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPolos;
