const fs = require('fs');
let content = fs.readFileSync('pages/admin/AdminAssinie.tsx', 'utf-8');

// Replacements
content = content.replace(/AdminAssinie/g, 'AdminNaza');
content = content.replace(/AssinieRegistration/g, 'NazaRegistration');
content = content.replace(/fetchAssinieRegistrations/g, 'fetchNazaRegistrations');
content = content.replace(/deleteAssinieRegistration/g, 'deleteNazaRegistration');
content = content.replace(/updateAssinieRegistration/g, 'updateNazaRegistration');
content = content.replace(/addAssinieRegistration/g, 'addNazaRegistration');
content = content.replace(/Inscriptions Sortie Assinie/g, 'Inscriptions Concert NAZA');
content = content.replace(/needsGlaciere/g, 'registrationDate');

// Some table and column adjustments
content = content.replace(/<th className="p-4">Glacière \?<\/th>/g, '');
content = content.replace(/<td className="p-4">\s*\{reg\.registrationDate \?(?:.|\n)*?<\/td>/g, '');

fs.writeFileSync('pages/admin/AdminNaza.tsx', content);
console.log('Created AdminNaza.tsx');
