
import React, { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { dataService } from '../../services/dataService';
import { Product, FoodOrder } from '../../types';
import { 
  Plus, 
  Trash2, 
  Edit, 
  X, 
  Check, 
  ShoppingBag, 
  UtensilsCrossed, 
  MessageCircle, 
  Smartphone, 
  CheckCircle, 
  Clock, 
  Truck,
  Package,
  Filter,
  TrendingUp,
  DollarSign,
  Download,
  Calendar,
  List,
  Coffee,
  Utensils
} from 'lucide-react';
import { generateCanteenReport } from '../../services/pdfService';

const AdminCanteen = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'accounting'>('orders');
  
  // Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Plat du jour');
  const [imageUrl, setImageUrl] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);

  // Filter Orders State
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState('all');

  // Accounting Filters
  const [accStartDate, setAccStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [accEndDate, setAccEndDate] = useState(new Date().toISOString().split('T')[0]);

  const inputStyle = "w-full bg-white text-bde-navy border-2 border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-bde-rose focus:border-bde-rose outline-none transition font-bold shadow-sm placeholder:text-gray-400";
  const modalInputStyle = "w-full bg-bde-navy text-white border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-bde-rose outline-none transition";
  const accountingDateInputStyle = "bg-white border-2 border-gray-300 rounded-xl p-2.5 text-sm font-bold text-bde-navy outline-none focus:ring-2 focus:ring-bde-rose shadow-sm transition";

  const loadData = async () => {
    setLoading(true);
    const p = await dataService.fetchProducts();
    const o = await dataService.fetchFoodOrders();
    setProducts(p);
    setOrders(o);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // Calculs de comptabilité basés sur les filtres de date
  const accountingStats = useMemo(() => {
    const start = new Date(accStartDate);
    const end = new Date(accEndDate);
    end.setHours(23, 59, 59, 999);
    start.setHours(0, 0, 0, 0);

    const filteredDelivered = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return o.status === 'delivered' && orderDate >= start && orderDate <= end;
    });

    const totalRevenue = filteredDelivered.reduce((sum, o) => sum + o.totalPrice, 0);
    const totalCount = filteredDelivered.length;
    
    return { totalRevenue, totalCount, filteredDelivered };
  }, [orders, accStartDate, accEndDate]);

  // Groupement des produits pour l'onglet Menu
  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    products.forEach(p => {
      let cat = p.category || "Autres";
      // Renommage demandé
      if (cat.toLowerCase().includes("midi") || cat.toLowerCase().includes("déjeuner") && !cat.toLowerCase().includes("petit")) {
        cat = "Le Déjeuner";
      }
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return groups;
  }, [products]);

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const pData = { name, price: Number(price), description: "", category, imageUrl, isAvailable };
    if (editingProduct) await dataService.updateProduct({ ...editingProduct, ...pData });
    else await dataService.addProduct(pData);
    setIsProductModalOpen(false);
    loadData();
  };

  const openProductModal = (p?: Product) => {
    if (p) {
      setEditingProduct(p);
      setName(p.name); setPrice(String(p.price));
      setCategory(p.category); setImageUrl(p.imageUrl || ''); setIsAvailable(p.isAvailable);
    } else {
      setEditingProduct(null);
      setName(''); setPrice(''); setCategory('Plat du jour'); setImageUrl(''); setIsAvailable(true);
    }
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("Supprimer ce plat ?")) {
      await dataService.deleteProduct(id);
      loadData();
    }
  };

  const handleUpdateStatus = async (order: FoodOrder, newStatus: FoodOrder['status']) => {
    await dataService.updateFoodOrder({ ...order, status: newStatus });
    loadData();
  };

  const notifyStudent = (order: FoodOrder) => {
    const text = `Bonjour ${order.studentFirstName}, votre commande de la cantine IFRAN est maintenant PRETE ! Vous pouvez venir la récupérer. Bon appétit !`;
    const url = `https://api.whatsapp.com/send/?phone=225${order.studentPhone}&text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const filteredOrders = orders.filter(o => {
    const matchesDate = !filterDate || o.pickupDate === filterDate;
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchesDate && matchesStatus;
  }).sort((a,b) => b.pickupTime.localeCompare(a.pickupTime));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'validated': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'preparing': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'ready': return 'bg-green-50 text-green-600 border-green-100';
      case 'delivered': return 'bg-gray-50 text-gray-500 border-gray-100';
      default: return 'bg-gray-50 text-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Attente Paiement';
      case 'validated': return 'Payée / Validée';
      case 'preparing': return 'En préparation';
      case 'ready': return 'Prête';
      case 'delivered': return 'Récupérée';
      default: return status;
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 mb-8">
        <div>
          <h2 className="text-3xl font-black text-bde-navy">Gestion Cantine</h2>
          <p className="text-sm text-gray-500 font-medium">Contrôle des repas et finances.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-gray-200 p-1.5 rounded-2xl shadow-inner w-full overflow-x-auto no-scrollbar gap-1">
          <button 
            onClick={() => setActiveTab('orders')} 
            className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl font-black text-xs uppercase tracking-tighter transition-all whitespace-nowrap ${activeTab === 'orders' ? 'bg-white text-bde-navy shadow-md' : 'text-gray-500'}`}
          >
            Commandes
          </button>
          <button 
            onClick={() => setActiveTab('products')} 
            className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl font-black text-xs uppercase tracking-tighter transition-all whitespace-nowrap ${activeTab === 'products' ? 'bg-white text-bde-navy shadow-md' : 'text-gray-500'}`}
          >
            Le Menu
          </button>
          <button 
            onClick={() => setActiveTab('accounting')} 
            className={`flex-1 min-w-[100px] px-4 py-3 rounded-xl font-black text-xs uppercase tracking-tighter transition-all whitespace-nowrap ${activeTab === 'accounting' ? 'bg-white text-bde-navy shadow-md' : 'text-gray-500'}`}
          >
            Comptabilité
          </button>
        </div>
      </div>

      {activeTab === 'products' && (
        <div className="space-y-12 animate-fade-in">
          <div className="flex justify-end">
            <button onClick={() => openProductModal()} className="w-full md:w-auto bg-bde-navy text-white px-6 py-4 rounded-2xl font-black hover:bg-blue-900 transition flex items-center justify-center gap-2 shadow-xl">
              <Plus size={20}/> Ajouter un plat
            </button>
          </div>

          {Object.keys(groupedProducts).length > 0 ? (
            <div className="space-y-16">
              {/* Added explicit type assertion to Object.entries for groupedProducts */}
              {(Object.entries(groupedProducts) as [string, Product[]][]).map(([catName, catItems]) => (
                <div key={catName} className="space-y-6">
                  <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border-2 border-gray-100 sticky top-4 z-10">
                    {catName === "Petit Déjeuner" ? <Coffee className="text-bde-rose" size={24}/> : <Utensils className="text-bde-rose" size={24}/>}
                    <h3 className="font-black text-xl text-bde-navy uppercase">{catName}</h3>
                    <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-black ml-auto">{catItems.length} plats</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {catItems.map(p => (
                      <div key={p.id} className={`bg-white rounded-[32px] p-6 shadow-sm border-2 transition-all flex gap-4 items-center ${p.isAvailable ? 'border-gray-50' : 'border-red-100 opacity-75'}`}>
                         <div className="w-20 h-20 rounded-2xl bg-gray-100 shrink-0 overflow-hidden border">
                            {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" alt={p.name} /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><UtensilsCrossed size={24}/></div>}
                         </div>
                         <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-bde-navy truncate">{p.name}</h4>
                              {!p.isAvailable && <span className="bg-red-100 text-red-600 text-[8px] font-black uppercase px-1.5 py-0.5 rounded">Off</span>}
                            </div>
                            <span className="font-black text-bde-rose text-lg">{p.price} F</span>
                         </div>
                         <div className="flex flex-col gap-2">
                            <button onClick={() => openProductModal(p)} className="p-3 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-xl transition"><Edit size={18}/></button>
                            <button onClick={() => handleDeleteProduct(p.id)} className="p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition"><Trash2 size={18}/></button>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-gray-200">
               <Utensils size={48} className="mx-auto text-gray-200 mb-4" />
               <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Le menu est vide.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-6 animate-fade-in">
           {/* Filtres */}
           <div className="bg-bde-navy p-6 rounded-[32px] shadow-xl border-2 border-white/10 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-300 uppercase ml-1">Date de retrait</label>
                <div className="relative">
                  <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-bde-rose" size={18}/>
                  <input 
                    type="date" 
                    className={`${inputStyle} pl-12 border-gray-400 bg-white text-bde-navy`} 
                    value={filterDate} 
                    onChange={e => setFilterDate(e.target.value)} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-300 uppercase ml-1">Filtrer par statut</label>
                <select 
                    className={`${inputStyle} border-gray-400 bg-white text-bde-navy font-bold`} 
                    value={filterStatus} 
                    onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="all">Tous les statuts</option>
                  <option value="pending">Attente Paiement</option>
                  <option value="validated">Payée / Validée</option>
                  <option value="preparing">En préparation</option>
                  <option value="ready">Prête</option>
                  <option value="delivered">Récupérée</option>
                </select>
              </div>
           </div>

           <div className="space-y-4">
              {filteredOrders.length > 0 ? filteredOrders.map(order => (
                <div key={order.id} className="bg-white rounded-[40px] p-6 md:p-8 shadow-sm border-2 border-gray-100 flex flex-col gap-6 hover:border-bde-rose/30 transition-all">
                   <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${getStatusColor(order.status)}`}>
                                {getStatusLabel(order.status)}
                            </span>
                            <span className="text-xs text-gray-400 font-bold uppercase">{order.pickupTime}</span>
                        </div>
                        <h3 className="font-black text-xl text-bde-navy">{order.studentFirstName} {order.studentName}</h3>
                        <p className="text-bde-rose font-black text-xs uppercase tracking-wider">{order.studentClass}</p>
                      </div>
                      <div className="flex flex-col md:items-end w-full md:w-auto">
                        <span className="text-2xl font-black text-bde-navy">{order.totalPrice} FCFA</span>
                        <div className="flex items-center gap-1 text-sm text-gray-400 font-bold"><Smartphone size={16}/> {order.studentPhone}</div>
                      </div>
                   </div>
                   
                   <div className="bg-gray-50 rounded-2xl p-4 space-y-2 border border-gray-100">
                     {order.items.map((item, idx) => (
                       <div key={idx} className="flex justify-between items-center text-sm font-bold text-gray-700">
                         <span>{item.quantity}x {item.productName}</span>
                         <span className="text-gray-400">{item.price * item.quantity} F</span>
                       </div>
                     ))}
                   </div>

                   {order.notes && <div className="text-xs bg-orange-50 p-4 rounded-xl text-orange-700 font-medium italic">"{order.notes}"</div>}

                   {/* Actions rapides */}
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t border-gray-50">
                      {order.status === 'pending' && (
                        <button onClick={() => handleUpdateStatus(order, 'validated')} className="col-span-2 bg-green-500 text-white p-4 rounded-2xl text-xs font-black hover:bg-green-600 transition flex items-center justify-center gap-2">
                           <CheckCircle size={18}/> Valider Paiement
                        </button>
                      )}
                      {order.status === 'validated' && (
                        <button onClick={() => handleUpdateStatus(order, 'preparing')} className="col-span-2 bg-blue-500 text-white p-4 rounded-2xl text-xs font-black hover:bg-blue-600 transition flex items-center justify-center gap-2">
                           <Package size={18}/> Commencer Préparation
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button onClick={() => handleUpdateStatus(order, 'ready')} className="col-span-2 bg-purple-500 text-white p-4 rounded-2xl text-xs font-black hover:bg-purple-600 transition flex items-center justify-center gap-2">
                           <Truck size={18}/> Signaler Prête
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <>
                          <button onClick={() => notifyStudent(order)} className="bg-green-100 text-green-600 p-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2 border border-green-200">
                            <MessageCircle size={18}/> SMS Prêt
                          </button>
                          <button onClick={() => handleUpdateStatus(order, 'delivered')} className="bg-bde-navy text-white p-4 rounded-2xl text-xs font-black flex items-center justify-center gap-2">
                            <Check size={18}/> Marquée Récupérée
                          </button>
                        </>
                      )}
                      {order.status === 'delivered' && (
                        <div className="col-span-2 bg-gray-100 text-gray-500 p-4 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-2">
                           <CheckCircle size={18}/> Commande Terminée
                        </div>
                      )}
                   </div>
                </div>
              )) : (
                <div className="text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-gray-200">
                   <ShoppingBag size={64} className="mx-auto text-gray-200 mb-6" />
                   <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Aucune commande trouvée.</p>
                </div>
              )}
           </div>
        </div>
      )}

      {activeTab === 'accounting' && (
        <div className="space-y-8 animate-fade-in">
            {/* Filtres de période */}
            <div className="bg-white p-8 rounded-[40px] shadow-sm border-2 border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Période du</label>
                        <input type="date" className={accountingDateInputStyle} value={accStartDate} onChange={e => setAccStartDate(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Au</label>
                        <input type="date" className={accountingDateInputStyle} value={accEndDate} onChange={e => setAccEndDate(e.target.value)} />
                    </div>
                </div>
                <button 
                    onClick={() => generateCanteenReport(accountingStats.filteredDelivered, {start: accStartDate, end: accEndDate})}
                    className="w-full md:w-auto bg-bde-navy text-white px-6 py-4 rounded-2xl font-black hover:bg-blue-900 transition flex items-center justify-center gap-3 shadow-xl"
                >
                    <Download size={20}/> Télécharger Bilan PDF
                </button>
            </div>

            {/* Sommaire Financier */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[40px] shadow-sm border-2 border-gray-50 flex items-center gap-6">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center shadow-inner">
                        <DollarSign size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Encaissé</p>
                        <h3 className="text-3xl font-black text-bde-navy">{accountingStats.totalRevenue.toLocaleString()} FCFA</h3>
                        <p className="text-[10px] text-green-600 font-bold uppercase">Période sélectionnée</p>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[40px] shadow-sm border-2 border-gray-50 flex items-center gap-6">
                    <div className="w-16 h-16 bg-bde-rose/10 text-bde-rose rounded-3xl flex items-center justify-center shadow-inner">
                        <UtensilsCrossed size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Commandes Servies</p>
                        <h3 className="text-3xl font-black text-bde-navy">{accountingStats.totalCount} Ventes</h3>
                        <p className="text-[10px] text-bde-rose font-bold uppercase">Sur la période</p>
                    </div>
                </div>
            </div>

            {/* Journal Détaillé des Ventes */}
            <div className="bg-white rounded-[40px] p-8 shadow-sm border-2 border-gray-50">
                <h3 className="text-xl font-black text-bde-navy mb-6 flex items-center gap-3">
                    <List className="text-bde-rose" /> Journal Détaillé des Ventes
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 border-gray-50">
                                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase">Heure Commande</th>
                                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase">Heure Retrait</th>
                                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase">Client</th>
                                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase">Détails</th>
                                <th className="pb-4 text-[10px] font-black text-gray-400 uppercase text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {accountingStats.filteredDelivered.sort((a,b) => b.createdAt.localeCompare(a.createdAt)).map(order => (
                                <tr key={order.id} className="hover:bg-gray-50/50 transition">
                                    <td className="py-4">
                                        <div className="flex items-center gap-2 text-gray-500 font-medium">
                                            <Calendar size={14}/>
                                            <span className="whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString()}</span>
                                            <span className="text-xs text-gray-300">|</span>
                                            <span className="whitespace-nowrap font-bold text-bde-navy">{new Date(order.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <div className="flex items-center gap-2 text-bde-rose font-black">
                                            <Clock size={14}/>
                                            {order.pickupTime}
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <p className="font-bold text-bde-navy">{order.studentFirstName} {order.studentName}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{order.studentClass}</p>
                                    </td>
                                    <td className="py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {order.items.map((item, idx) => (
                                                <span key={idx} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                                                    {item.quantity}x {item.productName}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="py-4 text-right">
                                        <span className="font-black text-bde-navy">{order.totalPrice.toLocaleString()} F</span>
                                    </td>
                                </tr>
                            ))}
                            {accountingStats.filteredDelivered.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-gray-400 font-bold italic">
                                        Aucune commande récupérée sur cette période.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
              <div className="flex justify-between items-center p-8 border-b bg-gray-50">
                 <h3 className="font-black text-2xl text-bde-navy">{editingProduct ? 'Modifier Plat' : 'Nouveau Plat'}</h3>
                 <button onClick={() => setIsProductModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2"><X size={28}/></button>
              </div>
              <form onSubmit={handleSaveProduct} className="p-8 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Nom du plat</label>
                      <input type="text" className={modalInputStyle} value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Prix (FCFA)</label>
                      <input type="number" className={modalInputStyle} value={price} onChange={e => setPrice(e.target.value)} required />
                    </div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">Catégorie</label>
                    <input type="text" className={modalInputStyle} value={category} onChange={e => setCategory(e.target.value)} placeholder="Petit Déjeuner, Le Déjeuner, Boisson..." />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-1">URL Image (Optionnel)</label>
                    <input type="text" className={modalInputStyle} value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
                 </div>
                 <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <input 
                      type="checkbox" 
                      id="avail-check"
                      checked={isAvailable} 
                      onChange={e => setIsAvailable(e.target.checked)} 
                      className="w-6 h-6 rounded-lg text-bde-rose border-gray-300 focus:ring-bde-rose" 
                    />
                    <label htmlFor="avail-check" className="text-sm font-black text-bde-navy cursor-pointer">Disponible à la vente</label>
                 </div>
                 <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3">
                    <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-8 py-3 text-gray-400 font-black uppercase text-xs tracking-widest hover:text-gray-600">Annuler</button>
                    <button type="submit" className="bg-bde-navy text-white px-10 py-4 rounded-2xl font-black hover:bg-blue-900 transition flex items-center justify-center gap-2 shadow-xl">
                       <Check size={20}/> Sauvegarder
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCanteen;
