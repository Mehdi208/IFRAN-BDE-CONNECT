const firstLine = "Nom et prénom ; Classe ; École de provenance ; Tél. jeune ; Tél. parent ; Filière souhaitée";
let separator = ';';
const firstLineCols = firstLine.split(separator).map(c => c.trim());
const firstLineColsLower = firstLineCols.map(c => c.toLowerCase());

const firstNameHeaders = ['prénom', 'prenom', 'first name', 'firstname', 'nom1', 'first', 'nom et prénom', 'nom et prenom', 'nom complet', 'nom'];
const lastNameHeaders = ['nom', 'last name', 'lastname', 'family name', 'surname', 'last'];
const phoneHeaders = ['téléphone', 'telephone', 'tél', 'tel', 'phone', 'phone number', 'numéro', 'numero', 'whatsapp', 'tel', 'num', 'contact', 'cell'];
const youthPhoneHeaders = ['jeune', 'eleve', 'élève', 'enfant', 'candidat'];
const parentPhoneHeaders = ['parent', 'pere', 'père', 'mere', 'mère', 'tuteur'];

let firstNameIdx = firstLineColsLower.findIndex(col => firstNameHeaders.some(h => col === h || col.includes(h)));
let lastNameIdx = firstLineColsLower.findIndex(col => lastNameHeaders.some(h => col === h || col.includes(h)) && col !== 'nom et prénom' && col !== 'nom');
let youthPhoneIdx = firstLineColsLower.findIndex(col => phoneHeaders.some(h => col.includes(h)) && youthPhoneHeaders.some(y => col.includes(y)));
let parentPhoneIdx = firstLineColsLower.findIndex(col => phoneHeaders.some(h => col.includes(h)) && parentPhoneHeaders.some(p => col.includes(p)));
let genericPhoneIdx = firstLineColsLower.findIndex(col => phoneHeaders.some(h => col.includes(h)) && youthPhoneIdx !== firstLineColsLower.indexOf(col) && parentPhoneIdx !== firstLineColsLower.indexOf(col));

if (youthPhoneIdx === -1 && genericPhoneIdx !== -1) {
  youthPhoneIdx = genericPhoneIdx;
}

console.log({
  firstLineColsLower,
  firstNameIdx,
  lastNameIdx,
  youthPhoneIdx,
  parentPhoneIdx,
  genericPhoneIdx
});
