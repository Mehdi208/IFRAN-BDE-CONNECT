
import React, { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { FileText, Download, Mail, DollarSign, Calendar, Clock, RefreshCw } from 'lucide-react';
import { dataService } from '../../services/dataService';
import { generateEmailPDF, generateMeetingPDF, generateFinanceReport } from '../../services/pdfService';
import { DocumentRecord } from '../../types';

const AdminDocuments = () => {
  const [activeTab, setActiveTab] = useState<'none' | 'email' | 'meeting' | 'finance'>('none');
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<DocumentRecord[]>([]);

  // Finance Date Range
  const [finStartDate, setFinStartDate] = useState(new Date(new Date().getFullYear(), 8, 1).toISOString().split('T')[0]);
  const [finEndDate, setFinEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Email Validation Form State
  const [evtName, setEvtName] = useState('');
  const [evtObj, setEvtObj] = useState('');
  const [evtDate, setEvtDate] = useState('');
  const [evtTime, setEvtTime] = useState('');
  const [evtPlace, setEvtPlace] = useState('');
  const [evtBudget, setEvtBudget] = useState('');
  const [evtResp, setEvtResp] = useState('');
  const [evtDesc, setEvtDesc] = useState('');

  // Meeting Form State
  const [meetDate, setMeetDate] = useState('');
  const [meetTime, setMeetTime] = useState('');
  const [meetPlace, setMeetPlace] = useState('');
  const [meetPresent, setMeetPresent] = useState('');
  const [meetAbsent, setMeetAbsent] = useState('');
  const [meetAgenda, setMeetAgenda] = useState('');
  const [meetPoints, setMeetPoints] = useState('');
  const [meetDecisions, setMeetDecisions] = useState('');

  // Styles
  const inputStyle = "w-full bg-bde-navy text-white border border-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-bde-rose outline-none placeholder-gray-400";
  const labelStyle = "block text-base font-extrabold text-bde-navy mb-2 uppercase tracking-wide"; 

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const recs = await dataService.fetchDocumentRecords();
    setHistory(recs);
  };

  const handleGenerateEmail = async () => {
    const data = { evtName, evtObj, evtDate, evtTime, evtPlace, evtBudget, evtResp, evtDesc };
    generateEmailPDF(data);
    await dataService.addDocumentRecord({
        type: 'email',
        title: `Validation - ${evtName}`,
        date: new Date().toISOString(),
        data: data
    });
    loadHistory();
  };

  const handleGenerateMeeting = async () => {
    const data = { meetDate, meetTime, meetPlace, meetPresent, meetAbsent, meetAgenda, meetPoints, meetDecisions };
    generateMeetingPDF(data);
    await dataService.addDocumentRecord({
        type: 'meeting',
        title: `CR Réunion - ${meetDate}`,
        date: new Date().toISOString(),
        data: data
    });
    loadHistory();
  };

  const handleGenerateFinance = async () => {
     setIsGenerating(true);
     const students = await dataService.fetchStudents(); // ASYNC fetch current data
     const data = { start: finStartDate, end: finEndDate };
     generateFinanceReport(students, data);
     
     await dataService.addDocumentRecord({
        type: 'finance',
        title: `Bilan Financier (${finStartDate} - ${finEndDate})`,
        date: new Date().toISOString(),
        data: data
     });
     loadHistory();
     setIsGenerating(false);
  };

  const handleRegenerate = async (record: DocumentRecord) => {
      if (record.type === 'email') {
          generateEmailPDF(record.data);
      } else if (record.type === 'meeting') {
          generateMeetingPDF(record.data);
      } else if (record.type === 'finance') {
          setIsGenerating(true);
          // For finance, we re-fetch student data to allow regeneration with potentially corrected data, 
          // keeping the date range from history.
          const students = await dataService.fetchStudents();
          generateFinanceReport(students, record.data);
          setIsGenerating(false);
      }
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-bde-navy">Générateur de Documents</h2>
        <p className="text-gray-600 font-medium">Créez vos documents officiels en quelques clics</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <button onClick={() => setActiveTab('email')} className={`p-6 rounded-xl border-2 transition text-center ${activeTab === 'email' ? 'border-bde-rose bg-red-50 shadow-md transform scale-105' : 'bg-white border-gray-200 hover:border-bde-navy hover:shadow'}`}>
           <Mail className={`mx-auto mb-2 ${activeTab === 'email' ? 'text-bde-rose' : 'text-bde-navy'}`} size={32}/>
           <h3 className="font-bold text-lg text-bde-navy">Demande de Validation</h3>
        </button>
        <button onClick={() => setActiveTab('meeting')} className={`p-6 rounded-xl border-2 transition text-center ${activeTab === 'meeting' ? 'border-bde-rose bg-red-50 shadow-md transform scale-105' : 'bg-white border-gray-200 hover:border-bde-navy hover:shadow'}`}>
           <Calendar className={`mx-auto mb-2 ${activeTab === 'meeting' ? 'text-bde-rose' : 'text-bde-navy'}`} size={32}/>
           <h3 className="font-bold text-lg text-bde-navy">Compte Rendu Réunion</h3>
        </button>
        <button onClick={() => setActiveTab('finance')} className={`p-6 rounded-xl border-2 transition text-center ${activeTab === 'finance' ? 'border-bde-rose bg-red-50 shadow-md transform scale-105' : 'bg-white border-gray-200 hover:border-bde-navy hover:shadow'}`}>
           <DollarSign className={`mx-auto mb-2 ${activeTab === 'finance' ? 'text-bde-rose' : 'text-bde-navy'}`} size={32}/>
           <h3 className="font-bold text-lg text-bde-navy">Bilan Financier</h3>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 mb-12">
        
        {activeTab === 'none' && (
            <div className="text-center text-gray-500 font-medium py-12 text-lg">Sélectionnez un type de document ci-dessus pour commencer.</div>
        )}

        {activeTab === 'finance' && (
            <div className="max-w-xl mx-auto text-center">
                <h3 className="text-2xl font-bold mb-4 text-bde-navy border-b-2 border-bde-rose inline-block pb-2">Bilan Financier Automatique</h3>
                <p className="mb-6 text-gray-700 font-medium">Sélectionnez la période pour générer le rapport des cotisations encaissées.</p>
                
                <div className="flex items-center justify-center gap-4 mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200">
                    <div className="text-left">
                        <label className={labelStyle}>Du</label>
                        <input type="date" className={inputStyle} value={finStartDate} onChange={e => setFinStartDate(e.target.value)} />
                    </div>
                    <span className="mt-8 font-bold text-gray-400 text-xl">-</span>
                    <div className="text-left">
                        <label className={labelStyle}>Au</label>
                        <input type="date" className={inputStyle} value={finEndDate} onChange={e => setFinEndDate(e.target.value)} />
                    </div>
                </div>

                <button 
                    onClick={handleGenerateFinance} 
                    disabled={isGenerating}
                    className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-700 shadow-lg flex items-center gap-3 mx-auto transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isGenerating ? <span className="animate-spin">⌛</span> : <Download size={24} />} 
                    {isGenerating ? 'Génération...' : 'Générer & Sauvegarder'}
                </button>
            </div>
        )}

        {activeTab === 'email' && (
            <div className="max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold mb-8 text-center text-bde-navy border-b border-gray-200 pb-4">Détails de l'événement</h3>
                <div className="space-y-6">
                    <div>
                      <label className={labelStyle}>Nom de l'activité</label>
                      <input type="text" className={inputStyle} value={evtName} onChange={e => setEvtName(e.target.value)} />
                    </div>
                    <div>
                      <label className={labelStyle}>Objectif</label>
                      <input type="text" className={inputStyle} value={evtObj} onChange={e => setEvtObj(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className={labelStyle}>Date</label>
                          <input type="date" className={inputStyle} value={evtDate} onChange={e => setEvtDate(e.target.value)} />
                        </div>
                        <div>
                          <label className={labelStyle}>Horaire</label>
                          <input type="text" placeholder="Ex: 14h-17h" className={inputStyle} value={evtTime} onChange={e => setEvtTime(e.target.value)} />
                        </div>
                    </div>
                    <div>
                      <label className={labelStyle}>Lieu</label>
                      <input type="text" className={inputStyle} value={evtPlace} onChange={e => setEvtPlace(e.target.value)} />
                    </div>
                    <div>
                      <label className={labelStyle}>Budget estimatif</label>
                      <input type="text" className={inputStyle} value={evtBudget} onChange={e => setEvtBudget(e.target.value)} />
                    </div>
                    <div>
                      <label className={labelStyle}>Responsables</label>
                      <input type="text" className={inputStyle} value={evtResp} onChange={e => setEvtResp(e.target.value)} />
                    </div>
                    <div>
                      <label className={labelStyle}>Description (3-4 lignes)</label>
                      <textarea className={inputStyle} style={{height: '120px'}} value={evtDesc} onChange={e => setEvtDesc(e.target.value)}></textarea>
                    </div>
                    
                    <button onClick={handleGenerateEmail} className="w-full bg-bde-navy text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-900 shadow-lg mt-6 transition transform hover:scale-105">
                        Générer l'Email (PDF)
                    </button>
                </div>
            </div>
        )}

        {activeTab === 'meeting' && (
            <div className="max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold mb-8 text-center text-bde-navy border-b border-gray-200 pb-4">Détails de la Réunion</h3>
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                          <label className={labelStyle}>Date</label>
                          <input type="date" className={inputStyle} value={meetDate} onChange={e => setMeetDate(e.target.value)} />
                        </div>
                        <div>
                          <label className={labelStyle}>Heure</label>
                          <input type="text" className={inputStyle} value={meetTime} onChange={e => setMeetTime(e.target.value)} />
                        </div>
                    </div>
                    <div>
                      <label className={labelStyle}>Lieu</label>
                      <input type="text" className={inputStyle} value={meetPlace} onChange={e => setMeetPlace(e.target.value)} />
                    </div>
                    <div>
                      <label className={labelStyle}>Présents</label>
                      <input type="text" placeholder="Séparés par virgules" className={inputStyle} value={meetPresent} onChange={e => setMeetPresent(e.target.value)} />
                    </div>
                    <div>
                      <label className={labelStyle}>Absents</label>
                      <input type="text" className={inputStyle} value={meetAbsent} onChange={e => setMeetAbsent(e.target.value)} />
                    </div>
                    
                    <div className="border-t-2 border-gray-100 pt-6 mt-6">
                        <label className={labelStyle}>Ordre du jour (1 par ligne)</label>
                        <textarea className={inputStyle} style={{height: '100px'}} value={meetAgenda} onChange={e => setMeetAgenda(e.target.value)}></textarea>
                    </div>
                    <div>
                        <label className={labelStyle}>Points Discutés (1 par ligne)</label>
                        <textarea className={inputStyle} style={{height: '120px'}} value={meetPoints} onChange={e => setMeetPoints(e.target.value)}></textarea>
                    </div>
                    <div>
                        <label className={labelStyle}>Décisions Prises (1 par ligne)</label>
                        <textarea className={inputStyle} style={{height: '100px'}} value={meetDecisions} onChange={e => setMeetDecisions(e.target.value)}></textarea>
                    </div>

                    <button onClick={handleGenerateMeeting} className="w-full bg-bde-navy text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-900 shadow-lg mt-6 transition transform hover:scale-105">
                        Générer le Compte Rendu (PDF)
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* History Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <h3 className="text-xl font-bold text-bde-navy mb-6 flex items-center gap-2">
            <Clock size={24} /> Historique des documents générés
        </h3>
        
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-sm">
                    <tr>
                        <th className="p-4">Date</th>
                        <th className="p-4">Document</th>
                        <th className="p-4">Type</th>
                        <th className="p-4 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {history.map(record => (
                        <tr key={record.id} className="hover:bg-gray-50 transition">
                            <td className="p-4 text-sm text-gray-600">
                                {new Date(record.date).toLocaleDateString('fr-FR')} {new Date(record.date).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                            </td>
                            <td className="p-4 font-medium text-gray-800">{record.title}</td>
                            <td className="p-4">
                                <span className={`text-xs px-2 py-1 rounded font-bold uppercase 
                                    ${record.type === 'email' ? 'bg-blue-100 text-blue-700' : 
                                      record.type === 'meeting' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                    {record.type}
                                </span>
                            </td>
                            <td className="p-4 text-right">
                                <button 
                                    onClick={() => handleRegenerate(record)}
                                    className="inline-flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded transition"
                                >
                                    <RefreshCw size={14} /> Re-télécharger
                                </button>
                            </td>
                        </tr>
                    ))}
                    {history.length === 0 && (
                        <tr>
                            <td colSpan={4} className="p-8 text-center text-gray-400">Aucun historique disponible.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDocuments;
