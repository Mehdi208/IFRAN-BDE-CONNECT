const parseImportedText = (text) => {
  const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  const firstLine = lines[0];
  let separator = ',';
  if (firstLine.includes('\t')) separator = '\t';
  else if (firstLine.includes(';')) separator = ';';

  const parsed = [];
  
  const firstLineCols = firstLine.split(separator).map(c => c.trim());
  const firstLineColsLower = firstLineCols.map(c => c.toLowerCase());
  
  const firstNameHeaders = ['prénom', 'prenom', 'first name', 'firstname', 'nom1', 'first', 'nom et prénom', 'nom et prenom', 'nom complet', 'nom'];
  const lastNameHeaders = ['nom', 'last name', 'lastname', 'family name', 'surname', 'last'];
  const phoneHeaders = ['téléphone', 'telephone', 'tél', 'tel', 'phone', 'phone number', 'numéro', 'numero', 'whatsapp', 'tel', 'num', 'contact', 'cell'];
  const youthPhoneHeaders = ['jeune', 'eleve', 'élève', 'enfant', 'candidat'];
  const parentPhoneHeaders = ['parent', 'pere', 'père', 'mere', 'mère', 'tuteur'];
  const linkHeaders = ['lien', 'lien whatsapp', 'url', 'whatsapp link'];
  const statusHeaders = ['statut', 'status', 'état', 'etat'];

  let firstNameIdx = firstLineColsLower.findIndex(col => firstNameHeaders.some(h => col === h || col.includes(h)));
  let lastNameIdx = firstLineColsLower.findIndex(col => lastNameHeaders.some(h => col === h || col.includes(h)) && col !== 'nom et prénom' && col !== 'nom');
  
  let youthPhoneIdx = firstLineColsLower.findIndex(col => phoneHeaders.some(h => col.includes(h)) && youthPhoneHeaders.some(y => col.includes(y)));
  let parentPhoneIdx = firstLineColsLower.findIndex(col => phoneHeaders.some(h => col.includes(h)) && parentPhoneHeaders.some(p => col.includes(p)));
  let genericPhoneIdx = firstLineColsLower.findIndex(col => phoneHeaders.some(h => col.includes(h)) && youthPhoneIdx !== firstLineColsLower.indexOf(col) && parentPhoneIdx !== firstLineColsLower.indexOf(col));

  if (youthPhoneIdx === -1 && genericPhoneIdx !== -1) {
    youthPhoneIdx = genericPhoneIdx;
  }

  let linkIdx = firstLineColsLower.findIndex(col => linkHeaders.some(h => col.includes(h)));
  let statusIdx = firstLineColsLower.findIndex(col => statusHeaders.some(h => col.includes(h)));

  const hasHeaders = firstNameIdx !== -1 || youthPhoneIdx !== -1 || parentPhoneIdx !== -1 || linkIdx !== -1;
  const startIdx = hasHeaders ? 1 : 0;

  const customCols = [];
  if (hasHeaders) {
    firstLineCols.forEach((colName, idx) => {
      if (idx !== firstNameIdx && idx !== lastNameIdx && idx !== youthPhoneIdx && idx !== parentPhoneIdx && idx !== genericPhoneIdx && idx !== linkIdx && idx !== statusIdx && colName.trim() !== '') {
        customCols.push({ name: colName.trim(), idx });
      }
    });
  }

  for (let i = startIdx; i < lines.length; i++) {
    const cols = lines[i].split(separator).map(c => c.trim());
    if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue;

    let firstName = '';
    let lastName = '';
    let phone = '';
    let parentPhoneStr = '';
    let whatsappLink = '';
    let statusStr = '';
    const customFields = {};

    if (hasHeaders) {
      if (firstNameIdx !== -1 && cols[firstNameIdx] !== undefined) firstName = cols[firstNameIdx];
      if (lastNameIdx !== -1 && cols[lastNameIdx] !== undefined) lastName = cols[lastNameIdx];
      if (youthPhoneIdx !== -1 && cols[youthPhoneIdx] !== undefined) phone = cols[youthPhoneIdx];
      if (parentPhoneIdx !== -1 && cols[parentPhoneIdx] !== undefined) parentPhoneStr = cols[parentPhoneIdx];
      if (linkIdx !== -1 && cols[linkIdx] !== undefined) whatsappLink = cols[linkIdx];
      if (statusIdx !== -1 && cols[statusIdx] !== undefined) statusStr = cols[statusIdx];

      if (firstName && !lastName && firstName.includes(' ')) {
         const parts = firstName.split(/\s+/);
         firstName = parts[0];
         lastName = parts.slice(1).join(' ');
      }

      customCols.forEach(cc => {
        if (cols[cc.idx] !== undefined && cols[cc.idx].trim() !== '') {
          customFields[cc.name] = cols[cc.idx];
        }
      });
    } else {
      if (cols.length >= 6) {
        const nameParts = cols[0].split(/\s+/);
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
        customFields['Classe'] = cols[1];
        customFields['École de provenance'] = cols[2];
        phone = cols[3];
        parentPhoneStr = cols[4];
        customFields['Filière souhaitée'] = cols[5];
        for (let cIdx = 6; cIdx < cols.length; cIdx++) {
          customFields[`Colonne ${cIdx + 1}`] = cols[cIdx];
        }
      } else if (cols.length >= 3) {
        firstName = cols[0];
        lastName = cols[1];
        phone = cols[2];
        for (let cIdx = 3; cIdx < cols.length; cIdx++) {
          customFields[`Colonne ${cIdx + 1}`] = cols[cIdx];
        }
      } else if (cols.length === 2) {
        const nameParts = cols[0].split(/\s+/);
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
        phone = cols[1];
      } else if (cols.length === 1) {
        firstName = 'Prospect';
        phone = cols[0];
      }
    }

    const primaryPhone = phone.split('/')[0] || '';
    const cleanPhone = primaryPhone.replace(/[^0-9+]/g, '');
    const primaryParentPhone = parentPhoneStr.split('/')[0] || '';
    const cleanParentPhone = primaryParentPhone.replace(/[^0-9+]/g, '');

    let parsedStatus = 'to_do';

    if (firstName || lastName || cleanPhone || cleanParentPhone || whatsappLink) {
      parsed.push({
        firstName: firstName || 'Prospect',
        lastName: lastName || '',
        phone: cleanPhone || '',
        parentPhone: cleanParentPhone || undefined,
        whatsappLink: whatsappLink || undefined,
        status: parsedStatus,
        notes: '',
        customFields: Object.keys(customFields).length > 0 ? customFields : undefined
      });
    }
  }

  return parsed;
};

const text1 = "Nom et prénom\tClasse\tÉcole de provenance\tTél. jeune\tTél. parent\tFilière souhaitée\nJean Dupont\tTerminale D\tLycée Classique\t0102030405\t0505050505\tInformatique";
console.log(JSON.stringify(parseImportedText(text1), null, 2));

const text2 = "Jean Dupont\tTerminale D\tLycée Classique\t0102030405\t0505050505\tInformatique";
console.log(JSON.stringify(parseImportedText(text2), null, 2));
