
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, Club, CinemaSale, FoodOrder, MandateReportData } from '../types';

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

export const generateCanteenReport = (orders: FoodOrder[], range: { start: string; end: string }) => {
  const doc = new jsPDF();
  const total = orders.reduce((acc, o) => acc + o.totalPrice, 0);
  
  // Header
  doc.setFontSize(20);
  doc.setTextColor(15, 30, 58); // Navy
  doc.text("Bilan des Ventes Cantine - BDE IFRAN", 105, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Période du ${new Date(range.start).toLocaleDateString()} au ${new Date(range.end).toLocaleDateString()}`, 105, 28, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Nombre de commandes : ${orders.length}`, 14, 40);
  doc.setFont("helvetica", "bold");
  doc.text(`RECETTE TOTALE : ${total.toLocaleString()} FCFA`, 14, 48);
  doc.setFont("helvetica", "normal");

  const tableData = orders.map(o => [
    new Date(o.createdAt).toLocaleDateString() + ' ' + new Date(o.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    o.pickupTime,
    `${o.studentFirstName} ${o.studentName} (${o.studentClass})`,
    o.items.map(i => `${i.quantity}x ${i.productName}`).join('\n'),
    `${o.totalPrice.toLocaleString()} F`
  ]);

  autoTable(doc, {
    startY: 55,
    head: [['Heure Commande', 'Heure Retrait', 'Client', 'Détails Commande', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [15, 30, 58], fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      4: { halign: 'right', fontStyle: 'bold' }
    }
  });

  doc.text("Document généré par le site du BDE.", 14, (doc as any).lastAutoTable.finalY + 20);

  doc.save(`Bilan_Cantine_${range.start}_au_${range.end}.pdf`);
};

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
    
    const maxWidth = 170;
    const margin = 20;
    const pageHeight = doc.internal.pageSize.height;
    let y = 20;

    // Helper for page breaks
    const checkHeight = (height: number) => {
        if (y + height > pageHeight - margin) {
            doc.addPage();
            y = 20;
            return true;
        }
        return false;
    };

    // Header
    doc.setFontSize(22);
    doc.setTextColor(0, 51, 153);
    doc.text("COMPTE RENDU DE RÉUNION", 105, y, { align: 'center' });
    y += 20;

    // Info Block
    doc.setFontSize(11);
    doc.setTextColor(0);

    const infos = [
        [`Date : ${new Date(meetDate).toLocaleDateString('fr-FR')}`, `Heure : ${meetTime}`],
        [`Lieu : ${meetPlace}`, ``],
        [`Présents : ${meetPresent}`, ``],
        [`Absents : ${meetAbsent}`, ``]
    ];

    infos.forEach(row => {
        const text = row[0] + (row[1] ? "   |   " + row[1] : "");
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, margin, y);
        y += (lines.length * 6) + 4;
    });
    
    y += 5;

    // Generic Section Renderer
    const renderSection = (title: string, content: string) => {
        checkHeight(20);
        
        // Header background
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y, maxWidth, 8, 'F');
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(0, 51, 153);
        doc.text(title.toUpperCase(), margin + 2, y + 5.5);
        y += 14;

        // Content
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(0);
        
        const lines = doc.splitTextToSize(content || 'Néant', maxWidth);
        
        lines.forEach((line: string) => {
            if (checkHeight(7)) {
                y += 5; // margin top after new page
            }
            doc.text(line, margin, y);
            y += 6;
        });
        
        y += 8; // Spacing after section
    };

    renderSection("Ordre du jour", meetAgenda);
    renderSection("Points discutés", meetPoints);
    renderSection("Décisions prises", meetDecisions);

    // Footer
    checkHeight(20);
    y += 10;
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont("helvetica", "italic");
    doc.text("Généré via BDE Connect IFRAN", 105, y, { align: 'center' });

    doc.save(`CR_Reunion_${meetDate}.pdf`);
};

