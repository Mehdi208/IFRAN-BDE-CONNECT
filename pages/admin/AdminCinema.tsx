
import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { dataService } from '../../services/dataService';
import { CinemaSale } from '../../types';
import { Plus, Trash2, Download, ShoppingBag, Popcorn, ArrowUpDown, Filter, XCircle, Edit, Armchair, Circle, Square, Map as MapIcon, Sofa, Check, Clock, Bed, Users } from 'lucide-react';
import { generateCinemaReport } from '../../services/pdfService';

const AdminCinema = () => {
  const [sales, setSales] = useState<CinemaSale[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<CinemaSale | null>(null);
  const [showSeatingPlan, setShowSeatingPlan] = useState(false);
  
  // Sort State
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter State
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]); // Par défaut aujourd'hui pour le plan
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Form State
  const [itemName, setItemName] = useState('Ticket Gratuit');
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [buyerName, setBuyerName] = useState('');
  const [selectedSeat, setSelectedSeat] = useState(''); 
  const [status, setStatus] = useState<'paid'|'reserved'>('reserved'); // Gratuit = reserved/validé, peu importe
  
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

  // Si on sélectionne un siège, on force l'article à "Ticket"
  useEffect(() => {
    if (selectedSeat && !editingSale) {
        setItemName('Ticket Gratuit');
        setUnitPrice(0);
        setQuantity(1);
    }
  }, [selectedSeat]);

  const openModal = (sale?: CinemaSale, seatId?: string) => {
    if (sale) {
        setEditingSale(sale);
        setItemName(sale.itemName);
        setQuantity(sale.quantity);
        setUnitPrice(sale.unitPrice);
        setBuyerName(sale.buyerName || '');
        setSelectedSeat(sale.seatId || '');
        setStatus(sale.status || 'reserved');
    } else {
        setEditingSale(null);
        setItemName('Ticket Gratuit');
        setQuantity(1);
        setUnitPrice(0);
        setBuyerName('');
        setSelectedSeat(seatId || ''); 
        setStatus('reserved');
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
            buyerName,
            seatId: selectedSeat || undefined,
            status
        };
        await dataService.updateCinemaSale(updatedSale);
    } else {
        const newSale = {
            itemName,
            quantity,
            unitPrice,
            totalPrice: total,
            date: new Date().toISOString(),
            buyerName,
            seatId: selectedSeat || undefined,
            status
        };
        await dataService.addCinemaSale(newSale);
    }
    
    loadData();
    setIsModalOpen(false);
    setEditingSale(null);
    setSelectedSeat('');
  };

  const handleDelete = async (id: string) => {
    await dataService.deleteCinemaSale(id);
    loadData();
    setDeleteConfirmId(null);
  };
  
  const handleToggleStatus = async (sale: CinemaSale) => {
      // Pour le cinéma gratuit, le statut a moins d'importance, mais on peut s'en servir pour "Pointé" / "Non Pointé"
      const newStatus: 'paid' | 'reserved' = sale.status === 'paid' ? 'reserved' : 'paid';
      const updated = { ...sale, status: newStatus };
      await dataService.updateCinemaSale(updated);
      loadData();
  };

  // FILTERING LOGIC
  const filteredSales = sales.filter(sale => {
    if (!startDate && !endDate) return true;
    
    const saleDate = new Date(sale.date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (end) end.setHours(23, 59, 59, 999);
    if (start) start.setHours(0, 0, 0, 0);

    if (start && saleDate < start) return false;
    if (end && saleDate > end) return false;
    
    return true;
  });
  
  const seatedCount = filteredSales.filter(s => s.seatId && s.seatId !== 'SOL').length;
  const floorCount = filteredSales.filter(s => s.seatId === 'SOL').length;
  const occupiedPoufs = filteredSales.filter(s => s.seatId && s.seatId.startsWith('P-')).length;
  const occupiedChairs = filteredSales.filter(s => s.seatId && s.seatId.startsWith('C-')).length;

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

  // --- SEATING PLAN LOGIC ---
  const Seat: React.FC<{ id: string, type: 'blue' | 'orange' | 'yellow' | 'pouf' | 'chair', label?: string, small?: boolean }> = ({ id, type, label, small }) => {
      const saleInfo = filteredSales.find(s => s.seatId === id);
      const isOccupied = !!saleInfo;
      
      let Icon = Circle;
      let baseClass = "relative group border rounded-lg flex flex-col items-center justify-center transition-all shadow-sm cursor-pointer";
      let colorClass = "";
      
      if (isOccupied) {
          colorClass = "bg-gray-800 text-gray-500 border-gray-600";
      } else {
          switch(type) {
              case 'blue': colorClass = "bg-blue-100 text-blue-600 border-blue-300 hover:bg-blue-200"; break;
              case 'orange': colorClass = "bg-orange-100 text-orange-600 border-orange-300 hover:bg-orange-200"; break;
              case 'yellow': colorClass = "bg-yellow-100 text-yellow-600 border-yellow-300 hover:bg-yellow-200"; break;
              case 'pouf': colorClass = "bg-purple-100 text-purple-600 border-purple-300 hover:bg-purple-200"; break;
              case 'chair': colorClass = "bg-teal-100 text-teal-600 border-teal-300 hover:bg-teal-200"; break;
          }
      }

      if (type === 'blue' || type === 'orange' || type === 'yellow') Icon = Sofa;
      if (type === 'chair') Icon = Square;

      const sizeClass = small ? "w-8 h-8 p-1.5" : "w-10 h-10 p-2";

      return (
          <div 
            onClick={() => openModal(saleInfo || undefined, id)}
            className={`${baseClass} ${colorClass} ${sizeClass}`}
            title={isOccupied ? `Occupé par ${saleInfo?.buyerName || 'Inconnu'}` : `Libre - ${id}`}
          >
              <Icon className="w-full h-full" />
               {/* Afficher l'ID au survol ou si besoin */}
          </div>
      );
  };

  const SofaGroup: React.FC<{ type: 'blue' | 'orange' | 'yellow', label: string, prefix: string }> = ({ type, label, prefix }) => {
      const seats = [1, 2, 3];
      const occupiedCount = seats.filter(n => filteredSales.some(s => s.seatId === `${prefix}-${n}`)).length;
      
      let containerClass = "";
      let textColor = "";
      
      switch(type) {
          case 'blue': 
             containerClass = "bg-blue-50 border-blue-200"; 
             textColor = "text-blue-600";
             break;
          case 'orange': 
             containerClass = "bg-orange-50 border-orange-200"; 
             textColor = "text-orange-600";
             break;
          case 'yellow': 
             containerClass = "bg-yellow-50 border-yellow-200"; 
             textColor = "text-yellow-600";
             break;
      }

      return (
          <div className="flex flex-col items-center gap-2">
              <div className={`p-2 md:p-3 rounded-xl border flex gap-1.5 md:gap-2 ${containerClass}`}>
                 {seats.map(n => (
                     <Seat key={`${prefix}-${n}`} id={`${prefix}-${n}`} type={type} label="" />
                 ))}
              </div>
              <div className="text-center">
                  <span className={`block text-[10px] md:text-sm font-bold uppercase tracking-wide ${textColor}`}>{label}</span>
                  <span className={`block text-[10px] md:text-xs text-gray-400 font-mono`}>
                      ({occupiedCount}/3)
                  </span>
              </div>
          </div>
      );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ShoppingBag className="text-bde-rose" /> Gestion Cinéma (Gratuit)
          </h2>
          <p className="text-gray-500">Liste des réservations et contrôle d'accès.</p>
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
                <button 
                    onClick={() => setShowSeatingPlan(!showSeatingPlan)} 
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition shadow-sm whitespace-nowrap border ${showSeatingPlan ? 'bg-bde-rose text-white border-bde-rose' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                    <MapIcon size={18} /> Plan Salle
                </button>
                <button onClick={() => openModal()} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition shadow-sm whitespace-nowrap">
                    <Plus size={18} /> Ajouter
                </button>
                <button onClick={() => generateCinemaReport(sortedSales)} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-bde-navy text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition shadow-sm whitespace-nowrap">
                    <Download size={18} /> PDF
                </button>
            </div>
        </div>
      </div>

      {/* PLAN DE SALLE */}
      {showSeatingPlan && (
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 mb-8 animate-fade-in-up">
            <div className="flex flex-col items-center">
                {/* ÉCRAN */}
                <div className="w-full max-w-2xl h-2 bg-gray-800 rounded-full mb-1 shadow-lg relative"></div>
                <div className="w-full max-w-2xl h-16 bg-gradient-to-b from-gray-200 to-transparent opacity-30 mb-12 transform perspective-1000 rotate-x-12"></div>
                <div className="text-gray-400 text-sm font-bold tracking-[0.5em] mb-8">ÉCRAN</div>

                <div className="space-y-10 w-full max-w-3xl">
                    
                    {/* Zone Floor/Sol */}
                     <div className="flex justify-center w-full mb-6">
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 w-full max-w-lg text-center">
                            <h4 className="font-bold text-indigo-800 flex items-center justify-center gap-2 mb-2">
                                <Bed size={20}/> Zone Sol / Couchette
                            </h4>
                            <p className="text-sm text-indigo-600">
                                {floorCount} inscrits
                            </p>
                        </div>
                     </div>

                    {/* Zone Fauteuils Colorés */}
                    <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
                         <SofaGroup type="blue" prefix="FB" label="Fauteuil Bleu" />
                         <SofaGroup type="orange" prefix="FO" label="Fauteuil Orange" />
                         <SofaGroup type="yellow" prefix="FJ" label="Fauteuil Jaune" />
                    </div>

                    {/* Zone Poufs (19 places) */}
                    <div className="w-full">
                        <div className="text-center text-xs text-gray-500 mb-2 font-bold uppercase tracking-widest">
                            Poufs <span className="text-purple-600 font-mono ml-1">({occupiedPoufs}/19)</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-2">
                            {Array.from({length: 19}).map((_, i) => (
                                <Seat key={`P-${i+1}`} id={`P-${i+1}`} type="pouf" label={`P${i+1}`} small />
                            ))}
                        </div>
                    </div>

                    {/* Zone Chaises (8 places - Arrière) */}
                    <div className="w-full pt-6 border-t border-dashed border-gray-200">
                         <div className="text-center text-xs text-gray-500 mb-2 font-bold uppercase tracking-widest">
                            Chaises (Fond) <span className="text-teal-600 font-mono ml-1">({occupiedChairs}/8)</span>
                         </div>
                         <div className="flex justify-center flex-wrap gap-2">
                            {Array.from({length: 8}).map((_, i) => (
                                <Seat key={`C-${i+1}`} id={`C-${i+1}`} type="chair" label={`C${i+1}`} small />
                            ))}
                         </div>
                    </div>
                </div>

                {/* Légende */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-10 text-[10px] text-gray-500 w-full max-w-3xl border-t border-gray-100 pt-6">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div> Fauteuil Bleu</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded"></div> Fauteuil Orange</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div> Fauteuil Jaune</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded-full"></div> Pouf</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-teal-100 border border-teal-300 rounded-sm"></div> Chaise</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-gray-800 border border-gray-600 rounded"></div> Occupé</div>
                </div>
            </div>
        </div>
      )}

      {/* Stats Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 flex flex-col sm:flex-row items-center gap-6 animate-fade-in-up">
        
        <div className="flex items-center gap-4 bg-purple-50 p-4 rounded-lg flex-1">
            <div className="p-3 bg-white text-purple-600 rounded-full shadow-sm">
                <Sofa size={24} />
            </div>
            <div>
                <p className="text-gray-500 font-medium text-xs uppercase tracking-wide">Places Assises</p>
                <h3 className="text-2xl font-bold text-bde-navy">{seatedCount} <span className="text-sm font-normal text-gray-400">réservées</span></h3>
            </div>
        </div>

        <div className="flex items-center gap-4 bg-indigo-50 p-4 rounded-lg flex-1">
            <div className="p-3 bg-white text-indigo-600 rounded-full shadow-sm">
                <Bed size={24} />
            </div>
            <div>
                <p className="text-gray-500 font-medium text-xs uppercase tracking-wide">Zone Sol</p>
                <h3 className="text-2xl font-bold text-bde-navy">{floorCount} <span className="text-sm font-normal text-gray-400">inscrits</span></h3>
            </div>
        </div>

        <div className="flex items-center gap-4 bg-green-50 p-4 rounded-lg flex-1">
            <div className="p-3 bg-white text-green-600 rounded-full shadow-sm">
                <Users size={24} />
            </div>
            <div>
                <p className="text-gray-500 font-medium text-xs uppercase tracking-wide">Total Invités</p>
                <h3 className="text-2xl font-bold text-bde-navy">{filteredSales.length}</h3>
            </div>
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
                        <th className="p-4">Place</th>
                        <th className="p-4">Invité(e)</th>
                        <th className="p-4">Statut</th>
                        <th className="p-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {sortedSales.map(sale => (
                        <tr key={sale.id} className="hover:bg-gray-50 transition">
                            <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                                {new Date(sale.date).toLocaleDateString('fr-FR')} {new Date(sale.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                            </td>
                            <td className="p-4">
                                {sale.seatId ? (
                                    <span className={`text-xs px-2 py-1 rounded font-bold ${
                                        sale.seatId.startsWith('FB') ? 'bg-blue-100 text-blue-700' : 
                                        sale.seatId.startsWith('FO') ? 'bg-orange-100 text-orange-700' : 
                                        sale.seatId.startsWith('FJ') ? 'bg-yellow-100 text-yellow-700' : 
                                        sale.seatId === 'SOL' ? 'bg-indigo-100 text-indigo-700' :
                                        'bg-gray-200 text-gray-700'
                                    }`}>
                                        {sale.seatId === 'SOL' ? 'Sol / Couchette' : sale.seatId}
                                    </span>
                                ) : (
                                    <span className="text-gray-300 text-xs">-</span>
                                )}
                            </td>
                            <td className="p-4 text-sm font-medium text-gray-800">{sale.buyerName || 'Inconnu'}</td>
                             <td className="p-4">
                                <button 
                                    onClick={() => handleToggleStatus(sale)}
                                    className={`text-xs px-2 py-1 rounded font-bold border flex items-center gap-1 transition-all ${
                                        sale.status === 'paid' 
                                            ? 'bg-green-50 text-green-600 border-green-200 hover:bg-orange-50 hover:text-orange-600' 
                                            : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-green-50 hover:text-green-600'
                                    }`}
                                >
                                    {sale.status === 'paid' ? <Check size={10} /> : <Clock size={10} />}
                                    {sale.status === 'paid' ? 'Pointé' : 'En attente'}
                                </button>
                            </td>
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
                            <td colSpan={5} className="p-8 text-center text-gray-500">
                                {sales.length > 0 ? "Aucune réservation trouvée pour cette période." : "Aucune réservation enregistrée."}
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
                <h3 className="font-bold text-xl text-bde-navy mb-6">{editingSale ? 'Modifier la Réservation' : 'Ajouter une Réservation'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {selectedSeat && (
                        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg font-bold text-center mb-4">
                            Place sélectionnée : {selectedSeat}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Type</label>
                        <select className={selectStyle} value={itemName} onChange={e => setItemName(e.target.value)}>
                            <option value="Ticket Gratuit" className="bg-bde-navy">Ticket Gratuit</option>
                            <option value="Autre" className="bg-bde-navy">Autre</option>
                        </select>
                    </div>

                    <div>
                         <label className="block text-sm font-bold text-gray-700 mb-1">Siège (Optionnel)</label>
                         <input type="text" className={inputStyle} value={selectedSeat} onChange={e => setSelectedSeat(e.target.value)} placeholder="Ex: FB-1, SOL" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Nom Invité</label>
                        <input type="text" className={inputStyle} value={buyerName} onChange={e => setBuyerName(e.target.value)} placeholder="Ex: Jean" />
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
