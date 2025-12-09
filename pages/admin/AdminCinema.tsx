
import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { dataService } from '../../services/dataService';
import { CinemaSale } from '../../types';
import { Plus, Trash2, Download, ShoppingBag, Popcorn, ArrowUpDown, Filter, XCircle, Edit } from 'lucide-react';
import { generateCinemaReport } from '../../services/pdfService';

const AdminCinema = () => {
  const [sales, setSales] = useState<CinemaSale[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<CinemaSale | null>(null);
  
  // Sort State
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Form State
  const [itemName, setItemName] = useState('Popcorn (Petit)');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(500); // Default price for Popcorn Petit
  const [buyerName, setBuyerName] = useState('');
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const inputStyle = "w-full bg-bde-navy text-white border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-bde-rose outline-none placeholder-gray-400";
  const selectStyle = "w-full bg-bde-navy text-white border border-gray-600 rounded-lg p-3 focus:ring-2 focus:ring-bde-rose outline-none";

  const loadData = async () => {
    const data = await dataService.fetchCinemaSales();
    setSales(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update default price based on selection only if not editing
  useEffect(() => {
    if (!editingSale) {
        switch(itemName) {
            case 'Popcorn (Petit)': setUnitPrice(500); break;
            case 'Popcorn (Moyen)': setUnitPrice(1000); break;
            case 'Popcorn (Grand)': setUnitPrice(1500); break;
            case 'Boisson': setUnitPrice(500); break;
            default: break;
        }
    }
  }, [itemName, editingSale]);

  const openModal = (sale?: CinemaSale) => {
    if (sale) {
        setEditingSale(sale);
        setItemName(sale.itemName);
        setQuantity(sale.quantity);
        setUnitPrice(sale.unitPrice);
        setBuyerName(sale.buyerName || '');
    } else {
        setEditingSale(null);
        setItemName('Popcorn (Petit)');
        setQuantity(1);
        setUnitPrice(500);
        setBuyerName('');
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = quantity * unitPrice;
    
    if (editingSale) {
        const updatedSale = {
            ...editingSale,
            itemName,
            quantity,
            unitPrice,
            totalPrice: total,
            buyerName
        };
        await dataService.updateCinemaSale(updatedSale);
    } else {
        const newSale = {
            itemName,
            quantity,
            unitPrice,
            totalPrice: total,
            date: new Date().toISOString(),
            buyerName
        };
        await dataService.addCinemaSale(newSale);
    }
    
    loadData();
    setIsModalOpen(false);
    setEditingSale(null);
  };

  const handleDelete = async (id: string) => {
    await dataService.deleteCinemaSale(id);
    loadData();
    setDeleteConfirmId(null);
  };

  // FILTERING LOGIC
  const filteredSales = sales.filter(sale => {
    if (!startDate && !endDate) return true;
    
    const saleDate = new Date(sale.date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    // Adjust end date to include the full day
    if (end) end.setHours(23, 59, 59, 999);
    // Adjust start date to beginning of day
    if (start) start.setHours(0, 0, 0, 0);

    if (start && saleDate < start) return false;
    if (end && saleDate > end) return false;
    
    return true;
  });

  const totalRevenue = filteredSales.reduce((acc, curr) => acc + curr.totalPrice, 0);

  // Sorting Logic on Filtered Data
  const sortedSales = [...filteredSales].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const clearFilters = () => {
      setStartDate('');
      setEndDate('');
  };

  return (
    <AdminLayout>
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingBag className="text-bde-rose" /> Vente Cinéma
          </h2>
          <p className="text-gray-500">Suivi des ventes de snacks et billetterie.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
            {/* Date Filter Bar */}
            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm flex-1 sm:flex-none">
                <div className="text-gray-400 px-2"><Filter size={16} /></div>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)}
                        className="bg-bde-navy text-white text-sm px-3 py-1.5 rounded outline-none border border-transparent focus:border-bde-rose transition [color-scheme:dark] w-full sm:w-auto"
                    />
                    <span className="text-gray-400 font-bold hidden sm:block">-</span>
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)}
                        className="bg-bde-navy text-white text-sm px-3 py-1.5 rounded outline-none border border-transparent focus:border-bde-rose transition [color-scheme:dark] w-full sm:w-auto"
                    />
                </div>
                {(startDate || endDate) && (
                    <button onClick={clearFilters} className="text-red-500 hover:text-red-700 px-2" title="Effacer les filtres">
                        <XCircle size={18} />
                    </button>
                )}
            </div>

            <div className="flex gap-2">
                <button onClick={() => openModal()} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition shadow-sm whitespace-nowrap">
                    <Plus size={18} /> Nouvelle Vente
                </button>
                <button onClick={() => generateCinemaReport(sortedSales)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-bde-navy text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition shadow-sm whitespace-nowrap">
                    <Download size={18} /> PDF
                </button>
            </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in-up">
        <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="p-4 bg-purple-100 text-purple-600 rounded-full">
                <Popcorn size={32} />
            </div>
            <div>
                <p className="text-gray-500 font-medium">
                    Recette Totale 
                    {(startDate || endDate) && <span className="text-xs text-bde-rose ml-2">(Filtrée)</span>}
                </p>
                <h3 className="text-3xl font-bold text-bde-navy">{totalRevenue.toLocaleString()} FCFA</h3>
            </div>
        </div>
        <div className="w-full sm:w-auto flex justify-between sm:block border-t sm:border-0 pt-4 sm:pt-0 sm:text-right">
            <p className="text-gray-400 text-sm">Nombre de ventes</p>
            <p className="text-xl font-bold text-gray-800">{filteredSales.length}</p>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up" style={{animationDelay: '0.1s'}}>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-sm">
                    <tr>
                        <th 
                            className="p-4 cursor-pointer hover:bg-gray-100 transition select-none group whitespace-nowrap"
                            onClick={toggleSort}
                        >
                            <div className="flex items-center gap-1">
                                Date 
                                <ArrowUpDown size={14} className={`text-gray-400 group-hover:text-bde-rose ${sortOrder === 'asc' ? 'rotate-180' : ''} transition-transform`} />
                            </div>
                        </th>
                        <th className="p-4">Article</th>
                        <th className="p-4">Acheteur</th>
                        <th className="p-4">Quantité</th>
                        <th className="p-4">Total</th>
                        <th className="p-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {sortedSales.map(sale => (
                        <tr key={sale.id} className="hover:bg-gray-50 transition">
                            <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                                {new Date(sale.date).toLocaleDateString('fr-FR')} {new Date(sale.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                            </td>
                            <td className="p-4 font-bold text-gray-800">{sale.itemName}</td>
                            <td className="p-4 text-sm text-gray-600">{sale.buyerName || '-'}</td>
                            <td className="p-4 text-sm">
                                <span className="bg-gray-100 px-2 py-1 rounded text-gray-700 font-medium">x{sale.quantity}</span>
                            </td>
                            <td className="p-4 font-bold text-green-600 whitespace-nowrap">{sale.totalPrice} F</td>
                            <td className="p-4 text-right whitespace-nowrap">
                                <div className="flex justify-end gap-2">
                                    <button 
                                        onClick={() => openModal(sale)}
                                        className="text-gray-400 hover:text-blue-500 p-2 transition"
                                        title="Modifier"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    {deleteConfirmId === sale.id ? (
                                        <button onClick={() => handleDelete(sale.id)} className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition">Confirmer</button>
                                    ) : (
                                        <button onClick={() => { setDeleteConfirmId(sale.id); setTimeout(() => setDeleteConfirmId(null), 3000); }} className="text-gray-400 hover:text-red-500 p-2 transition" title="Supprimer">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {sortedSales.length === 0 && (
                        <tr>
                            <td colSpan={6} className="p-8 text-center text-gray-500">
                                {sales.length > 0 ? "Aucune vente trouvée pour cette période." : "Aucune vente enregistrée."}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                <h3 className="font-bold text-xl text-bde-navy mb-6">{editingSale ? 'Modifier la Vente' : 'Enregistrer une Vente'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Article</label>
                        <select className={selectStyle} value={itemName} onChange={e => setItemName(e.target.value)}>
                            <option value="Popcorn (Petit)" className="bg-bde-navy">Popcorn (Petit)</option>
                            <option value="Popcorn (Moyen)" className="bg-bde-navy">Popcorn (Moyen)</option>
                            <option value="Popcorn (Grand)" className="bg-bde-navy">Popcorn (Grand)</option>
                            <option value="Boisson" className="bg-bde-navy">Boisson</option>
                            <option value="Autre" className="bg-bde-navy">Autre</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Prix Unitaire</label>
                            <input type="number" className={inputStyle} value={unitPrice} onChange={e => setUnitPrice(parseInt(e.target.value))} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Quantité</label>
                            <input type="number" className={inputStyle} value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} min="1" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Nom Acheteur (Optionnel)</label>
                        <input type="text" className={inputStyle} value={buyerName} onChange={e => setBuyerName(e.target.value)} placeholder="Ex: Jean" />
                    </div>

                    <div className="bg-gray-100 p-3 rounded-lg flex justify-between items-center mt-2">
                        <span className="font-bold text-gray-600">Total :</span>
                        <span className="font-bold text-xl text-bde-rose">{(quantity * unitPrice).toLocaleString()} FCFA</span>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-500 font-medium hover:bg-gray-100 rounded-lg transition">Annuler</button>
                        <button type="submit" className="flex-1 bg-bde-navy text-white py-3 rounded-lg font-bold hover:bg-blue-900 shadow-lg transition">{editingSale ? 'Modifier' : 'Valider'}</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCinema;
