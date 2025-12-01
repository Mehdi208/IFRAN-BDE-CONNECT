import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { dataService } from '../../services/dataService';
import { Student } from '../../types';
import { Download, Search, CheckCircle, XCircle, Plus, Trash2, Edit, Filter, AlertTriangle, FileText } from 'lucide-react';
import { generateCotisationReport, generatePaymentReceipt } from '../../services/pdfService';

const AdminContributions = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);

  // Delete States
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [modalDeleteConfirm, setModalDeleteConfirm] = useState(false);

  // Filters
  const [filterLevel, setFilterLevel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [level, setLevel] = useState('Prépa 1');
  const [paymentType, setPaymentType] = useState<'Mensuel' | 'Ponctuel'>('Mensuel');
  const [amount, setAmount] = useState<string>('4000'); 
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const levels = [
    "Prépa 1", "Prépa 2", 
    "Prépa Com", "Prépa Dev", "Prépa Créa",
    "B2 Com", "B2 Dev", "B2 Créa",
    "B3 Com", "B3 Dev", "B3 Créa",
    "Master 1", "Master 2"
  ];

  const inputStyle = "w-full bg-bde-navy text-white border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-bde-rose outline-none placeholder-gray-400";
  const selectStyle = "w-full bg-bde-navy text-white border border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-bde-rose outline-none";

  const loadData = async () => {
    setLoading(true);
    const data = await dataService.fetchStudents();
    setStudents(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update amount when payment type changes
  useEffect(() => {
    if (paymentType === 'Mensuel') {
        setAmount('4000');
    }
  }, [paymentType]);

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setName(student.name);
    setLevel(student.level);
    setPaymentType(student.paymentType === 'Ponctuel' ? 'Ponctuel' : 'Mensuel');
    setAmount(student.amount ? student.amount.toString() : '4000');
    setDate(student.paymentDate || new Date().toISOString().split('T')[0]);
    setShowAddForm(true);
  };

  const openAddModal = () => {
    setEditingStudent(null);
    setName('');
    setLevel('Prépa 1');
    setPaymentType('Mensuel');
    setAmount('4000');
    setDate(new Date().toISOString().split('T')[0]);
    setShowAddForm(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseInt(amount);
    const isPaid = amountVal > 0;

    if (editingStudent) {
        // Edit existing
        const updated: Student = {
            ...editingStudent,
            name,
            level,
            hasPaid: isPaid,
            amount: amountVal,
            paymentType,
            paymentDate: isPaid ? date : undefined
        };
        const newList = await dataService.updateStudent(updated);
        setStudents(newList);
    } else {
        // Add new
        const newStudent = {
          name,
          level,
          hasPaid: isPaid,
          amount: amountVal,
          paymentType,
          paymentDate: isPaid ? date : undefined
        };
        const newList = await dataService.addStudent(newStudent);
        setStudents(newList);
    }
    setShowAddForm(false);
  };

  // Suppression sécurisée
  const handleDeleteStudent = async (id: string) => {
    const newList = await dataService.deleteStudent(id);
    setStudents(newList);
    setDeleteConfirmId(null);
    if(showAddForm) setShowAddForm(false);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.level.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'all' || s.level === filterLevel;
    const matchesStatus = filterStatus === 'all' 
                          || (filterStatus === 'paid' && s.hasPaid)
                          || (filterStatus === 'unpaid' && !s.hasPaid);
    const matchesDate = !filterDate || (s.paymentDate === filterDate);
    return matchesSearch && matchesLevel && matchesStatus && matchesDate;
  });

  return (
    <AdminLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestion des Cotisations</h2>
          <p className="text-gray-500">Suivi des paiements étudiants {loading && ' (Chargement...)'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <button 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition shadow-sm"
          >
            <Plus size={18} />
            Ajouter
          </button>
          <button 
            onClick={() => generateCotisationReport(filteredStudents)}
            className="flex items-center gap-2 bg-bde-navy text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition shadow-sm"
          >
            <Download size={18} />
            Rapport PDF
          </button>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up">
            <h3 className="font-bold text-xl mb-6 text-bde-navy">{editingStudent ? 'Modifier étudiant' : 'Enregistrer une cotisation'}</h3>
            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nom complet</label>
                <input 
                  type="text" required 
                  className={inputStyle}
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="Ex: Kouamé Jean"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Niveau</label>
                <select 
                  className={selectStyle}
                  value={level} onChange={e => setLevel(e.target.value)}
                >
                   {levels.map(l => <option key={l} value={l} className="bg-bde-navy text-white">{l}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Type Paiement</label>
                    <select 
                        className={selectStyle}
                        value={paymentType} 
                        onChange={e => setPaymentType(e.target.value as any)}
                    >
                        <option value="Mensuel" className="bg-bde-navy">Mensuel (4000F)</option>
                        <option value="Ponctuel" className="bg-bde-navy">Ponctuel (Autre)</option>
                    </select>
                 </div>
                 <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Montant (FCFA)</label>
                   <input 
                     type="number" 
                     className={`${inputStyle} ${paymentType === 'Mensuel' ? 'opacity-70 cursor-not-allowed' : ''}`}
                     value={amount} 
                     onChange={e => setAmount(e.target.value)}
                     min="0"
                     readOnly={paymentType === 'Mensuel'}
                   />
                </div>
              </div>

              <div>
                   <label className="block text-sm font-bold text-gray-700 mb-1">Date de Paiement</label>
                   <input 
                     type="date" 
                     className={`${inputStyle} [color-scheme:dark]`}
                     value={date} onChange={e => setDate(e.target.value)}
                   />
              </div>
              
              <div className="flex justify-between items-center mt-6 pt-4 border-t">
                 {/* Delete button logic inside modal */}
                 <div>
                    {editingStudent && (
                        !modalDeleteConfirm ? (
                             <button 
                                type="button" 
                                onClick={() => setModalDeleteConfirm(true)}
                                className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold hover:bg-red-100 transition flex items-center gap-2 border border-red-200"
                            >
                                <Trash2 size={18} /> Supprimer
                            </button>
                        ) : (
                            <button 
                                type="button" 
                                onClick={() => handleDeleteStudent(editingStudent.id)}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition flex items-center gap-2 animate-pulse"
                            >
                                <AlertTriangle size={18} /> Confirmer ?
                            </button>
                        )
                    )}
                 </div>

                <div className="flex gap-3">
                    <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium">Annuler</button>
                    <button type="submit" className="bg-bde-navy text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-900 transition shadow-lg">Enregistrer</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex items-center gap-2 text-bde-navy font-bold min-w-fit">
            <Filter size={18} />
            Filtres :
        </div>
        
        <select 
            value={filterLevel} 
            onChange={(e) => setFilterLevel(e.target.value)}
            className="bg-bde-navy text-white px-3 py-2 rounded-lg text-sm border-none focus:ring-2 focus:ring-bde-rose outline-none"
        >
            <option value="all">Tous les niveaux</option>
            {levels.map(l => <option key={l} value={l}>{l}</option>)}
        </select>

        <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-bde-navy text-white px-3 py-2 rounded-lg text-sm border-none focus:ring-2 focus:ring-bde-rose outline-none"
        >
            <option value="all">Tous les statuts</option>
            <option value="paid">Payé</option>
            <option value="unpaid">En attente</option>
        </select>

        <input 
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-bde-navy text-white px-3 py-2 rounded-lg text-sm border-none focus:ring-2 focus:ring-bde-rose outline-none placeholder-gray-300 [color-scheme:dark]"
            placeholder="Date de paiement"
        />

        {(filterLevel !== 'all' || filterStatus !== 'all' || filterDate) && (
            <button 
                onClick={() => { setFilterLevel('all'); setFilterStatus('all'); setFilterDate(''); }}
                className="text-sm text-red-500 hover:underline ml-auto"
            >
                Effacer filtres
            </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-white">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un étudiant..." 
              className="pl-10 pr-4 py-2 bg-bde-navy text-white border border-gray-600 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-bde-rose placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse bg-white">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm font-medium">
                <th className="p-4">Étudiant</th>
                <th className="p-4">Niveau</th>
                <th className="p-4">Statut</th>
                <th className="p-4">Info Paiement</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-gray-50 transition group">
                  <td className="p-4 font-medium text-gray-800">{student.name}</td>
                  <td className="p-4 text-gray-600">{student.level}</td>
                  <td className="p-4">
                    {student.hasPaid ? (
                      <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-semibold">
                        <CheckCircle size={12} /> Payé ({student.amount} F)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-500 bg-red-50 px-2 py-1 rounded text-xs font-semibold">
                        <XCircle size={12} /> En attente
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-gray-500 text-sm">
                    {student.hasPaid ? (
                        <div className="flex flex-col">
                            <span>{student.paymentDate}</span>
                            <span className="text-xs text-bde-rose">{student.paymentType || 'Mensuel'}</span>
                        </div>
                    ) : '-'}
                  </td>
                  <td className="p-4 text-right flex items-center justify-end gap-2">
                    {student.hasPaid && (
                        <button 
                            onClick={() => generatePaymentReceipt(student)}
                            className="text-blue-600 bg-blue-50 hover:bg-blue-100 p-2 rounded transition"
                            title="Télécharger le reçu"
                        >
                            <FileText size={16} />
                        </button>
                    )}
                    
                    <button
                        type="button"
                        onClick={() => openEditModal(student)}
                        className="text-gray-400 hover:text-blue-500 transition p-2 cursor-pointer"
                        title="Modifier"
                    >
                        <Edit size={18} />
                    </button>
                    
                    {deleteConfirmId === student.id ? (
                        <button 
                            type="button"
                            onClick={() => handleDeleteStudent(student.id)}
                            className="bg-red-500 text-white text-xs px-2 py-1 rounded hover:bg-red-600 transition animate-pulse"
                        >
                            Confirmer ?
                        </button>
                    ) : (
                        <button 
                          type="button"
                          onClick={() => {
                              setDeleteConfirmId(student.id);
                              setTimeout(() => setDeleteConfirmId(null), 3000);
                          }}
                          className="text-gray-400 hover:text-red-500 transition p-2 cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 size={18} />
                        </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminContributions;