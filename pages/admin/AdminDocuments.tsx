import React, { useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { FileText, Download, Mail, DollarSign, Calendar } from 'lucide-react';
import { dataService } from '../../services/dataService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminDocuments = () => {
  const [activeTab, setActiveTab] = useState<'none' | 'email' | 'meeting' | 'finance'>('none');

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

  // Styles - UPDATED FOR HIGH VISIBILITY
  const inputStyle = "w-full bg-bde-navy text-white border border-gray-600 p-3 rounded-lg focus:ring-2 focus:ring-bde-rose outline-none placeholder-gray-400";
  // Changed label color to BDE Navy and increased weight
  const labelStyle = "block text-base font-extrabold text-bde-navy mb-2 uppercase tracking-wide"; 

  const generateEmailPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(0, 51, 153); // Blue
    doc.text("EMAIL OFFICIEL DE DEMANDE DE VALIDATION", 105, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text(`Objet : Demande de validation – ${evtName}`, 20, 40);
    
    doc.setFontSize(12);
    doc.text("Madame / Monsieur,", 20, 50);
    doc.text("Conformément au règlement du Bureau des Étudiants d’IFRAN, je sollicite par la présente la", 20, 60);
    doc.text("validation de l’activité suivante :", 20, 65);
    
    let y = 80;
    const lineHeight = 8;
    
    doc.setFont("helvetica", "bold"); doc.text("Nom de l’activité :", 20, y); doc.setFont("helvetica", "normal"); doc.text(evtName, 70, y); y+=lineHeight;
    doc.setFont("helvetica", "bold"); doc.text("Objectif :", 20, y); doc.setFont("helvetica", "normal"); doc.text(evtObj, 70, y); y+=lineHeight;
    doc.setFont("helvetica", "bold"); doc.text("Date proposée :", 20, y); doc.setFont("helvetica", "normal"); doc.text(evtDate, 70, y); y+=lineHeight;
    doc.setFont("helvetica", "bold"); doc.text("Horaire :", 20, y); doc.setFont("helvetica", "normal"); doc.text(evtTime, 70, y); y+=lineHeight;
    doc.setFont("helvetica", "bold"); doc.text("Lieu :", 20, y); doc.setFont("helvetica", "normal"); doc.text(evtPlace, 70, y); y+=lineHeight;
    doc.setFont("helvetica", "bold"); doc.text("Budget estimatif :", 20, y); doc.setFont("helvetica", "normal"); doc.text(evtBudget, 70, y); y+=lineHeight;
    doc.setFont("helvetica", "bold"); doc.text("Responsables :", 20, y); doc.setFont("helvetica", "normal"); doc.text(evtResp, 70, y); y+=lineHeight+5;
    
    doc.setFont("helvetica", "bold"); doc.text("Description :", 20, y); y+=lineHeight;
    doc.setFont("helvetica", "normal"); 
    const descLines = doc.splitTextToSize(evtDesc, 170);
    doc.text(descLines, 20, y);
    y += (descLines.length * 7) + 10;
    
    const footerText = doc.splitTextToSize("L’activité s’inscrit dans le cadre du plan annuel du BDE 2025–2026. Nous restons disponibles pour toute modification ou précision nécessaire.", 170);
    doc.text(footerText, 20, y);
    y += 20;
    
    doc.text("Cordialement,", 20, y); y+=10;
    doc.setFont("helvetica", "bold");
    doc.text("Traoré Abdou-Rahmane Méhdi", 20, y); y+=7;
    doc.text("Président du BDE IFRAN 2025–2026", 20, y); y+=7;
    doc.setFont("helvetica", "normal");
    doc.text("Contact : +225 07 89 60 96 72", 20, y); y+=7;
    doc.text("Email : traoremehdi6@gmail.com", 20, y);

    doc.save(`Demande_Validation_${evtName.replace(/\s+/g, '_')}.pdf`);
  };

  const generateMeetingPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFillColor(15, 30, 58); // Navy
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text("COMPTE RENDU – RÉUNION DU BDE IFRAN", 105, 20, { align: 'center' });
    
    doc.setTextColor(0);
    doc.setFontSize(11);
    let y = 45;
    
    doc.text(`Date : ${meetDate}`, 20, y);
    doc.text(`Heure : ${meetTime}`, 80, y);
    doc.text(`Lieu : ${meetPlace}`, 140, y);
    y += 10;
    
    doc.text(`Présents : ${meetPresent}`, 20, y); y+=7;
    doc.text(`Absents : ${meetAbsent}`, 20, y); y+=15;
    
    // Sections helper
    const addSection = (title: string, content: string) => {
        doc.setFillColor(231, 74, 103); // Rose
        doc.rect(20, y, 170, 8, 'F');
        doc.setTextColor(255);
        doc.setFont("helvetica", "bold");
        doc.text(title, 25, y+6);
        y += 15;
        doc.setTextColor(0);
        doc.setFont("helvetica", "normal");
        
        const lines = content.split('\n');
        lines.forEach(line => {
            doc.text(`• ${line}`, 25, y);
            y += 7;
        });
        y += 5;
    };
    
    addSection("1. Ordre du jour", meetAgenda);
    addSection("2. Points discutés", meetPoints);
    addSection("3. Décisions prises", meetDecisions);
    
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Traoré Abdou-Rahmane Méhdi", 130, y); y+=6;
    doc.setFontSize(10);
    doc.text("Président BDE IFRAN", 130, y);
    
    doc.save(`Compte_Rendu_${meetDate}.pdf`);
  };

  const generateFinanceReport = () => {
     const students = dataService.getStudents();
     
     // Filter by date
     const start = new Date(finStartDate);
     const end = new Date(finEndDate);
     end.setHours(23, 59, 59);

     const filteredStudents = students.filter(s => {
         if(!s.paymentDate) return false;
         const pDate = new Date(s.paymentDate);
         return pDate >= start && pDate <= end;
     });

     const totalCollected = filteredStudents.reduce((acc, s) => acc + (s.amount || 0), 0);

     const doc = new jsPDF();
     
     doc.setFontSize(20);
     doc.text("Bilan Financier BDE", 105, 20, { align: 'center' });
     
     doc.setFontSize(12);
     doc.text(`Période du : ${finStartDate} au ${finEndDate}`, 105, 30, { align: 'center' });
     
     doc.text(`Total Collecté sur la période : ${totalCollected.toLocaleString()} FCFA`, 20, 50);

     // Table details
     const tableBody = filteredStudents.map(s => [
        s.paymentDate,
        s.name,
        s.level,
        `${s.amount} FCFA`
     ]);
     
     autoTable(doc, {
        startY: 60,
        head: [['Date', 'Étudiant', 'Niveau', 'Montant']],
        body: tableBody,
        theme: 'striped',
        headStyles: { fillColor: [15, 30, 58] }
     });
     
     doc.save(`Bilan_Financier_${finStartDate}_${finEndDate}.pdf`);
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

      {/* Forms Area */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        
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

                <button onClick={generateFinanceReport} className="bg-green-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-700 shadow-lg flex items-center gap-3 mx-auto transition transform hover:scale-105">
                    <Download size={24} /> Télécharger le PDF
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
                    
                    <button onClick={generateEmailPDF} className="w-full bg-bde-navy text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-900 shadow-lg mt-6 transition transform hover:scale-105">
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

                    <button onClick={generateMeetingPDF} className="w-full bg-bde-navy text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-900 shadow-lg mt-6 transition transform hover:scale-105">
                        Générer le Compte Rendu (PDF)
                    </button>
                </div>
            </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminDocuments;