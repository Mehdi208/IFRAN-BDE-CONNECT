
import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { dataService } from '../../services/dataService';
import { CinemaSale } from '../../types';
import { Plus, Trash2, Download, ShoppingBag, Popcorn, ArrowUpDown } from 'lucide-react';
import { generateCinemaReport } from '../../services/pdfService';

const AdminCinema = () => {
  const [sales, setSales] = useState<CinemaSale[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Sort State
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
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

  // Update default price based on selection
  useEffect(() => {
    switch(itemName) {
        case 'Popcorn (Petit)': setUnitPrice(500); break;
        case 'Popcorn (Moyen)': setUnitPrice(1000); break;
        case 'Popcorn (Grand)': setUnitPrice(1500); break;
        case 'Boisson': setUnitPrice(500); break;
        default: break;
    }
  }, [itemName]);

  const handleAddSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = quantity * unitPrice;
    
    const newSale = {
        itemName,
        quantity,
        unitPrice,
        totalPrice: total,
        date: new Date().toISOString(),
        buyerName
    };
    
    await dataService.addCinemaSale(newSale);
    loadData();
    setIsModalOpen(false);
    // Reset form for next entry
    setQuantity(1);
    setBuyerName('');
  };

  const handleDelete = async (id: string) => {
    await dataService.deleteCinemaSale(id);
    loadData();
    setDeleteConfirmId(null);
  };

  const totalRevenue = sales.reduce((acc, curr) => acc + curr.totalPrice, 0);

  // Sorting Logic
  const sortedSales = [...sales].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const toggleSort = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingBag className="text-bde-rose" /> Gestion des Ventes
          </h2>
          <p className="text-gray-500">Suivi des ventes de snacks et autres articles.</p>
        </div>
        
        <div className="flex gap-2">
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition shadow-sm">
                <Plus size={18} /> Nouvelle Vente
            </button>
            <button onClick={() => generateCinemaReport(sortedSales)} className="flex items-center gap-2 bg-bde-navy text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition shadow-sm">
                <Download size={18} /> Rapport PDF
            </button>
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
            <div className="p-4 bg-purple-100 text-purple-600 rounded-full">
                <Popcorn size={32} />
            </div>
            <div>
                <p className="text-gray-500 font-medium">Recette Totale</p>
                <h3 className="text-3xl font-bold text-bde-navy">{totalRevenue.toLocaleString()} FCFA</h3>
            </div>
        </div>
        <div className="text-right hidden sm:block">
            <p className="text-gray-400 text-sm">Nombre de ventes</p>
            <p className="text-xl font-bold">{sales.length}</p>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                    <th 
                        className="p-4 cursor-pointer hover:bg-gray-100 transition select-none group"
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
                        <td className="p-4 text-sm text-gray-600">
                            {new Date(sale.date).toLocaleDateString('fr-FR')} {new Date(sale.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                        </td>
                        <td className="p-4 font-bold text-gray-800">{sale.itemName}</td>
                        <td className="p-4 text-sm text-gray-600">{sale.buyerName || '-'}</td>
                        <td className="p-4 text-sm">
                            <span className="bg-gray-100 px-2 py-1 rounded text-gray-700 font-medium">x{sale.quantity}</span>
                        </td>
                        <td className="p-4 font-bold text-green-600">{sale.totalPrice} F</td>
                        <td className="p-4 text-right">
                            {deleteConfirmId === sale.id ? (
                                <button onClick={() => handleDelete(sale.id)} className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">Confirmer</button>
                            ) : (
                                <button onClick={() => { setDeleteConfirmId(sale.id); setTimeout(() => setDeleteConfirmId(null), 3000); }} className="text-gray-400 hover:text-red-500 p-2">
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </td>
                    </tr>
                ))}
                {sortedSales.length === 0 && (
                    <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500">Aucune vente enregistrée.</td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in-up p-6">
                <h3 className="font-bold text-xl text-bde-navy mb-6">Enregistrer une Vente</h3>
                <form onSubmit={handleAddSale} className="space-y-4">
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
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-gray-500 font-medium hover:bg-gray-100 rounded-lg">Annuler</button>
                        <button type="submit" className="flex-1 bg-bde-navy text-white py-3 rounded-lg font-bold hover:bg-blue-900 shadow-lg">Valider</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCinema;
