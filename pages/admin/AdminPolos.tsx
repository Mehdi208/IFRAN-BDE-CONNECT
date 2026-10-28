import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { dataService } from '../../services/dataService';
import {
  StudentPoloOrder,
  PoloInventoryConfig,
  PoloColorYear,
  PoloSize,
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
  RefreshCw,
  ShoppingCart,
  Wallet,
  Users,
  Check,
  ArrowUpDown,
  BarChart3,
  PieChart as PieChartIcon,
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

const SUGGESTED_CLASSES = [
  'B1 Créa',
  'B1 Dev',
  'B1 Com',
  'B2 Créa',
  'B2 Dev',
  'B2 Com',
  'B3 Créa',
  'B3 Dev',
  'B3 Com',
  'Prépa IA & Data 1',
  'Prépa IA & Data 2',
];

const formatCurrencyDots = (val: number): string => {
  const rounded = Math.round(val || 0);
  const sign = rounded < 0 ? '-' : '';
  return `${sign}${Math.abs(rounded)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')} FCFA`;
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

  // Supplier order buffer
  const [safetyBuffer, setSafetyBuffer] = useState<number>(0);

  // Student Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<StudentPoloOrder | null>(null);
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [studentClass, setStudentClass] = useState('B1 Créa');
  const [poloType, setPoloType] = useState<PoloColorYear>('BLANC_1A');
  const [size, setSize] = useState<PoloSize>('M');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PARTIAL' | 'UNPAID'>('PAID');
  const [amountPaid, setAmountPaid] = useState<number>(5000);
  const [totalPrice, setTotalPrice] = useState<number>(5000);
  const [deliveryStatus, setDeliveryStatus] = useState<'DELIVERED' | 'PENDING_STOCK'>('DELIVERED');
  const [notes, setNotes] = useState('');

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

  // Automatically suggest Polo Color when class changes in add mode
  const handleClassChange = (newClass: string) => {
    setStudentClass(newClass);
    const upper = newClass.toUpperCase();
    if (upper.includes('B1') || upper.includes('1')) {
      setPoloType('BLANC_1A');
    } else if (upper.includes('B2') || upper.includes('2')) {
      setPoloType('ROUGE_2A');
    } else if (upper.includes('B3') || upper.includes('3')) {
      setPoloType('BLEU_3A');
    }
  };

  // Stock Matrix Calculations per Color x Size
  const stockMatrix = useMemo(() => {
    const result: Record<
      PoloColorYear,
      Record<
        PoloSize,
        {
          initialStock: number;
          delivered: number;
          available: number;
          pending: number;
          deficit: number;
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
        const delivered = orders.filter(
          (o) =>
            o.poloType === colorKey &&
            o.size === sz &&
            o.deliveryStatus === 'DELIVERED'
        ).length;
        const pending = orders.filter(
          (o) =>
            o.poloType === colorKey &&
            o.size === sz &&
            o.deliveryStatus === 'PENDING_STOCK'
        ).length;

        const available = Math.max(0, initialStock - delivered);
        const deficit = Math.max(0, pending - available);
        const toOrder =
          deficit > 0
            ? deficit + safetyBuffer
            : available === 0 && safetyBuffer > 0
            ? safetyBuffer
            : 0;

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
          pending,
          deficit,
          toOrder,
          status,
        };
      });
    });

    return result;
  }, [orders, inventory, safetyBuffer]);

  // Global KPIs
  const globalStats = useMemo(() => {
    let totalInitial = 0;
    let totalDelivered = 0;
    let totalAvailable = 0;
    let totalPending = 0;
    let totalDeficit = 0;
    let totalToOrder = 0;
    let outOfStockVariants = 0;
    const itemsToOrderList: {
      colorKey: PoloColorYear;
      colorLabel: string;
      size: PoloSize;
      available: number;
      pending: number;
      deficit: number;
      toOrder: number;
    }[] = [];

    POLO_COLORS.forEach(({ key: colorKey, label: colorLabel }) => {
      POLO_SIZES.forEach((sz) => {
        const cell = stockMatrix[colorKey][sz];
        totalInitial += cell.initialStock;
        totalDelivered += cell.delivered;
        totalAvailable += cell.available;
        totalPending += cell.pending;
        totalDeficit += cell.deficit;
        totalToOrder += cell.toOrder;
        if (cell.available === 0 || cell.deficit > 0) {
          outOfStockVariants += 1;
        }
        if (cell.toOrder > 0) {
          itemsToOrderList.push({
            colorKey,
            colorLabel,
            size: sz,
            available: cell.available,
            pending: cell.pending,
            deficit: cell.deficit,
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
      totalPending,
      totalDeficit,
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

  // Recharts Data 1: Stacked Bar Chart of Stock Distribution by Year
  const stockChartData = useMemo(() => {
    return POLO_COLORS.map((colorCfg) => {
      const cells = stockMatrix[colorCfg.key];
      const delivered = POLO_SIZES.reduce((acc, sz) => acc + cells[sz].delivered, 0);
      const available = POLO_SIZES.reduce((acc, sz) => acc + cells[sz].available, 0);
      const pending = POLO_SIZES.reduce((acc, sz) => acc + cells[sz].pending, 0);
      const initial = POLO_SIZES.reduce((acc, sz) => acc + cells[sz].initialStock, 0);
      const toOrder = POLO_SIZES.reduce((acc, sz) => acc + cells[sz].toOrder, 0);

      return {
        name: `${colorCfg.shortLabel} (${colorCfg.yearLabel})`,
        shortName: colorCfg.yearLabel,
        Remis: delivered,
        Disponible: available,
        'En attente': pending,
        initial,
        toOrder,
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
    setSize('M');
    setDate(new Date().toISOString().split('T')[0]);
    const defaultPrice = inventory.unitPrice || 5000;
    setTotalPrice(defaultPrice);
    setPaymentStatus('PAID');
    setAmountPaid(defaultPrice);
    const availForM = stockMatrix['BLANC_1A']['M']?.available ?? 0;
    setDeliveryStatus(availForM > 0 ? 'DELIVERED' : 'PENDING_STOCK');
    setNotes('');
    setIsModalOpen(true);
  };

  // Open Modal to Edit Existing Student Polo
  const openEditModal = (order: StudentPoloOrder) => {
    setEditingOrder(order);
    setLastName(order.lastName);
    setFirstName(order.firstName);
    setStudentClass(order.studentClass);
    setPoloType(order.poloType);
    setSize(order.size);
    setDate(order.date);
    setPaymentStatus(order.paymentStatus);
    setAmountPaid(order.amountPaid);
    setTotalPrice(order.totalPrice || inventory.unitPrice || 5000);
    setDeliveryStatus(order.deliveryStatus);
    setNotes(order.notes || '');
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
      size,
      date,
      paymentStatus,
      amountPaid: cleanAmountPaid,
      totalPrice: Number(totalPrice) || 5000,
      deliveryStatus,
      notes: notes.trim(),
    };

    if (editingOrder) {
      await dataService.updatePoloOrder({
        ...payload,
        id: editingOrder.id,
      });
    } else {
      await dataService.addPoloOrder(payload);
    }
    setIsModalOpen(false);
  };

  // Quick 1-click toggles in student table
  const handleTogglePaid = async (order: StudentPoloOrder) => {
    const nextStatus = order.paymentStatus === 'PAID' ? 'UNPAID' : 'PAID';
    const nextAmount = nextStatus === 'PAID' ? order.totalPrice || 5000 : 0;
    await dataService.updatePoloOrder({
      ...order,
      paymentStatus: nextStatus,
      amountPaid: nextAmount,
    });
  };

  const handleToggleDelivered = async (order: StudentPoloOrder) => {
    const nextDelivery =
      order.deliveryStatus === 'DELIVERED' ? 'PENDING_STOCK' : 'DELIVERED';
    await dataService.updatePoloOrder({
      ...order,
      deliveryStatus: nextDelivery,
    });
  };

  const handleConfirmDelete = async (id: string) => {
    await dataService.deletePoloOrder(id);
    setDeleteConfirmId(null);
  };

  // Save Full Stock Configuration Modal
  const handleSaveStockModal = async (e: React.FormEvent) => {
    e.preventDefault();
    await dataService.savePoloInventory(draftInventory);
    setIsStockModalOpen(false);
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
          o.studentClass.toLowerCase().includes(q);
        if (!matchName) return false;
      }
      if (filterColor !== 'ALL' && o.poloType !== filterColor) return false;
      if (filterSize !== 'ALL' && o.size !== filterSize) return false;
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
      'Taille',
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
      const payText =
        o.paymentStatus === 'PAID'
          ? 'Payé'
          : o.paymentStatus === 'PARTIAL'
          ? 'Acompte'
          : 'Non payé';
      const delivText =
        o.deliveryStatus === 'DELIVERED' ? 'Polo remis' : 'En attente de stock';
      const remaining = Math.max(0, (o.totalPrice || 0) - (o.amountPaid || 0));

      return [
        `"${o.lastName.replace(/"/g, '""')}"`,
        `"${o.firstName.replace(/"/g, '""')}"`,
        `"${o.studentClass.replace(/"/g, '""')}"`,
        `"${poloLabel}"`,
        o.size,
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

  const selectedModalCell = stockMatrix[poloType]?.[size];

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2.5 text-xs font-semibold text-bde-rose mb-1">
              <span>Administration IFRAN</span>
              <span>·</span>
              <span>Synchronisation Temps Réel</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              <Shirt className="text-bde-rose shrink-0" size={28} />
              <span>Suivi des Polos Étudiants & Gestion des Stocks</span>
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Traçabilité complète des remises de polos par classe, taille et couleur (1ère, 2e et 3e année), paiements et calcul automatique des réapprovisionnements.
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
              <span>Configurer le Stock Initial</span>
            </button>

            <button
              onClick={() =>
                generatePoloSupplierOrderPDF(orders, inventory, safetyBuffer)
              }
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
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                {globalStats.totalPending} en attente
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
              {globalStats.outOfStockVariants > 0 ? (
                <span className="text-rose-600 dark:text-rose-400 font-semibold">
                  {globalStats.outOfStockVariants} taille(s) épuisée(s) ou en rupture
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Toutes les tailles sont disponibles
                </span>
              )}
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
              <span>Polos à Commander (Ruptures)</span>
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
                  Répartis sur{' '}
                  <strong className="font-mono tabular-nums">
                    {globalStats.itemsToOrderList.length}
                  </strong>{' '}
                  référence(s) précise(s)
                </span>
              ) : (
                <span>Aucun déficit de commande actuel</span>
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

        {/* Visual Analytics Section (Recharts): Stock Distribution & Payment Rate */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Chart 1: Stacked Bar Chart - Stock Distribution by Year */}
          <div className="p-5 rounded-xl bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BarChart3 size={17} className="text-bde-rose shrink-0" />
                  <span>Répartition des Stocks & Demandes par Année</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Comparaison temps réel entre Polos remis, Stock disponible et Demandes en attente.
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
                  <Tooltip
                    cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#1e293b',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, name: any) => [`${value} polo(s)`, name]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                  />
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
                    dataKey="En attente"
                    stackId="poloStack"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                    barSize={42}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Donut Chart - Global Student Payment Rate */}
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
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#1e293b',
                          borderRadius: '0.75rem',
                          color: '#f8fafc',
                          fontSize: '12px',
                        }}
                        formatter={(value: any, name: any) => [
                          `${value} étudiant(s)`,
                          name,
                        ]}
                      />
                    )}
                  </PieChart>
                </ResponsiveContainer>

                {/* Center Label inside Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                    {paymentChartData.paidPct}%
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Soldé (Payé)
                  </span>
                </div>
              </div>

              {/* Payment Breakdown Legend & Financial Progress */}
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

        {/* Section 1: Real-time Stock Matrix by Polo Color/Year and Size */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                01. État du Stock par Couleur (Année) et Taille (S à 3XL)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ajustez le stock approvisionné avec les boutons <code className="font-mono">-</code> / <code className="font-mono">+</code>. Le stock disponible et les quantités à commander se calculent en temps réel.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
              <span>Marge de sécurité commande :</span>
              <select
                value={safetyBuffer}
                onChange={(e) => setSafetyBuffer(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs"
              >
                <option value={0}>+0 (Exactement les demandes en attente)</option>
                <option value={2}>+2 polos de marge par taille en rupture</option>
                <option value={5}>+5 polos de marge par taille en rupture</option>
                <option value={10}>+10 polos de marge par taille en rupture</option>
              </select>
            </div>
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
                  {/* Card Header */}
                  <div className={`p-4 ${colorCfg.headerBgClass} flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-5 h-5 rounded-md shrink-0 ${colorCfg.swatchClass}`}
                        aria-hidden="true"
                      />
                      <div>
                        <h3 className={`text-sm font-extrabold ${colorCfg.badgeTextClass}`}>
                          {colorCfg.label}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                          {totalColorAvailable} dispo · {totalColorDelivered} remis
                        </p>
                      </div>
                    </div>

                    {totalColorToOrder > 0 ? (
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                        À commander : {totalColorToOrder}
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        Stock OK
                      </span>
                    )}
                  </div>

                  {/* Sizes Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/40">
                          <th className="py-2.5 px-3 font-semibold">Taille</th>
                          <th className="py-2.5 px-2 font-semibold text-center">Appro.</th>
                          <th className="py-2.5 px-2 font-semibold text-center">Remis</th>
                          <th className="py-2.5 px-2 font-semibold text-center">Dispo</th>
                          <th className="py-2.5 px-2 font-semibold text-center">Attente</th>
                          <th className="py-2.5 px-3 font-semibold text-right">À Commander</th>
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

                              <td
                                className={`py-2.5 px-2 text-center ${
                                  cell.pending > 0
                                    ? 'font-bold text-amber-600 dark:text-amber-400'
                                    : 'text-slate-400'
                                }`}
                              >
                                {cell.pending}
                              </td>

                              <td className="py-2.5 px-3 text-right">
                                {cell.toOrder > 0 ? (
                                  <span className="font-extrabold text-rose-600 dark:text-rose-400">
                                    +{cell.toOrder} à cmd
                                  </span>
                                ) : cell.available === 0 ? (
                                  <span className="text-[11px] font-sans text-amber-600 dark:text-amber-400">
                                    Épuisé (0)
                                  </span>
                                ) : isLow ? (
                                  <span className="text-[11px] font-sans text-amber-600 dark:text-amber-400">
                                    Stock bas
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-sans text-slate-400">
                                    OK
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
                  02. Calculateur Exact de Commande Fournisseur (Ruptures & Demandes en Attente)
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Liste précise du nombre de polos à commander par couleur et par taille pour couvrir toutes les demandes étudiantes en attente.
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
                onClick={() =>
                  generatePoloSupplierOrderPDF(orders, inventory, safetyBuffer)
                }
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
                Aucune rupture critique : le stock disponible couvre actuellement toutes les demandes enregistrées. (Vous pouvez ajouter une marge de sécurité ci-dessus si vous souhaitez précommander pour les tailles à 0).
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
                      Taille <strong>{item.size}</strong> · Dispo: {item.available} · En attente: {item.pending}
                    </div>
                  </div>
                  <div className="text-right font-mono tabular-nums shrink-0">
                    <div className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
                      {item.toOrder} à commander
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Déficit net : {item.deficit}
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
                Cliquez directement sur le statut de paiement ou de remise d'un étudiant pour le basculer en 1 clic. Toutes les modifications sont synchronisées en temps réel.
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
              <option value="PENDING_STOCK">En attente de stock ({globalStats.totalPending})</option>
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
                  Enregistrez chaque étudiant qui vient récupérer ou réserver son polo afin de suivre les tailles, les paiements et le stock en temps réel.
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
                      <th className="py-3 px-3 font-semibold text-center">Taille</th>
                      <th className="py-3 px-3 font-semibold text-center">Date</th>
                      <th className="py-3 px-3 font-semibold">Paiement</th>
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
                            {order.notes && (
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

                          <td className="py-3 px-3 text-center font-mono font-extrabold text-sm text-slate-900 dark:text-white">
                            {order.size}
                          </td>

                          <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-600 dark:text-slate-400">
                            {order.date
                              ? new Date(order.date).toLocaleDateString('fr-FR')
                              : '-'}
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

                          <td className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => handleToggleDelivered(order)}
                              title="Cliquer pour basculer Polo remis / En attente de stock"
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
                                  <span>En attente de stock</span>
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

      {/* Modal 1: Add / Edit Student Polo Order */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Shirt size={20} className="text-bde-rose" />
                <span>
                  {editingOrder
                    ? "Modifier l'attribution de Polo"
                    : 'Enregistrer la prise de Polo d’un étudiant'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStudentOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
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
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Classe / Filière *
                  </label>
                  <input
                    type="text"
                    list="ifran-classes-list"
                    required
                    value={studentClass}
                    onChange={(e) => handleClassChange(e.target.value)}
                    placeholder="Ex: B1 Créa, B2 Dev, B3 Com..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <datalist id="ifran-classes-list">
                    {SUGGESTED_CLASSES.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date de prise / réservation *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Polo Color / Year Selection */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Couleur du Polo & Année *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {POLO_COLORS.map((c) => {
                    const isSelected = poloType === c.key;
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setPoloType(c.key)}
                        className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                          isSelected
                            ? 'border-bde-rose bg-rose-50/60 dark:bg-rose-950/40 font-bold text-slate-900 dark:text-white'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded shrink-0 ${c.swatchClass}`}
                        />
                        <div className="leading-tight">
                          <div className="text-xs font-bold">{c.shortLabel}</div>
                          <div className="text-[10px] text-slate-500">
                            {c.yearLabel}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Size Selection with Live Stock Availability */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Taille de Polo souhaitée *
                  </label>
                  {selectedModalCell && (
                    <span
                      className={`font-mono text-[11px] font-bold ${
                        selectedModalCell.available > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {selectedModalCell.available > 0
                        ? `${selectedModalCell.available} disponible(s) en stock`
                        : 'Rupture de stock (0 disponible)'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-6 gap-2">
                  {POLO_SIZES.map((sz) => {
                    const cell = stockMatrix[poloType]?.[sz];
                    const isSelected = size === sz;
                    const avail = cell?.available ?? 0;

                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          setSize(sz);
                          if (!editingOrder) {
                            setDeliveryStatus(
                              avail > 0 ? 'DELIVERED' : 'PENDING_STOCK'
                            );
                          }
                        }}
                        className={`py-2.5 px-2 rounded-xl border text-center font-mono transition-all ${
                          isSelected
                            ? 'border-bde-rose bg-bde-rose text-white font-extrabold'
                            : avail === 0
                            ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="text-xs font-bold">{sz}</div>
                        <div
                          className={`text-[10px] ${
                            isSelected ? 'text-rose-100' : 'text-slate-400'
                          }`}
                        >
                          {avail} dispo
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Payment Status & Amounts */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="block font-semibold text-slate-700 dark:text-slate-300">
                  Statut du Paiement *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePaymentStatusChange('PAID')}
                    className={`py-2 px-3 rounded-lg font-semibold border transition-colors ${
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
                    className={`py-2 px-3 rounded-lg font-semibold border transition-colors ${
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
                    className={`py-2 px-3 rounded-lg font-semibold border transition-colors ${
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
                      Montant payé par l'étudiant (FCFA)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={500}
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                      disabled={paymentStatus !== 'PARTIAL'}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Prix du Polo (FCFA)
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
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Status */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Remise physique du Polo *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setDeliveryStatus('DELIVERED')}
                    className={`py-2.5 px-3 rounded-xl font-semibold border transition-colors flex items-center justify-center gap-2 ${
                      deliveryStatus === 'DELIVERED'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <CheckCircle2 size={15} />
                    <span>Polo déjà remis à l'étudiant</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryStatus('PENDING_STOCK')}
                    className={`py-2.5 px-3 rounded-xl font-semibold border transition-colors flex items-center justify-center gap-2 ${
                      deliveryStatus === 'PENDING_STOCK'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Clock size={15} />
                    <span>En attente de stock (À commander)</span>
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
                  placeholder="Ex: Paiement Mobile Money, échange de taille..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-bde-rose text-white font-bold hover:bg-rose-700 transition-colors"
                >
                  {editingOrder ? 'Enregistrer les modifications' : 'Ajouter au registre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Configure Full Initial Stock & Parameters */}
      {isStockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Configuration du Stock Approvisionné & Paramètres Polos
                </h3>
                <p className="text-xs text-slate-500">
                  Saisissez le nombre total de polos reçus par couleur et par taille.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsStockModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStockModal} className="space-y-5 text-xs">
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

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsStockModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-bde-rose text-white font-bold hover:bg-rose-700 transition-colors"
                >
                  Sauvegarder le Stock en Temps Réel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPolos;
