import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, Club } from '../types';

export const generateCotisationReport = (students: Student[]) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.setTextColor(15, 30, 58); // Navy
  doc.text("Rapport des Cotisations - BDE IFRAN", 14, 20);
  
  doc.setFontSize(12);
  doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);

  const tableData = students.map(s => [
    s.name,
    s.level,
    s.hasPaid ? 'Oui' : 'Non',
    s.paymentDate || '-',
    s.amount ? `${s.amount} FCFA` : '-'
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['Nom', 'Niveau', 'Payé', 'Date', 'Montant']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [15, 30, 58] },
  });

  doc.save('rapport_cotisations.pdf');
};

export const generateMonthlyReport = (month: string, clubs: Club[]) => {
  const doc = new jsPDF();
  
  doc.setFontSize(22);
  doc.setTextColor(231, 74, 103); // Rose
  doc.text(`BDE Update - ${month}`, 105, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text("Activités des Clubs", 14, 40);

  let yPos = 50;
  clubs.forEach((club) => {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`• ${club.name}`, 14, yPos);
    yPos += 7;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Responsable: ${club.leaderName}`, 20, yPos);
    yPos += 5;
    
    if (club.activities.length > 0) {
      doc.text(`Activités: ${club.activities.join(', ')}`, 20, yPos);
      yPos += 10;
    } else {
      yPos += 5;
    }
  });

  doc.text("Ceci est un document officiel du BDE IFRAN.", 14, 280);
  
  doc.save(`bde_update_${month.toLowerCase()}.pdf`);
};