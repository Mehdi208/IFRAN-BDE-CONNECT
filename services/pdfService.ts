
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, Club, CinemaSale } from '../types';

export interface EmailData {
    evtName: string;
    evtObj: string;
    evtDate: string;
    evtTime: string;
    evtPlace: string;
    evtBudget: string;
    evtResp: string;
    evtDesc: string;
}

export interface MeetingData {
    meetDate: string;
    meetTime: string;
    meetPlace: string;
    meetPresent: string;
    meetAbsent: string;
    meetAgenda: string;
    meetPoints: string;
    meetDecisions: string;
}

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

export const generateEmailPDF = (data: EmailData) => {
    const doc = new jsPDF();
    const { evtName, evtObj, evtDate, evtTime, evtPlace, evtBudget, evtResp, evtDesc } = data;
    
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

  export const generateMeetingPDF = (data: MeetingData) => {
    const doc = new jsPDF();
    const { meetDate, meetTime, meetPlace, meetPresent, meetAbsent, meetAgenda, meetPoints, meetDecisions } = data;
    
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

  export const generateFinanceReport = (students: Student[], dateRange: { start: string, end: string }) => {
     
     const start = new Date(dateRange.start);
     const end = new Date(dateRange.end);
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
     doc.text(`Période du : ${dateRange.start} au ${dateRange.end}`, 105, 30, { align: 'center' });
     
     doc.text(`Total Collecté sur la période : ${totalCollected.toLocaleString()} FCFA`, 20, 50);

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
     
     doc.save(`Bilan_Financier_${dateRange.start}_${dateRange.end}.pdf`);
  };
