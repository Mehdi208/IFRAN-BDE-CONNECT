
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, Club, CinemaSale } from '../types';

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
    s.paymentType || '-',
    s.amount ? `${s.amount} F` : '-'
  ]);

  autoTable(doc, {
    startY: 40,
    head: [['Nom', 'Niveau', 'Payé', 'Date', 'Type', 'Montant']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [15, 30, 58] },
  });

  doc.save('rapport_cotisations.pdf');
};

export const generatePaymentReceipt = (student: Student) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [210, 99] // Format 1/3 A4
  });

  // Couleur de fond de l'entête
  doc.setFillColor(15, 30, 58);
  doc.rect(0, 0, 210, 20, 'F');

  // Titre
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("REÇU DE PAIEMENT - BDE IFRAN", 105, 12, { align: "center" });

  // Reset couleur texte
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");

  // Info gauche
  doc.text(`Reçu N°: ${student.id.substring(0,6).toUpperCase()}`, 10, 35);
  doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, 10, 42);

  // Info Centre (Étudiant)
  doc.setFont("helvetica", "bold");
  doc.text(`Reçu de : ${student.name}`, 80, 35);
  doc.setFont("helvetica", "normal");
  doc.text(`Niveau : ${student.level}`, 80, 42);

  // Info Droite (Montant)
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Montant : ${student.amount} FCFA`, 150, 35);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text(`Motif : ${student.paymentType || 'Cotisation'}`, 150, 42);

  // Signature
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Le Trésorier", 160, 65);
  doc.line(160, 80, 190, 80); // Ligne signature

  // Footer message
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("Ce reçu est une preuve de paiement officielle du Bureau des Étudiants de l'IFRAN.", 105, 90, { align: "center" });

  doc.save(`Recu_${student.name.replace(/\s+/g, '_')}.pdf`);
};

export const generateCinemaReport = (sales: CinemaSale[]) => {
  const doc = new jsPDF();
  const total = sales.reduce((acc, sale) => acc + sale.totalPrice, 0);
  
  doc.setFontSize(22);
  doc.setTextColor(231, 74, 103); // Rose
  doc.text("Rapport Vente Cinéma", 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Date d'export: ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);
  doc.text(`Total des recettes: ${total.toLocaleString()} FCFA`, 14, 40);

  const tableData = sales.map(s => [
    new Date(s.date).toLocaleDateString('fr-FR'),
    s.itemName,
    s.quantity,
    `${s.unitPrice} F`,
    `${s.totalPrice} F`,
    s.buyerName || '-'
  ]);

  autoTable(doc, {
    startY: 50,
    head: [['Date', 'Article', 'Qté', 'Prix U.', 'Total', 'Acheteur']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [231, 74, 103] },
  });

  doc.save('rapport_cinema.pdf');
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
