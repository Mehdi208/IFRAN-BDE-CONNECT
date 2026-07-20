import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { AssinieRegistration } from '../../types';
import { ArrowLeft, Trash2, Search, Edit2, CheckSquare, Square, Download } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';

const AdminAssinie = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<AssinieRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Edit/Add Modal
  const levels = ["B1 COM", "B1 CREA", "B1 DEV", "B2 COM", "B2 CREA", "B2 DEV", "B3 COM", "B3 CREA", "B3 DEV", "Master 1", "Master 2"];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReg, setEditingReg] = useState<AssinieRegistration | null>(null);
  const [formData, setFormData] = useState<Partial<AssinieRegistration>>({
    studentName: '', studentClass: '', phone: '', needsGlaciere: false
  });

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const data = await dataService.fetchAssinieRegistrations();
      setRegistrations(data);
    } catch (error) {
      console.error("Error fetching registrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette inscription ?')) {
      try {
        const newData = await dataService.deleteAssinieRegistration(id);
        setRegistrations(newData);
        setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      } catch (error) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  const handleMassDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Supprimer ces ${selectedIds.length} inscriptions ?`)) {
      try {
        // Fallback for mass delete: iterate over delete
        let currentData = registrations;
        for (const id of selectedIds) {
          currentData = await dataService.deleteAssinieRegistration(id);
        }
        setRegistrations(currentData);
        setSelectedIds([]);
        setIsSelectionMode(false);
      } catch (error) {
        alert("Erreur lors de la suppression en masse");
      }
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const openAddModal = () => {
    setEditingReg(null);
    setFormData({ studentName: '', studentClass: '', phone: '', needsGlaciere: false });
    setIsModalOpen(true);
  };

  const openEditModal = (reg: AssinieRegistration) => {
    setEditingReg(reg);
    setFormData(reg);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName || !formData.studentClass || !formData.phone) return;
    try {
      if (editingReg) {
        const newData = await dataService.updateAssinieRegistration({ 
          ...(formData as AssinieRegistration),
          id: editingReg.id!
        });
        setRegistrations(newData);
      } else {
        const newData = await dataService.addAssinieRegistration({
          ...(formData as Omit<AssinieRegistration, 'id'>),
          registrationDate: new Date().toISOString()
        });
        setRegistrations(newData);
      }
      setIsModalOpen(false);
    } catch (error) {
      alert("Erreur lors de l'enregistrement");
    }
  };

  const filteredRegistrations = registrations.filter(r => 
    r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.studentClass.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.phone.includes(searchTerm)
  ).sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime());

  if (loading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-8 max-w-7xl mx-auto min-h-screen bg-transparent">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate('/admin/dashboard')}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-bde-navy">Inscriptions Sortie Assinie</h1>
        </div>

        {/* The rest of the content */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher (Nom, Classe, Téléphone)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ACC1] focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-[#00838F] text-white rounded-lg text-sm font-medium hover:bg-[#006064] transition-colors"
            >
              Ajouter une inscription
            </button>
            <button
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) setSelectedIds([]);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                isSelectionMode 
                  ? 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' 
                  : 'bg-white text-bde-navy border-gray-200 hover:bg-gray-50'
              }`}
            >
              {isSelectionMode ? 'Annuler' : 'Sélection multiple'}
            </button>
            {isSelectionMode && selectedIds.length > 0 && (
              <button
                onClick={handleMassDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} />
                Supprimer ({selectedIds.length})
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 text-left text-sm font-semibold text-gray-600">
                {isSelectionMode && <th className="p-4 w-12"></th>}
                <th className="p-4 rounded-tl-lg">Nom</th>
                <th className="p-4">Filière / Classe</th>
                <th className="p-4">Téléphone</th>
                <th className="p-4">Glacière ?</th>
                <th className="p-4">Date</th>
                <th className="p-4 rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRegistrations.map((reg) => (
                <tr key={reg.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(reg.id) ? 'bg-[#E0F7FA]/30' : ''}`}>
                  {isSelectionMode && (
                    <td className="p-4 cursor-pointer" onClick={() => toggleSelection(reg.id)}>
                      {selectedIds.includes(reg.id) ? (
                        <CheckSquare className="text-[#00ACC1]" size={20} />
                      ) : (
                        <Square className="text-gray-400" size={20} />
                      )}
                    </td>
                  )}
                  <td className="p-4 font-medium text-gray-900">{reg.studentName}</td>
                  <td className="p-4 text-gray-600">{reg.studentClass}</td>
                  <td className="p-4 text-gray-600 font-mono text-sm">{reg.phone}</td>
                  <td className="p-4">
                    {reg.needsGlaciere ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Oui</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">Non</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(reg.registrationDate).toLocaleDateString('fr-FR')} à {new Date(reg.registrationDate).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => openEditModal(reg)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(reg.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRegistrations.length === 0 && (
                <tr>
                  <td colSpan={isSelectionMode ? 7 : 6} className="p-8 text-center text-gray-500">
                    Aucune inscription trouvée.
                  </td>
                </tr>
              )}
            </tbody>
            {filteredRegistrations.length > 0 && (
              <tfoot className="bg-gray-50 border-t border-gray-100">
                <tr>
                  <td colSpan={isSelectionMode ? 7 : 6} className="p-4 text-right text-sm font-semibold text-gray-600">
                    Total: {filteredRegistrations.length} participant(s)
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-bde-navy mb-6">
              {editingReg ? "Modifier l'inscription" : "Nouvelle inscription"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <input 
                  type="text" required
                  value={formData.studentName || ''}
                  onChange={e => setFormData({...formData, studentName: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ACC1]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Classe</label>
                <select 
                  required
                  value={formData.studentClass || ''}
                  onChange={e => setFormData({...formData, studentClass: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ACC1]"
                >
                  <option value="" disabled>Sélectionnez une classe</option>
                  {levels.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                  <option value="Externe (Invité)">Externe (Invité)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input 
                  type="text" required
                  value={formData.phone || ''}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ACC1]"
                />
              </div>
              <div className="pt-2">
                <label className="flex items-center gap-3 mb-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.needsGlaciere || false}
                    onChange={e => setFormData({...formData, needsGlaciere: e.target.checked})}
                    className="w-4 h-4 text-[#00ACC1] rounded"
                  />
                  <span className="text-sm">Apporte une glacière</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#00838F] text-white rounded-lg hover:bg-[#006064]"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAssinie;