export const generateFinanceReport = (students: Student[], range: { start: string; end: string }) => {
  const doc = new jsPDF();
  const start = new Date(range.start);
  const end = new Date(range.end);
  end.setHours(23, 59, 59);

  const filtered = students.filter((s) => {
    if (!s.hasPaid || !s.paymentDate) return false;
    const d = new Date(s.paymentDate);
    return d >= start && d <= end;
  });

  const total = filtered.reduce((acc, s) => acc + (s.amount || 0), 0);

  doc.setFontSize(22);
  doc.setTextColor(15, 30, 58); // Navy
  doc.text('Bilan Financier', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Période : ${new Date(range.start).toLocaleDateString('fr-FR')} - ${new Date(range.end).toLocaleDateString('fr-FR')}`, 14, 35);
  doc.text(`Total Encaissé : ${total.toLocaleString()} FCFA`, 14, 42);
  doc.text(`Nombre de transactions : ${filtered.length}`, 14, 49);

  const tableData = filtered.map((s) => [
    new Date(s.paymentDate!).toLocaleDateString('fr-FR'),
    s.name,
    s.level,
    s.paymentType || '-',
    `${s.amount} F`,
  ]);

  autoTable(doc, {
    startY: 55,
    head: [['Date', 'Étudiant', 'Niveau', 'Type', 'Montant']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [15, 30, 58] },
  });

  doc.save(`Bilan_Financier_${range.start}_${range.end}.pdf`);
};

export const generatePresidentMandateReport = (data: MandateReportData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 14;

  // Helper for page break check
  const checkHeight = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      y = 18;
      return true;
    }
    return false;
  };

  // Helper for cleaning corrupted text
  const sanitize = (txt: string | undefined): string => {
    if (!txt) return '';
    return txt
      .replace(/&½þ|&½|&þ|½þ/g, '& E-Sport')
      .replace(/foot &½þ/gi, 'Foot & E-Sport')
      .replace(/foot &½/gi, 'Foot & E-Sport')
      .replace(/[^\x20-\x7E\xA0-\xFF\u0100-\u017F\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u20AC]/g, ' ')
      .trim();
  };

  // Header banner / Institutional Letterhead
  doc.setFillColor(15, 30, 58); // BDE Navy
  doc.rect(margin, y, contentWidth, 26, 'F');

  // Decorative accent line
  doc.setFillColor(231, 74, 103); // BDE Rose
  doc.rect(margin, y + 25, contentWidth, 1.2, 'F');

  // School Logo rendering
  if (data.logoDataUrl) {
    try {
      doc.addImage(data.logoDataUrl, 'PNG', margin + 4, y + 3, 20, 20);
    } catch (e) {
      // Fallback seal
    }
  } else {
    // Vector crest seal fallback
    doc.setFillColor(255, 255, 255);
    doc.circle(margin + 13, y + 13, 9, 'F');
    doc.setFillColor(15, 30, 58);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('IFRAN', margin + 13, y + 14, { align: 'center' });
  }

  const textStartX = margin + 27;
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text("INSTITUT FRANÇAIS DU NUMÉRIQUE (IFRAN)", textStartX, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text("BUREAU DES ÉTUDIANTS (BDE) • GOUVERNANCE & ADMINISTRATION", textStartX, y + 14);
  doc.setFontSize(7.5);
  doc.text(`Année Académique : ${data.academicYear || '2024 - 2025 / 2025 - 2026'}`, textStartX, y + 20);

  // AÉRATION SIGNIFICATIVE ENTRE LE BANDEAU DU HAUT ET LE TITRE DU DOCUMENT
  y = 52;

  // Document Title
  doc.setTextColor(15, 30, 58);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text("RAPPORT DE BILAN DE MANDAT PRÉSIDENTIEL", margin, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("Bilan Moral, Opérationnel, Pédagogique et Financier du Mandat", margin, y);
  y += 9;

  // Metadata Box (Recipient, Submission, President)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(15, 30, 58);
  doc.setFont('helvetica', 'bold');
  doc.text("Destinataire :", margin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(data.recipient || "Direction Générale & Administration de l'IFRAN", margin + 28, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 30, 58);
  doc.text("Président BDE :", margin + 4, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`${data.presidentName} (${data.presidentEmail} | ${data.presidentPhone})`, margin + 30, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 30, 58);
  doc.text("Période & Dépôt :", margin + 4, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`${data.mandatePeriod} — Déposé le ${data.submissionDate}`, margin + 33, y + 18);

  y += 28;

  // Key KPI Cards (4 cards in a row)
  const cardWidth = (contentWidth - 9) / 4;
  const cotisationsAssinie = data.finances.totalCollectedCotisations || 135000;

  const kpis = [
    { label: "Événements Réalisés", value: `${data.events.length}`, sub: "Actions campus" },
    { label: "Clubs & Ateliers", value: `${data.clubsCount + data.ateliersCount}`, sub: `${data.clubsCount} clubs · ${data.ateliersCount} ateliers` },
    { label: "Cotisations Assinie", value: "135.000 Fcfa", sub: "100% utilisé pour la sortie" },
    { label: "Cinéma (Poche Bureau)", value: "-15 000 F", sub: "Argent retiré / Fonds propres" },
  ];

  kpis.forEach((kpi, idx) => {
    const cardX = margin + idx * (cardWidth + 3);
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(cardX, y, cardWidth, 18, 1.5, 1.5, 'FD');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label.toUpperCase(), cardX + 3, y + 5);

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 30, 58);
    doc.text(kpi.value, cardX + 3, y + 11);

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(kpi.sub, cardX + 3, y + 15);
  });

  // Aérer et faire descendre Section 1 pour ne pas être collée aux blocs du haut
  y += 29;

  // Section 1 : Introduction & Bilan Moral
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 30, 58);
  doc.text("1. SYNTHÈSE EXÉCUTIVE & BILAN MORAL DU PRÉSIDENT", margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const moralLines = doc.splitTextToSize(data.moralReport || data.executiveSummary, contentWidth);
  moralLines.forEach((line: string) => {
    checkHeight(5);
    doc.text(line, margin, y);
    y += 4.5;
  });

  y += 5;

  // Section 2 : Grands Piliers d'Intervention
  checkHeight(18);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 30, 58);
  doc.text("2. AXES STRATÉGIQUES & ENGAGEMENTS ACCOMPLIS", margin, y);
  y += 5;

  if (data.keyPillars && data.keyPillars.length > 0) {
    data.keyPillars.forEach((pillar) => {
      checkHeight(14);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(231, 74, 103);
      doc.text(`• ${pillar.title}`, margin, y);
      y += 4;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      pillar.achievements.forEach((ach) => {
        checkHeight(5);
        const achLines = doc.splitTextToSize(`   - ${ach}`, contentWidth - 4);
        achLines.forEach((al: string) => {
          doc.text(al, margin, y);
          y += 4;
        });
      });
      y += 2;
    });
  }

  y += 4;

  // Section 3 : Bilan Événementiel avec COULEURS DANS LES LIGNES SELON STATUT
  checkHeight(20);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 30, 58);
  doc.text("3. TABLEAU DES ÉVÉNEMENTS & ACTIONS DE LA VIE ÉTUDIANTE", margin, y);
  y += 2;

  const eventTableData = data.events.map((e) => {
    const statusLabel =
      e.status === 'past' ? 'Réalisé' : e.status === 'upcoming' ? 'En cours / Prévu' : 'Annulé';
    
    // Sanitize title and description
    const cleanedTitle = sanitize(e.title);
    const cleanedDesc = sanitize(e.description) || 'Activité officielle BDE';

    return [
      e.date ? new Date(e.date).toLocaleDateString('fr-FR') : '-',
      cleanedTitle,
      sanitize(e.location) || 'Campus IFRAN',
      statusLabel,
      cleanedDesc.length > 110 ? cleanedDesc.substring(0, 110) + '...' : cleanedDesc,
    ];
  });

  autoTable(doc, {
    startY: y + 2,
    head: [['Date', 'Activité / Événement', 'Lieu', 'Statut', 'Description']],
    body: eventTableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 30, 58],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 44, fontStyle: 'bold' },
      2: { cellWidth: 26 },
      3: { cellWidth: 25, fontStyle: 'bold', halign: 'center' },
      4: { cellWidth: 67 },
    },
    didParseCell: (hookData) => {
      if (hookData.section === 'body') {
        const rawStatus = data.events[hookData.row.index]?.status;
        if (rawStatus === 'past') {
          hookData.cell.styles.fillColor = [236, 253, 245];
          if (hookData.column.index === 3) {
            hookData.cell.styles.textColor = [6, 95, 70];
          }
        } else if (rawStatus === 'upcoming') {
          hookData.cell.styles.fillColor = [254, 247, 224];
          if (hookData.column.index === 3) {
            hookData.cell.styles.textColor = [161, 98, 7];
          }
        } else if (rawStatus === 'cancelled') {
          hookData.cell.styles.fillColor = [254, 242, 242];
          if (hookData.column.index === 3) {
            hookData.cell.styles.textColor = [153, 27, 27];
          }
        }
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Section 4 : Clubs Permanents & Ateliers Afternoon
  checkHeight(20);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 30, 58);
  doc.text("4. STRUCTURATION DES CLUBS PERMANENTS & ATELIERS AFTERNOON", margin, y);
  y += 2;

  // Helper function to map precise real club missions
  const getClubMission = (clubName: string, defaultAct: string) => {
    const nameLower = clubName.toLowerCase();
    if (nameLower.includes('kurotsuki') || nameLower.includes('model')) {
      return "Organisation de défilés de mode, séances photos et réalisations de vidéos créatives.";
    }
    if (nameLower.includes('studio') || nameLower.includes('music') || nameLower.includes('musique')) {
      return "Projet d'écoute musicale et de chant (activité non concrétisée durant le mandat).";
    }
    if (nameLower.includes('fitness') || nameLower.includes('sport')) {
      return "Initiative sportive et séances de fitness (activité non concrétisée durant le mandat).";
    }
    if (nameLower.includes('créati') || nameLower.includes('creati') || nameLower.includes('art')) {
      return "Ateliers de dessin, créations artistiques et customisation d'objets durant les séances.";
    }
    if (nameLower.includes('finance') || nameLower.includes('investiss') || nameLower.includes('crypto')) {
      return "Échanges et discussions autour de la gestion financière, de l'investissement et des cryptomonnaies.";
    }
    return defaultAct || 'Ateliers, projets et entraide';
  };

  const clubTableData = data.clubsList.map((c) => [
    'Club Permanent',
    c.name,
    c.leader || 'Coordination BDE',
    getClubMission(c.name, c.activities),
  ]);

  data.ateliersList.forEach((a) => {
    clubTableData.push([
      'Atelier Afternoon',
      a.name,
      `Salle : ${a.room || 'IFRAN'}`,
      'Perfectionnement technique & pratique hebdomadaire',
    ]);
  });

  autoTable(doc, {
    startY: y + 2,
    head: [['Type', 'Dénomination', 'Responsable / Lieu', 'Missions & Activités']],
    body: clubTableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 30, fontStyle: 'bold' },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 38 },
      3: { cellWidth: 'auto' },
    },
    didParseCell: (hookData) => {
      if (hookData.section === 'body') {
        const type = hookData.row.raw ? (hookData.row.raw as any)[0] : '';
        if (type === 'Club Permanent') {
          hookData.cell.styles.fillColor = [248, 250, 252];
        } else {
          hookData.cell.styles.fillColor = [240, 249, 255];
        }
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Section 5 : Bilan Financier & Ressources (Conforme aux flux réels du mandat)
  checkHeight(35);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 30, 58);
  doc.text("5. BILAN FINANCIER & GESTION DES RESSOURCES DU MANDAT", margin, y);
  y += 3;

  const financeTableData = [
    [
      'Cotisations Sortie Assinie',
      'Recensement des cotisations volontaires versées par les étudiants pour la sortie détente (non obligatoire)',
      '+135.000 FCFA',
    ],
    [
      'Dépenses Logistique Sortie Assinie',
      'Utilisation directe et intégrale des cotisations pour financer le transport, le séjour et les activités',
      '-135.000 FCFA',
    ],
    [
      'Projections Cinéma BDE (Fonds propres)',
      'Aucune cotisation perçue des étudiants — Argent retiré de la poche du Bureau pour organiser la projection',
      '-15.000 FCFA',
    ],
    [
      'TOTAL DES COTISATIONS RECENSÉES',
      'Totalité des fonds collectés auprès des étudiants (exclusivement pour la sortie Assinie)',
      '135.000 FCFA',
    ],
    [
      'SOLDE DE TRÉSORERIE TRANSMIS',
      'Aucun reliquat — Cotisations 100% consommées par la sortie et cinéma pris sur nos fonds personnels',
      '0 FCFA',
    ],
  ];

  autoTable(doc, {
    startY: y + 2,
    head: [['Poste & Activité', 'Précisions & Affectation des Fonds', 'Montant (FCFA)']],
    body: financeTableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 30, 58],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 88 },
      2: { cellWidth: 44, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (hookData) => {
      if (hookData.section === 'body') {
        if (hookData.row.index === 0) {
          // Cotisations Assinie
          hookData.cell.styles.fillColor = [240, 253, 244];
        } else if (hookData.row.index === 1 || hookData.row.index === 2) {
          // Depenses Assinie et Cinema
          hookData.cell.styles.fillColor = [254, 242, 242];
          if (hookData.column.index === 2) {
            hookData.cell.styles.textColor = [185, 28, 28];
          }
        } else if (hookData.row.index === 3) {
          // Total encaisse
          hookData.cell.styles.fillColor = [224, 242, 254];
          hookData.cell.styles.textColor = [3, 105, 161];
        } else if (hookData.row.index === 4) {
          // Solde tresorerie
          hookData.cell.styles.fillColor = [241, 245, 249];
          hookData.cell.styles.textColor = [51, 65, 85];
        }
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Section 6 : Digitalisation & Communication (FORCER LE SAUT DE PAGE SI TROP BAS POUR ÉVITER TOUT DÉBORDEMENT)
  if (y + 50 > pageHeight - 20) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 30, 58);
  doc.text("6. INNOVATION DIGITALE & COMMUNICATION DU BDE", margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const digitalProse = [
    `• Plateforme Web BDE : Centralisation en ligne de l'agenda, des inscriptions aux clubs, du tutorat et des documents officiels.`,
    `• Service Cantine Connectée : Déploiement d'une solution de précommande et de gestion des menus pour fluidifier la restauration des étudiants (recettes revenant à la prestataire de restauration).`,
    `• Communication & Réseaux Étudiants : Diffusion continue de l'actualité des promotions, écoute des besoins étudiants et coordination proactive avec l'Administration.`,
  ];
  digitalProse.forEach((line) => {
    const splitLines = doc.splitTextToSize(line, contentWidth);
    splitLines.forEach((sl: string) => {
      checkHeight(5);
      doc.text(sl, margin, y);
      y += 4.5;
    });
  });

  // Page Numbers & Running Headers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    // Top subtle running header
    doc.text("IFRAN • Bureau Des Étudiants (BDE) — Rapport Officiel de Bilan de Mandat", margin, 9);
    // Bottom running footer
    doc.text(
      `Document officiel déposé à l'Administration — Page ${i} sur ${totalPages}`,
      pageWidth / 2,
      pageHeight - 7,
      { align: 'center' }
    );
  }

  // Save the PDF
  const filename = `Rapport_Bilan_Mandat_President_${data.presidentName.replace(/\s+/g, '_')}_IFRAN.pdf`;
  doc.save(filename);
};
