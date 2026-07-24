import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { ProspectContact, RelancerProfile } from '../../types';
import { 
  ArrowLeft, 
  Trash2, 
  Search, 
  Edit2, 
  CheckSquare, 
  Square, 
  MessageSquare, 
  UploadCloud, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Clipboard, 
  Plus, 
  RefreshCw, 
  FileDown, 
  Send, 
  Sparkles, 
  Check, 
  Info, 
  ChevronLeft,
  ChevronRight, 
  AlertCircle,
  TrendingUp,
  UserCheck,
  GraduationCap,
  Building2,
  Award,
  FileText,
  Printer,
  Users,
  User,
  UserPlus,
  X,
  ShieldCheck
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';

const AdminProspects = () => {
  const navigate = useNavigate();
  const [prospects, setProspects] = useState<ProspectContact[]>([]);
  const [loading, setLoading] = useState(true);

  // Profiles state for team collaboration
  const [profiles, setProfiles] = useState<RelancerProfile[]>(() => {
    const saved = localStorage.getItem('whatsapp_relancer_profiles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [
      { id: 'mehdi', name: 'Mehdi', senderName: 'Méhdi Traoré', role: 'Responsable', color: 'indigo', avatarEmoji: '👤' },
      { id: 'emmanuelle', name: 'Emmanuelle', senderName: 'Emmanuelle', role: 'Relanceur', color: 'rose', avatarEmoji: '🌸' },
      { id: 'nour', name: 'Nour', senderName: 'Nour', role: 'Relanceur', color: 'amber', avatarEmoji: '⚡' },
      { id: 'joshua', name: 'Joshua', senderName: 'Joshua', role: 'Relanceur', color: 'emerald', avatarEmoji: '🚀' },
      { id: 'othniel', name: 'Othniel', senderName: 'Othniel', role: 'Relanceur', color: 'purple', avatarEmoji: '🌟' },
    ];
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    return localStorage.getItem('whatsapp_active_profile_id') || 'mehdi';
  });

  // New Profile modal state
  const [isAddProfileModalOpen, setIsAddProfileModalOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileSender, setNewProfileSender] = useState('');
  const [newProfileRole, setNewProfileRole] = useState('Relanceur');
  const [newProfileEmoji, setNewProfileEmoji] = useState('👤');

  useEffect(() => {
    localStorage.setItem('whatsapp_active_profile_id', activeProfileId);
  }, [activeProfileId]);

  useEffect(() => {
    localStorage.setItem('whatsapp_relancer_profiles', JSON.stringify(profiles));
  }, [profiles]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<'sheets' | 'descartes' | 'all'>('sheets');
  const [templateBody, setTemplateBody] = useState('');
  const [parentTemplateBody, setParentTemplateBody] = useState('');
  const [relanceJeuneTemplateBody, setRelanceJeuneTemplateBody] = useState('');
  const [relanceParentTemplateBody, setRelanceParentTemplateBody] = useState('');
  const [descartesJeuneTemplateBody, setDescartesJeuneTemplateBody] = useState('');
  const [descartesParentTemplateBody, setDescartesParentTemplateBody] = useState('');
  const [activeTemplateTab, setActiveTemplateTab] = useState<'jeune' | 'parent' | 'relance_jeune' | 'relance_parent' | 'descartes_jeune' | 'descartes_parent'>('jeune');
  const [isTemplateSaving, setIsTemplateSaving] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [isPasteOpen, setIsPasteOpen] = useState(false);
  const [pasteTargetCategory, setPasteTargetCategory] = useState<'sheets' | 'descartes'>('sheets');
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [importError, setImportError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Active contact for preview
  const [activeContactId, setActiveContactId] = useState<string | null>(null);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<ProspectContact | null>(null);
  const [formProspect, setFormProspect] = useState<Partial<ProspectContact>>({
    category: 'sheets',
    firstName: '',
    lastName: '',
    phone: '',
    status: 'to_do',
    notes: ''
  });

  // Campaign auto-runner states
  const [campaignMode, setCampaignMode] = useState(false);
  const [currentCampaignIndex, setCurrentCampaignIndex] = useState(0);
  const [autoNextMode, setAutoNextMode] = useState(true);

  // Helper to check if a prospect is from Lycée International Descartes
  const isDescartesProspect = (p: ProspectContact | null): boolean => {
    if (!p) return false;
    if (p.category === 'descartes') return true;
    if (p.category === 'sheets') return false;
    const ecoleVal = getCustomFieldValue(p.customFields, 'École de provenance');
    if (ecoleVal && ecoleVal.toLowerCase().includes('descartes')) return true;
    return false;
  };

  // Campaign auto-advance handler
  const handleCampaignSend = async (contact: ProspectContact, target: 'jeune' | 'parent' | 'relance_jeune' | 'relance_parent' | 'descartes_jeune' | 'descartes_parent' = 'jeune') => {
    sendWhatsAppMessage(contact, target);
    if (autoNextMode) {
      setTimeout(() => {
        nextCampaignContact('sent');
      }, 400);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const p = await dataService.fetchProspects();
      setProspects(p);
      if (p.length > 0) {
        setActiveContactId(p[0].id);
      }

      const tJeune = await dataService.fetchCampaignTemplate('jeune');
      const tParent = await dataService.fetchCampaignTemplate('parent');
      const tRelJeune = await dataService.fetchCampaignTemplate('relance_jeune');
      const tRelParent = await dataService.fetchCampaignTemplate('relance_parent');
      const tDescJeune = await dataService.fetchCampaignTemplate('descartes_jeune');
      const tDescParent = await dataService.fetchCampaignTemplate('descartes_parent');
      setTemplateBody(tJeune);
      setParentTemplateBody(tParent);
      setRelanceJeuneTemplateBody(tRelJeune);
      setRelanceParentTemplateBody(tRelParent);
      setDescartesJeuneTemplateBody(tDescJeune);
      setDescartesParentTemplateBody(tDescParent);
    } catch (e) {
      console.error("Error loading prospects data:", e);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format phone number to international standard if needed (Côte d'Ivoire defaults to +225)
  const formatPhoneForWhatsApp = (phone: string): string => {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.length === 10) {
      // Ivory Coast numbers are typically 10 digits now
      return `225${clean}`;
    }
    return clean;
  };

  // Replace template tags with contact details and dynamic sender name according to active profile
  const personalizeMessage = (template: string, contact: ProspectContact | Partial<ProspectContact>): string => {
    if (!template) return '';
    const profId = contact.profileId || activeProfileId;
    const currentProfile = profiles.find(p => p.id === profId) || profiles[0];
    const senderName = currentProfile ? (currentProfile.senderName || currentProfile.name) : 'Méhdi Traoré';

    let msg = template
      .replace(/{prenom}/gi, contact.firstName || '')
      .replace(/{nom}/gi, contact.lastName || '')
      .replace(/{telephone}/gi, contact.phone || '')
      .replace(/{expediteur}/gi, senderName);

    // If template explicitly contains "Méhdi Traoré" / "Mehdi Traoré" or "Méhdi" and profile is not Mehdi, replace with active senderName
    if (currentProfile && currentProfile.id !== 'mehdi' && senderName) {
      msg = msg
        .replace(/Méhdi Traoré/g, senderName)
        .replace(/Mehdi Traoré/g, senderName)
        .replace(/Méhdi/g, senderName);
    }

    if (contact.customFields) {
      Object.entries(contact.customFields).forEach(([key, val]) => {
        // Replace exact matches of the column header (e.g., {Filière} or {Relation})
        const regexExact = new RegExp(`{${key}}`, 'gi');
        msg = msg.replace(regexExact, val || '');

        // Replace simplified/normalized lowercase keys without accents or special characters
        const normKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
        const regexNorm = new RegExp(`{${normKey}}`, 'gi');
        msg = msg.replace(regexNorm, val || '');
      });
    }
    return msg;
  };

  const handleAddProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    const id = newProfileName.toLowerCase().trim().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);
    const newProf: RelancerProfile = {
      id,
      name: newProfileName.trim(),
      senderName: newProfileSender.trim() || newProfileName.trim(),
      role: newProfileRole || 'Relanceur',
      avatarEmoji: newProfileEmoji || '👤',
      color: 'indigo'
    };
    const updated = [...profiles, newProf];
    setProfiles(updated);
    setActiveProfileId(id);
    setNewProfileName('');
    setNewProfileSender('');
    setIsAddProfileModalOpen(false);
    showTemporarySuccess(`Profil "${newProf.name}" créé avec succès !`);
  };

  const handleSaveTemplate = async () => {
    setIsTemplateSaving(true);
    try {
      if (activeTemplateTab === 'jeune') {
        await dataService.saveCampaignTemplate(templateBody, 'jeune');
      } else if (activeTemplateTab === 'parent') {
        await dataService.saveCampaignTemplate(parentTemplateBody, 'parent');
      } else if (activeTemplateTab === 'relance_jeune') {
        await dataService.saveCampaignTemplate(relanceJeuneTemplateBody, 'relance_jeune');
      } else if (activeTemplateTab === 'relance_parent') {
        await dataService.saveCampaignTemplate(relanceParentTemplateBody, 'relance_parent');
      } else if (activeTemplateTab === 'descartes_jeune') {
        await dataService.saveCampaignTemplate(descartesJeuneTemplateBody, 'descartes_jeune');
      } else if (activeTemplateTab === 'descartes_parent') {
        await dataService.saveCampaignTemplate(descartesParentTemplateBody, 'descartes_parent');
      }
      showTemporarySuccess(`Modèle ${activeTemplateTab} enregistré avec succès !`);
    } catch (e) {
      alert("Erreur lors de la sauvegarde du modèle");
    } finally {
      setIsTemplateSaving(false);
    }
  };

  const showTemporarySuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3500);
  };

  // Add tags to cursor position
  const insertTag = (tag: string) => {
    const textarea = document.getElementById('template-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const newText = before + tag + after;
    
    if (activeTemplateTab === 'jeune') {
      setTemplateBody(newText);
    } else if (activeTemplateTab === 'parent') {
      setParentTemplateBody(newText);
    } else if (activeTemplateTab === 'relance_jeune') {
      setRelanceJeuneTemplateBody(newText);
    } else if (activeTemplateTab === 'relance_parent') {
      setRelanceParentTemplateBody(newText);
    } else if (activeTemplateTab === 'descartes_jeune') {
      setDescartesJeuneTemplateBody(newText);
    } else if (activeTemplateTab === 'descartes_parent') {
      setDescartesParentTemplateBody(newText);
    }
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  const getCustomFieldValue = (customFields?: Record<string, string>, targetKey?: string) => {
    if (!customFields || !targetKey) return '-';
    if (customFields[targetKey]) return customFields[targetKey];
    
    const normTarget = targetKey.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    for (const [k, v] of Object.entries(customFields)) {
      const normK = k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
      if (normK === normTarget || normK.includes(normTarget) || normTarget.includes(normK)) {
        return v;
      }
    }
    return '-';
  };

  // Parse CSV / Tabulated copy-paste
  const parseImportedText = (text: string): Omit<ProspectContact, 'id'>[] => {
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) return [];

    // Detect delimiter
    const firstLine = lines[0];
    let separator = ',';
    if (firstLine.includes('\t')) separator = '\t';
    else if (firstLine.includes(';')) separator = ';';

    const parsed: Omit<ProspectContact, 'id'>[] = [];
    
    // Analyze headers
    const firstLineCols = firstLine.split(separator).map(c => c.trim());
    const firstLineColsLower = firstLineCols.map(c => c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim());

    const isPhoneString = (str: string) => {
      if (!str) return false;
      const digits = str.replace(/[^0-9]/g, '');
      return digits.length >= 8 && digits.length <= 15;
    };

    const firstNameHeaders = ['prenom', 'first name', 'firstname', 'nom1', 'first', 'nom et prenom', 'nom & prenom', 'nom prenom', 'nom complet', 'candidat', 'etudiant', 'eleve', 'contact'];
    const lastNameHeaders = ['nom', 'last name', 'lastname', 'surname', 'family name'];
    const phoneHeaders = ['telephone', 'tel', 'phone', 'numero', 'num', 'whatsapp', 'cell', 'mobile'];
    const youthHeaders = ['jeune', 'eleve', 'enfant', 'candidat', 'etudiant'];
    const parentHeaders = ['parent', 'pere', 'mere', 'tuteur'];
    const linkHeaders = ['lien', 'lien whatsapp', 'url', 'whatsapp link'];
    const statusHeaders = ['statut', 'status', 'etat'];

    let firstNameIdx = firstLineColsLower.findIndex(col => firstNameHeaders.some(h => col === h || col.includes(h)));
    let lastNameIdx = firstLineColsLower.findIndex(col => lastNameHeaders.some(h => col === h || col === 'nom') && col !== 'nom et prenom' && col !== 'nom & prenom' && col !== 'nom prenom');

    // If 'Nom' was found and NO 'Prénom' was found, treat 'Nom' as full name (firstNameIdx)
    if (firstNameIdx === -1 && lastNameIdx !== -1) {
      firstNameIdx = lastNameIdx;
      lastNameIdx = -1;
    }

    let youthPhoneIdx = firstLineColsLower.findIndex(col => phoneHeaders.some(h => col.includes(h)) && youthHeaders.some(y => col.includes(y)));
    let parentPhoneIdx = firstLineColsLower.findIndex(col => phoneHeaders.some(h => col.includes(h)) && parentHeaders.some(p => col.includes(p)));
    let genericPhoneIdx = firstLineColsLower.findIndex((col, idx) => phoneHeaders.some(h => col.includes(h)) && idx !== youthPhoneIdx && idx !== parentPhoneIdx);

    if (youthPhoneIdx === -1 && genericPhoneIdx !== -1) {
      youthPhoneIdx = genericPhoneIdx;
      let secondGenericPhoneIdx = firstLineColsLower.findIndex((col, idx) => phoneHeaders.some(h => col.includes(h)) && idx !== youthPhoneIdx && idx !== parentPhoneIdx);
      if (secondGenericPhoneIdx !== -1) {
        parentPhoneIdx = secondGenericPhoneIdx;
      }
    }

    let linkIdx = firstLineColsLower.findIndex(col => linkHeaders.some(h => col.includes(h)));
    let statusIdx = firstLineColsLower.findIndex(col => statusHeaders.some(h => col.includes(h)));

    const firstLineHasPhoneNumbers = firstLineCols.some(col => isPhoneString(col));
    const hasHeaders = !firstLineHasPhoneNumbers && (firstNameIdx !== -1 || youthPhoneIdx !== -1 || parentPhoneIdx !== -1 || linkIdx !== -1 || lastNameIdx !== -1);
    const startIdx = hasHeaders ? 1 : 0;

    const customCols: { name: string, idx: number }[] = [];
    if (hasHeaders) {
      firstLineCols.forEach((colName, idx) => {
        if (idx !== firstNameIdx && idx !== lastNameIdx && idx !== youthPhoneIdx && idx !== parentPhoneIdx && idx !== linkIdx && idx !== statusIdx && colName.trim() !== '') {
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
      const customFields: Record<string, string> = {};

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
            let key = cc.name;
            const norm = key.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if (norm === 'classe' || norm === 'niveau') key = 'Classe';
            if (norm === 'ecole de provenance' || norm === 'ecole' || norm === 'etablissement' || norm === 'lycee') key = 'École de provenance';
            if (norm === 'filiere souhaitee' || norm === 'filiere' || norm === 'filiere choisie') key = 'Filière souhaitée';
            customFields[key] = cols[cc.idx];
          }
        });
      } else {
        // Smart fallback without headers
        const phoneCols: { val: string, idx: number }[] = [];
        const nonPhoneCols: { val: string, idx: number }[] = [];

        cols.forEach((col, idx) => {
          if (isPhoneString(col)) {
            phoneCols.push({ val: col, idx });
          } else if (col !== '') {
            nonPhoneCols.push({ val: col, idx });
          }
        });

        if (phoneCols.length > 0) {
          phone = phoneCols[0].val;
          if (phoneCols.length > 1) parentPhoneStr = phoneCols[1].val;
        }

        if (nonPhoneCols.length > 0) {
          const nameParts = nonPhoneCols[0].val.split(/\s+/);
          firstName = nameParts[0] || '';
          lastName = nameParts.slice(1).join(' ') || '';
        }

        if (nonPhoneCols.length >= 2) customFields['Classe'] = nonPhoneCols[1].val;
        if (nonPhoneCols.length >= 3) customFields['École de provenance'] = nonPhoneCols[2].val;
        if (nonPhoneCols.length >= 4) customFields['Filière souhaitée'] = nonPhoneCols[3].val;

        for (let k = 4; k < nonPhoneCols.length; k++) {
          customFields[`Info ${k + 1}`] = nonPhoneCols[k].val;
        }
      }

      // Basic cleanup: handle cases like "0586802761 / 0707463054" by taking the first part
      const primaryPhone = phone.split('/')[0] || '';
      const cleanPhone = primaryPhone.replace(/[^0-9+]/g, '');
      const primaryParentPhone = parentPhoneStr.split('/')[0] || '';
      const cleanParentPhone = primaryParentPhone.replace(/[^0-9+]/g, '');

      let parsedStatus: 'to_do' | 'in_progress' | 'sent' | 'ignored' = 'to_do';
      const s = statusStr.toLowerCase();
      if (s.includes('envoyé') || s.includes('sent') || s.includes('inscrit')) parsedStatus = 'sent';
      else if (s.includes('cours') || s.includes('progress') || s.includes('relance')) parsedStatus = 'in_progress';
      else if (s.includes('refus') || s.includes('ignored')) parsedStatus = 'ignored';
      else if (s.includes('faire') || s.includes('todo')) parsedStatus = 'to_do';

      if (firstName || lastName || cleanPhone || cleanParentPhone || whatsappLink) {
        parsed.push({
          category: 'sheets',
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

  // Dedicated parser for Lycée International Descartes PDF text
  // Strictly isolates Nom, Prénom, and Phone Number for each line, discarding all other info.
  const parseDescartesPdfText = (text: string): Omit<ProspectContact, 'id'>[] => {
    const rawLines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (rawLines.length === 0) return [];

    const parsed: Omit<ProspectContact, 'id'>[] = [];

    // Helper to find phone number inside string
    const extractPhone = (str: string): { phone: string; remaining: string } => {
      const phoneRegex = /(?:\+?225|00225)?\s*(?:[0-9][\s.-]?){8,12}/g;
      const matches = str.match(phoneRegex);
      if (matches && matches.length > 0) {
        for (const m of matches) {
          const digits = m.replace(/[^0-9+]/g, '');
          if (digits.length >= 8 && digits.length <= 15) {
            const remaining = str.replace(m, ' ').trim();
            return { phone: digits, remaining };
          }
        }
      }
      return { phone: '', remaining: str };
    };

    // Helper to parse Name & Surname from text
    const extractNameParts = (str: string): { firstName: string; lastName: string } => {
      let clean = str
        .replace(/page\s*\d+/gi, '')
        .replace(/lyc[eé]e\s+international\s+descartes/gi, '')
        .replace(/lyc[eé]e\s+descartes/gi, '')
        .replace(/descartes/gi, '')
        .replace(/orientation|carrefour|bac|aefe|élève|etudiant|étudiant|candidat|terminale|premiere|seconde|filiere|classe|groupe|série/gi, '')
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
        .replace(/\b\d{1,5}\b/g, '')
        .replace(/[,;|/]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (!clean) return { firstName: '', lastName: '' };

      const words = clean.split(' ').filter(w => w.length > 0);
      if (words.length === 0) return { firstName: '', lastName: '' };
      if (words.length === 1) return { firstName: words[0], lastName: '' };

      // In French lists, ALL-CAPS words are LAST NAMES (Nom)
      const uppercaseWords: string[] = [];
      const normalWords: string[] = [];

      words.forEach(w => {
        const letters = w.replace(/[^a-zA-ZàâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ-]/g, '');
        if (letters.length >= 2 && letters === letters.toUpperCase()) {
          uppercaseWords.push(w);
        } else {
          normalWords.push(w);
        }
      });

      if (uppercaseWords.length > 0) {
        const lastName = uppercaseWords.join(' ');
        const firstName = normalWords.length > 0 ? normalWords.join(' ') : words.filter(w => !uppercaseWords.includes(w)).join(' ');
        return {
          firstName: firstName || 'Prospect',
          lastName: lastName || ''
        };
      }

      return {
        firstName: words[0],
        lastName: words.slice(1).join(' ')
      };
    };

    for (const line of rawLines) {
      const lower = line.toLowerCase();
      if (
        (lower.includes('nom') && lower.includes('prenom')) ||
        lower.includes('liste des') ||
        lower.includes('carrefour orientation') ||
        lower.startsWith('page ')
      ) {
        continue;
      }

      let cols = [line];
      if (line.includes('\t')) cols = line.split('\t');
      else if (line.includes(';')) cols = line.split(';');

      let phone = '';
      let textCandidates: string[] = [];

      if (cols.length > 1) {
        cols.forEach(c => {
          const trimmed = c.trim();
          const { phone: p, remaining } = extractPhone(trimmed);
          if (p && !phone) phone = p;
          if (remaining) textCandidates.push(remaining);
        });
      } else {
        const { phone: p, remaining } = extractPhone(line);
        phone = p;
        if (remaining) textCandidates.push(remaining);
      }

      const combinedText = textCandidates.join(' ');
      const { firstName, lastName } = extractNameParts(combinedText);

      if ((firstName && firstName !== 'Prospect') || lastName || phone) {
        parsed.push({
          category: 'descartes',
          firstName: firstName || 'Prospect',
          lastName: lastName || '',
          phone: phone || '',
          status: 'to_do',
          notes: 'Import PDF Lycée International Descartes',
          customFields: {
            'École de provenance': 'Lycée International Descartes'
          }
        });
      }
    }

    return parsed;
  };

  const handlePasteImport = async () => {
    setImportError('');
    if (!pasteText.trim()) {
      setImportError("Veuillez coller des données copiées depuis Excel ou Google Sheets.");
      return;
    }

    try {
      const parsed = parseImportedText(pasteText);

      if (parsed.length === 0) {
        setImportError("Aucun contact valide n'a été détecté. Assurez-vous de coller des lignes directement depuis Excel ou Google Sheets.");
        return;
      }

      const targetCategory = pasteTargetCategory;
      const targetProfile = activeProfileId === 'all' ? 'mehdi' : activeProfileId;

      const merge = window.confirm(`Détecté ${parsed.length} contacts. Souhaitez-vous AJOUTER ces contacts à la liste existante ?\n(Cliquez sur "Annuler" pour REMPLACER la liste actuelle)`);
      
      let newList: ProspectContact[];

      if (merge) {
        newList = [...prospects];
        parsed.forEach(p => {
          newList.push({
            ...p,
            profileId: p.profileId || targetProfile,
            category: targetCategory,
            id: 'local_' + Math.random().toString(36).substr(2, 9)
          } as ProspectContact);
        });
      } else {
        // Replace only contacts belonging to the targeted profile and targeted category
        const existingToKeep = prospects.filter(p => {
          const matchesProfile = (p.profileId || 'mehdi') === targetProfile;
          const matchesCategory = targetCategory === 'descartes' ? isDescartesProspect(p) : !isDescartesProspect(p);
          const isTargetForReplacement = matchesProfile && matchesCategory;
          return !isTargetForReplacement;
        });

        const newContacts = parsed.map(p => ({
          ...p,
          profileId: targetProfile,
          category: targetCategory,
          id: 'local_' + Math.random().toString(36).substr(2, 9)
        } as ProspectContact));

        newList = [...existingToKeep, ...newContacts];
      }

      const updated = await dataService.saveProspectsBulk(newList);
      const finalProspects = (updated && updated.length > 0) ? updated : newList;
      setProspects(finalProspects);
      setIsPasteOpen(false);
      setPasteText('');
      if (finalProspects.length > 0) {
        setActiveContactId(finalProspects[0].id);
      }
      showTemporarySuccess(`Importation Excel/Google Sheet réussie : ${parsed.length} contacts importés avec succès !`);
    } catch (e) {
      setImportError("Une erreur est survenue lors de l'importation.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Voulez-vous vraiment retirer ce contact de la liste ?")) {
      try {
        const updated = await dataService.deleteProspect(id);
        setProspects(updated);
        if (activeContactId === id) {
          setActiveContactId(updated.length > 0 ? updated[0].id : null);
        }
      } catch (e) {
        alert("Erreur lors de la suppression");
      }
    }
  };

  const handleClearAll = async () => {
    const currentProfileObj = profiles.find(pr => pr.id === activeProfileId);
    const profileName = currentProfileObj ? currentProfileObj.name : 'Tous les profils';

    const categoryName = 
      categoryFilter === 'sheets' ? '1er Google Sheet' :
      categoryFilter === 'descartes' ? 'Liste des Fiches / Descartes' :
      'Toutes les bases';

    let confirmMsg = `⚠️ Attention : Voulez-vous vraiment supprimer les contacts de la base "${categoryName}" pour le profil "${profileName}" ?`;
    if (activeProfileId === 'all' && categoryFilter === 'all') {
      confirmMsg = "⚠️ Attention : Voulez-vous vraiment supprimer TOUS les contacts de TOUTES les bases et de TOUS les profils ?";
    } else if (activeProfileId === 'all') {
      confirmMsg = `⚠️ Attention : Voulez-vous vraiment supprimer les contacts de la base "${categoryName}" pour TOUS les profils ?`;
    } else if (categoryFilter === 'all') {
      confirmMsg = `⚠️ Attention : Voulez-vous vraiment supprimer TOUS les contacts (toutes bases fondues) du profil "${profileName}" ?`;
    }

    confirmMsg += "\n\n(Les contacts des autres catégories et des autres profils resteront intacts).";

    if (window.confirm(confirmMsg)) {
      try {
        const contactsToKeep = prospects.filter(p => {
          const matchesProfile = activeProfileId === 'all' || (p.profileId || 'mehdi') === activeProfileId;
          const matchesCategory = 
            categoryFilter === 'all' ||
            (categoryFilter === 'descartes' ? isDescartesProspect(p) : !isDescartesProspect(p));

          const isTargetForDeletion = matchesProfile && matchesCategory;
          return !isTargetForDeletion;
        });

        const updated = await dataService.saveProspectsBulk(contactsToKeep);
        const finalProspects = (updated && Array.isArray(updated)) ? updated : contactsToKeep;
        setProspects(finalProspects);

        if (activeContactId && !finalProspects.some(p => p.id === activeContactId)) {
          setActiveContactId(finalProspects.length > 0 ? finalProspects[0].id : null);
        }
        setSelectedIds([]);
        showTemporarySuccess(`Base "${categoryName}" (${profileName}) vidée avec succès.`);
      } catch (e) {
        alert("Erreur lors de la réinitialisation de la base de données.");
      }
    }
  };

  const handleResetStatuses = async () => {
    if (window.confirm("Voulez-vous réinitialiser le statut de TOUS les contacts à 'À faire' ?")) {
      try {
        const updated = prospects.map(p => ({ ...p, status: 'to_do' as const }));
        const res = await dataService.saveProspectsBulk(updated);
        setProspects(res);
        showTemporarySuccess("Tous les statuts ont été remis à zéro !");
      } catch (e) {
        alert("Erreur lors de la mise à jour");
      }
    }
  };

  const openAddModal = () => {
    setEditingProspect(null);
    const initialCategory = categoryFilter === 'descartes' ? 'descartes' : 'sheets';
    const initialCustomFields: Record<string, string> = {};
    if (initialCategory === 'descartes') {
      initialCustomFields['École de provenance'] = 'Lycée International Descartes';
    }
    const targetProfile = activeProfileId === 'all' ? 'mehdi' : activeProfileId;
    setFormProspect({
      profileId: targetProfile,
      category: initialCategory,
      firstName: '',
      lastName: '',
      phone: '',
      status: 'to_do',
      notes: '',
      customFields: initialCustomFields
    });
    setIsEditModalOpen(true);
  };

  const openEditModal = (p: ProspectContact) => {
    setEditingProspect(p);
    setFormProspect({
      ...p,
      category: p.category || (isDescartesProspect(p) ? 'descartes' : 'sheets')
    });
    setIsEditModalOpen(true);
  };

  const handleSaveProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProspect.firstName || !formProspect.phone) {
      alert("Veuillez renseigner au moins le prénom et le téléphone.");
      return;
    }

    try {
      let updated: ProspectContact[];
      const cat = formProspect.category || (categoryFilter === 'descartes' ? 'descartes' : 'sheets');
      const customF = { ...(formProspect.customFields || {}) };
      if (cat === 'descartes' && !customF['École de provenance']) {
        customF['École de provenance'] = 'Lycée International Descartes';
      }

      const targetProfile = formProspect.profileId || (activeProfileId === 'all' ? 'mehdi' : activeProfileId);

      if (editingProspect) {
        updated = await dataService.updateProspect({
          ...editingProspect,
          ...formProspect,
          profileId: targetProfile,
          category: cat,
          customFields: customF
        } as ProspectContact);
      } else {
        updated = await dataService.addProspect({
          profileId: targetProfile,
          category: cat,
          firstName: formProspect.firstName,
          lastName: formProspect.lastName || '',
          phone: formProspect.phone,
          status: formProspect.status || 'to_do',
          notes: formProspect.notes || '',
          customFields: customF
        });
      }
      setProspects(updated);
      setIsEditModalOpen(false);
      showTemporarySuccess("Contact enregistré avec succès !");
      if (!editingProspect && updated.length > 0) {
        setActiveContactId(updated[updated.length - 1].id);
      }
    } catch (err) {
      alert("Erreur lors de l'enregistrement.");
    }
  };

  // Launch direct message and update status
  const sendWhatsAppMessage = async (contact: ProspectContact, target: 'jeune' | 'parent' | 'relance_jeune' | 'relance_parent' | 'descartes_jeune' | 'descartes_parent' = 'jeune') => {
    let template = templateBody;
    if (target === 'parent') template = parentTemplateBody;
    if (target === 'relance_jeune') template = relanceJeuneTemplateBody;
    if (target === 'relance_parent') template = relanceParentTemplateBody;
    if (target === 'descartes_jeune') template = descartesJeuneTemplateBody;
    if (target === 'descartes_parent') template = descartesParentTemplateBody;

    const message = personalizeMessage(template, contact);
    const encodedMsg = encodeURIComponent(message);
    const isParentTarget = target === 'parent' || target === 'relance_parent' || target === 'descartes_parent';
    const phoneToUse = isParentTarget ? (contact.parentPhone || contact.phone) : contact.phone;
    const formattedPhone = formatPhoneForWhatsApp(phoneToUse);
    const url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMsg}`;
    
    // Open in WhatsApp link
    window.open(url, '_blank');

    // Automatically transition state to "Envoyé" or prompt
    if (!campaignMode && contact.status !== 'sent') {
      try {
        const updated = await dataService.updateProspect({
          ...contact,
          status: 'sent',
          lastContactedAt: new Date().toISOString()
        });
        setProspects(updated);
      } catch (e) {
        console.error("Failed to automatically update contact state:", e);
      }
    }
  };

  // Selection toggle
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const getPreviewMessage = (contact: ProspectContact | null) => {
    if (!contact) return '';
    let template = templateBody;
    if (activeTemplateTab === 'parent') template = parentTemplateBody;
    if (activeTemplateTab === 'relance_jeune') template = relanceJeuneTemplateBody;
    if (activeTemplateTab === 'relance_parent') template = relanceParentTemplateBody;
    if (activeTemplateTab === 'descartes_jeune') template = descartesJeuneTemplateBody;
    if (activeTemplateTab === 'descartes_parent') template = descartesParentTemplateBody;
    return personalizeMessage(template, contact);
  };

  const handleMassDelete = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Voulez-vous supprimer ces ${selectedIds.length} contacts de la liste ?`)) {
      try {
        const updated = prospects.filter(p => !selectedIds.includes(p.id));
        const res = await dataService.saveProspectsBulk(updated);
        setProspects(res);
        setSelectedIds([]);
        setIsSelectionMode(false);
        setActiveContactId(res.length > 0 ? res[0].id : null);
        showTemporarySuccess("Suppression en masse effectuée.");
      } catch (e) {
        alert("Erreur lors de la suppression en masse");
      }
    }
  };

  const handleMassStatusUpdate = async (status: 'to_do' | 'in_progress' | 'sent' | 'ignored') => {
    if (selectedIds.length === 0) return;
    try {
      const updated = prospects.map(p => 
        selectedIds.includes(p.id) ? { ...p, status } : p
      );
      const res = await dataService.saveProspectsBulk(updated);
      setProspects(res);
      setSelectedIds([]);
      setIsSelectionMode(false);
      showTemporarySuccess(`Mise à jour en masse réussie (${selectedIds.length} contacts).`);
    } catch (e) {
      alert("Erreur lors de la mise à jour des statuts");
    }
  };

  // Campaign Workflow Queue
  const [campaignList, setCampaignList] = useState<ProspectContact[]>([]);
  
  const currentCampaignContact = campaignList[currentCampaignIndex] || null;

  const startCampaignFlow = (descartesOnly = false) => {
    const isDescartesFilterActive = descartesOnly || categoryFilter === 'descartes';
    const sourceProspects = isDescartesFilterActive 
      ? profileProspects.filter(p => isDescartesProspect(p))
      : (categoryFilter === 'sheets' ? profileProspects.filter(p => !isDescartesProspect(p)) : profileProspects);

    const list = sourceProspects.filter(p => p.status === 'to_do' || p.status === 'in_progress');
    if (list.length === 0) {
      alert(isDescartesFilterActive 
        ? "Aucun contact de Lycée Descartes à relancer avec le statut 'À faire' ou 'En cours' !" 
        : "Aucun contact à relancer avec le statut 'À faire' ou 'En cours' !"
      );
      return;
    }
    setCampaignList(list);
    setCurrentCampaignIndex(0);
    setCampaignMode(true);
  };

  const prevCampaignContact = () => {
    if (currentCampaignIndex > 0) {
      setCurrentCampaignIndex(prev => prev - 1);
    }
  };

  const nextCampaignContact = async (markCurrentStatus?: 'sent' | 'ignored') => {
    if (!currentCampaignContact) return;

    if (markCurrentStatus) {
      try {
        const updated = await dataService.updateProspect({
          ...currentCampaignContact,
          status: markCurrentStatus,
          lastContactedAt: new Date().toISOString()
        });
        setProspects(updated);
      } catch (e) {
        console.error(e);
      }
    }

    if (currentCampaignIndex + 1 < campaignList.length) {
      setCurrentCampaignIndex(prev => prev + 1);
    } else {
      setCampaignMode(false);
      setCampaignList([]);
      alert("🎉 Félicitations ! Vous avez parcouru toute votre liste de contacts.");
    }
  };

  const handleExportCSV = () => {
    if (prospects.length === 0) {
      alert("Aucune donnée à exporter.");
      return;
    }

    const headers = ["Prenom", "Nom", "Telephone", "Telephone Parent", "Statut", "Lien WhatsApp", "Notes", "DernierContact", ...availableCustomFields].join(",") + "\n";
    
    const rows = prospects.map(p => {
      const baseRow = [
        `"${p.firstName.replace(/"/g, '""')}"`,
        `"${p.lastName.replace(/"/g, '""')}"`,
        `"${p.phone}"`,
        `"${p.parentPhone || ''}"`,
        `"${p.status}"`,
        `"${(p.whatsappLink || '').replace(/"/g, '""')}"`,
        `"${(p.notes || '').replace(/"/g, '""')}"`,
        `"${p.lastContactedAt || ''}"`
      ];

      const customRow = availableCustomFields.map(cf => {
        const val = p.customFields && p.customFields[cf] ? p.customFields[cf] : '';
        return `"${val.replace(/"/g, '""')}"`;
      });

      return [...baseRow, ...customRow].join(",");
    }).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `campagne_prospects_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter prospects belonging to active profile
  const profileProspects = useMemo(() => {
    if (activeProfileId === 'all') return prospects;
    return prospects.filter(p => (p.profileId || 'mehdi') === activeProfileId);
  }, [prospects, activeProfileId]);

  // Counts per profile for tab badges
  const profileCounts = useMemo(() => {
    const map: Record<string, number> = { all: prospects.length };
    profiles.forEach(pr => {
      map[pr.id] = prospects.filter(p => (p.profileId || 'mehdi') === pr.id).length;
    });
    return map;
  }, [prospects, profiles]);

  // Live filtered list of prospects
  const filteredProspects = useMemo(() => {
    return profileProspects.filter(p => {
      // Category filter
      if (categoryFilter === 'sheets' && isDescartesProspect(p)) return false;
      if (categoryFilter === 'descartes' && !isDescartesProspect(p)) return false;

      const matchSearch = 
        p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone.includes(searchTerm) ||
        (p.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        JSON.stringify(p.customFields || {}).toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      
      return matchSearch && matchStatus;
    });
  }, [profileProspects, categoryFilter, searchTerm, statusFilter]);

  // 1er Google Sheets specific statistics
  const sheetsStats = useMemo(() => {
    const list = profileProspects.filter(p => !isDescartesProspect(p));
    const total = list.length;
    const toDo = list.filter(p => p.status === 'to_do').length;
    const inProgress = list.filter(p => p.status === 'in_progress').length;
    const sent = list.filter(p => p.status === 'sent').length;
    const ignored = list.filter(p => p.status === 'ignored').length;
    const progressPercent = total > 0 ? Math.round((sent / total) * 100) : 0;
    return { total, toDo, inProgress, sent, ignored, progressPercent };
  }, [profileProspects]);

  // Descartes specific statistics
  const descartesStats = useMemo(() => {
    const list = profileProspects.filter(p => isDescartesProspect(p));
    const total = list.length;
    const toDo = list.filter(p => p.status === 'to_do').length;
    const inProgress = list.filter(p => p.status === 'in_progress').length;
    const sent = list.filter(p => p.status === 'sent').length;
    const ignored = list.filter(p => p.status === 'ignored').length;
    const progressPercent = total > 0 ? Math.round((sent / total) * 100) : 0;
    return { total, toDo, inProgress, sent, ignored, progressPercent };
  }, [profileProspects]);

  // Collect all unique custom fields from prospects to show in template builder
  const availableCustomFields = useMemo(() => {
    const fields = new Set<string>();
    profileProspects.forEach(p => {
      if (p.customFields) {
        Object.keys(p.customFields).forEach(k => fields.add(k));
      }
    });
    return Array.from(fields);
  }, [profileProspects]);

  // Global Statistics
  const stats = useMemo(() => {
    const total = profileProspects.length;
    const toDo = profileProspects.filter(p => p.status === 'to_do').length;
    const inProgress = profileProspects.filter(p => p.status === 'in_progress').length;
    const sent = profileProspects.filter(p => p.status === 'sent').length;
    const ignored = profileProspects.filter(p => p.status === 'ignored').length;
    
    const progressPercent = total > 0 ? Math.round((sent / total) * 100) : 0;
    const completionPercent = total > 0 ? Math.round(((sent + ignored) / total) * 100) : 0;

    return { total, toDo, inProgress, sent, ignored, progressPercent, completionPercent };
  }, [profileProspects]);

  // Active statistics according to current category selection
  const activeStats = useMemo(() => {
    if (categoryFilter === 'sheets') return sheetsStats;
    if (categoryFilter === 'descartes') return descartesStats;
    return stats;
  }, [categoryFilter, sheetsStats, descartesStats, stats]);

  // Active contact for the dynamic side preview
  const activeContact = useMemo(() => {
    return prospects.find(p => p.id === activeContactId) || prospects[0] || null;
  }, [prospects, activeContactId]);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-1 sm:p-4 min-h-screen">
        
        {/* Header Title & Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/admin/dashboard')}
              className="p-2 hover:bg-white rounded-full transition-colors shadow-sm bg-white/60 border border-gray-200"
              title="Retour au Tableau de Bord"
            >
              <ArrowLeft size={18} className="text-gray-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Send className="text-bde-rose animate-pulse" size={24} />
                Relance & Prospection WhatsApp
              </h1>
              <p className="text-sm text-gray-500">Gérez, personnalisez et automatisez vos campagnes de prospection étudiante</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setPasteTargetCategory(categoryFilter === 'descartes' ? 'descartes' : 'sheets');
                setIsPasteOpen(true);
              }}
              className="px-3.5 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-sm font-bold flex items-center gap-2 border border-indigo-600 shadow-sm transition-all hover:scale-[1.01]"
            >
              <Clipboard size={16} />
              Coller Excel / Google Sheet
            </button>

            <button
              onClick={() => setIsPdfPreviewOpen(true)}
              className="px-3.5 py-2 bg-white text-gray-800 hover:bg-gray-50 rounded-xl text-sm font-bold flex items-center gap-2 border border-gray-300 shadow-sm transition-colors"
            >
              <Printer size={16} className="text-indigo-600" />
              Exporter PDF (Aperçu du travail)
            </button>

            <button
              onClick={handleClearAll}
              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-sm font-bold flex items-center gap-1.5 border border-red-200 transition-colors"
              title="Supprimer définitivement les données du profil actif"
            >
              <Trash2 size={16} />
              Vider la base
            </button>
          </div>
        </div>

        {/* PROFILE SELECTOR BANNER FOR TEAM COLLABORATION */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200/80 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold shadow-xs">
                <Users size={19} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  Espace de Travail par Profil & Collaborateur
                  <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 font-extrabold rounded-full flex items-center gap-1">
                    <ShieldCheck size={11} /> Données Séparées
                  </span>
                </h2>
                <p className="text-xs text-gray-500">
                  Sélectionnez un membre de l'équipe pour gérer ses prospects et ses campagnes en toute indépendance.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAddProfileModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <UserPlus size={15} />
              Nouveau membre
            </button>
          </div>

          {/* Profile Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
            {profiles.map(p => {
              const isActive = activeProfileId === p.id;
              const count = profileCounts[p.id] || 0;
              
              return (
                <button
                  key={p.id}
                  onClick={() => setActiveProfileId(p.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                    isActive
                      ? 'bg-bde-navy text-white border-bde-navy shadow-md ring-2 ring-indigo-200 scale-[1.02]'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="text-sm">{p.avatarEmoji || '👤'}</span>
                  <span>{p.name}</span>
                  <span className={`px-2 py-0.5 text-[10px] rounded-full font-extrabold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}

            <button
              onClick={() => setActiveProfileId('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                activeProfileId === 'all'
                  ? 'bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-slate-300 scale-[1.02]'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Building2 size={14} />
              <span>Vue globale (Tous)</span>
              <span className={`px-2 py-0.5 text-[10px] rounded-full font-extrabold ${
                activeProfileId === 'all' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {profileCounts['all'] || 0}
              </span>
            </button>
          </div>

          {/* Active profile prompt */}
          {activeProfileId !== 'all' && (
            <div className="mt-3 p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-indigo-600 shrink-0 animate-pulse" />
                <span>
                  Vous êtes sur le profil de <strong className="font-bold underline">{profiles.find(p => p.id === activeProfileId)?.senderName || profiles.find(p => p.id === activeProfileId)?.name}</strong>. Les prospects ajoutés, importés ou modifiés ici sont isolés pour ce profil.
                </span>
              </div>
              <span className="hidden sm:inline-block px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-lg font-bold text-[11px] shrink-0">
                {profileCounts[activeProfileId] || 0} contact(s)
              </span>
            </div>
          )}
        </div>

        {/* Temporary success notification banner */}
        {successMessage && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 animate-fade-in">
            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
            <p className="text-sm font-medium">{successMessage}</p>
          </div>
        )}

        {/* Campaign Metrics Section */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="p-2.5 bg-gray-100 text-gray-600 rounded-lg shrink-0">
              <UserCheck size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Prospects</p>
              <h3 className="text-lg font-bold text-gray-800">{activeStats.total}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">À faire</p>
              <h3 className="text-lg font-bold text-gray-800">{activeStats.toDo}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">En cours</p>
              <h3 className="text-lg font-bold text-gray-800">{activeStats.inProgress}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Envoyés</p>
              <h3 className="text-lg font-bold text-gray-800 text-emerald-600">{activeStats.sent}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 col-span-2 md:col-span-1">
            <div className="flex justify-between items-center mb-1">
              <p className="text-xs text-gray-500 font-medium">Progression</p>
              <span className="text-xs font-bold text-bde-rose">{activeStats.progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="bg-bde-rose h-2 rounded-full transition-all duration-500" 
                style={{ width: `${activeStats.progressPercent}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">{activeStats.sent} sur {activeStats.total} complétés</p>
          </div>
        </div>

        {/* Campaign Auto-Runner Overlay / Step Assistant */}
        {campaignMode && currentCampaignContact && (
          <div className="bg-gradient-to-r from-bde-navy to-indigo-950 text-white p-6 rounded-2xl shadow-xl mb-8 border border-indigo-800/50 animate-fade-in relative overflow-hidden">
            <div className="absolute right-0 top-0 w-64 h-64 bg-bde-rose/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <span className="bg-bde-rose text-white text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                  Campagne Active : {currentCampaignIndex + 1} / {campaignList.length}
                </span>
                <h2 className="text-xl font-bold flex items-center gap-2 pt-1">
                  Relance active pour : <span className="text-yellow-300">{currentCampaignContact.firstName} {currentCampaignContact.lastName}</span>
                </h2>
                <p className="text-xs text-gray-300">
                  Numéro : <span className="font-mono text-white">{currentCampaignContact.phone}</span> • Statut : <span className="capitalize">{currentCampaignContact.status.replace('_', ' ')}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={prevCampaignContact}
                  disabled={currentCampaignIndex === 0}
                  className="px-3.5 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all border border-white/20 shadow-sm"
                  title="Revenir au contact précédent"
                >
                  <ChevronLeft size={18} />
                  Précédent
                </button>

                <button
                  onClick={() => handleCampaignSend(currentCampaignContact, 'jeune')}
                  className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-colors"
                >
                  <Send size={18} />
                  {autoNextMode ? "Jeune & Auto-Suivant 🚀" : "Ouvrir Jeune"}
                </button>
                {currentCampaignContact.parentPhone && (
                  <button
                    onClick={() => handleCampaignSend(currentCampaignContact, 'parent')}
                    className="px-5 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-indigo-950/40 transition-colors"
                  >
                    <Send size={18} />
                    {autoNextMode ? "Parent & Auto-Suivant 🚀" : "Ouvrir Parent"}
                  </button>
                )}
                <button
                  onClick={() => nextCampaignContact('sent')}
                  className="px-4 py-3 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Check size={18} />
                  Marquer Envoyé & Suivant
                </button>
                <button
                  onClick={() => nextCampaignContact('ignored')}
                  className="px-3 py-3 bg-red-500/20 hover:bg-red-500/40 text-red-300 rounded-xl text-sm font-semibold transition-colors"
                >
                  Ignorer
                </button>
                <button
                  onClick={() => setCampaignMode(false)}
                  className="px-3 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-xl text-sm font-semibold transition-colors"
                >
                  Arrêter
                </button>
              </div>
            </div>

            {/* Inner Live Message Preview for campaign runner */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/30 p-4 rounded-xl border border-white/10 max-h-40 overflow-y-auto">
                <p className="text-xs text-gray-400 font-bold mb-1">Aperçu Jeune :</p>
                <p className="text-sm text-gray-100 whitespace-pre-line italic">
                  {personalizeMessage(templateBody, currentCampaignContact)}
                </p>
              </div>
              {currentCampaignContact.parentPhone && (
                <div className="bg-black/30 p-4 rounded-xl border border-white/10 max-h-40 overflow-y-auto">
                  <p className="text-xs text-gray-400 font-bold mb-1">Aperçu Parent :</p>
                  <p className="text-sm text-gray-100 whitespace-pre-line italic">
                    {personalizeMessage(parentTemplateBody, currentCampaignContact)}
                  </p>
                </div>
              )}
            </div>

            {/* Auto Next Mode Selector */}
            <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2 relative z-10 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer select-none text-gray-300 hover:text-white transition-colors">
                <input 
                  type="checkbox" 
                  checked={autoNextMode}
                  onChange={(e) => setAutoNextMode(e.target.checked)}
                  className="rounded border-gray-400 text-bde-rose focus:ring-bde-rose h-4 w-4 bg-white/10 border-white/20"
                />
                <span className="font-semibold flex items-center gap-1.5">
                  🚀 Activer le Mode Rafale (l'ouverture de WhatsApp valide et prépare le contact suivant automatiquement)
                </span>
              </label>
              <p className="text-[10px] text-gray-400 pl-6 leading-relaxed">
                <strong className="text-yellow-400/90">Note sur l'automatisation totale :</strong> WhatsApp bloque l'envoi de dizaines de messages simultanés sans clic manuel (protection anti-spam). Ce "Mode Rafale" est la méthode la plus rapide autorisée : cliquez sur Ouvrir, validez sur WhatsApp, et l'application passe instantanément au suivant sans action supplémentaire de votre part !
              </p>
            </div>
          </div>
        )}

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Panel: Campaign Drafting & Phone Live Preview (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Message Template Builder */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <Sparkles className="text-amber-500" size={20} />
                  1. Rédiger le modèle
                </h2>
                <button
                  onClick={handleSaveTemplate}
                  disabled={isTemplateSaving}
                  className="px-3 py-1.5 bg-bde-navy text-white text-xs font-semibold rounded-lg hover:bg-opacity-90 transition-opacity flex items-center gap-1 shadow-sm"
                >
                  <Check size={14} />
                  {isTemplateSaving ? 'Sauvegarde...' : 'Enregistrer'}
                </button>
              </div>

              {/* Template Tabs */}
              <div className="flex flex-wrap gap-1.5 border-b border-gray-200 mb-4 pb-2">
                <button
                  onClick={() => setActiveTemplateTab('jeune')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors ${activeTemplateTab === 'jeune' ? 'bg-bde-rose text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                >
                  Message Jeune
                </button>
                <button
                  onClick={() => setActiveTemplateTab('parent')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors ${activeTemplateTab === 'parent' ? 'bg-bde-rose text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                >
                  Message Parent
                </button>
                <button
                  onClick={() => setActiveTemplateTab('relance_jeune')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors ${activeTemplateTab === 'relance_jeune' ? 'bg-bde-rose text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                >
                  Relance Jeune
                </button>
                <button
                  onClick={() => setActiveTemplateTab('relance_parent')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors ${activeTemplateTab === 'relance_parent' ? 'bg-bde-rose text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                >
                  Relance Parent
                </button>
                <button
                  onClick={() => setActiveTemplateTab('descartes_jeune')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-1 ${activeTemplateTab === 'descartes_jeune' ? 'bg-indigo-700 text-white shadow-sm' : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'}`}
                >
                  <GraduationCap size={13} className="text-amber-400" /> Descartes Jeune
                </button>
                <button
                  onClick={() => setActiveTemplateTab('descartes_parent')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-1 ${activeTemplateTab === 'descartes_parent' ? 'bg-indigo-700 text-white shadow-sm' : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'}`}
                >
                  <GraduationCap size={13} className="text-amber-400" /> Descartes Parent
                </button>
              </div>

              <p className="text-xs text-gray-500 mb-3">
                Utilisez les balises ci-dessous pour personnaliser dynamiquement le message avec les données du prospect.
              </p>

              {/* Tags Shortcut Buttons */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <button 
                  onClick={() => insertTag('{prenom}')} 
                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-mono font-semibold rounded-md border border-indigo-200 transition-colors"
                >
                  + Prénom
                </button>
                <button 
                  onClick={() => insertTag('{nom}')} 
                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-mono font-semibold rounded-md border border-indigo-200 transition-colors"
                >
                  + Nom
                </button>
                <button 
                  onClick={() => insertTag('{telephone}')} 
                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-mono font-semibold rounded-md border border-indigo-200 transition-colors"
                >
                  + Téléphone
                </button>
                {availableCustomFields.map(field => (
                  <button 
                    key={field}
                    onClick={() => insertTag(`{${field}}`)} 
                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-mono font-semibold rounded-md border border-emerald-200 transition-colors truncate max-w-[150px]"
                    title={`Ajouter la colonne: ${field}`}
                  >
                    + {field}
                  </button>
                ))}
              </div>

              {/* Template editor body */}
              <div className="relative">
                <textarea
                  id="template-textarea"
                  rows={7}
                  value={
                    activeTemplateTab === 'jeune' ? templateBody : 
                    activeTemplateTab === 'parent' ? parentTemplateBody : 
                    activeTemplateTab === 'relance_jeune' ? relanceJeuneTemplateBody : 
                    activeTemplateTab === 'relance_parent' ? relanceParentTemplateBody : 
                    activeTemplateTab === 'descartes_jeune' ? descartesJeuneTemplateBody : 
                    descartesParentTemplateBody
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (activeTemplateTab === 'jeune') setTemplateBody(val);
                    else if (activeTemplateTab === 'parent') setParentTemplateBody(val);
                    else if (activeTemplateTab === 'relance_jeune') setRelanceJeuneTemplateBody(val);
                    else if (activeTemplateTab === 'relance_parent') setRelanceParentTemplateBody(val);
                    else if (activeTemplateTab === 'descartes_jeune') setDescartesJeuneTemplateBody(val);
                    else if (activeTemplateTab === 'descartes_parent') setDescartesParentTemplateBody(val);
                  }}
                  placeholder={`Rédigez ici votre modèle de message pour ${activeTemplateTab}...`}
                  className="w-full p-3.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-bde-rose focus:border-transparent outline-none font-sans leading-relaxed resize-none bg-gray-50 focus:bg-white transition-all"
                />
              </div>

              <div className="mt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                <button
                  onClick={() => {
                    if (activeTemplateTab === 'descartes_parent') {
                      setDescartesParentTemplateBody("Bonjour M./Mme {nom},\n\nJ'espère que vous allez bien. Je suis Méhdi Traoré, de l'Institut Français du Numérique (IFRAN).\n\nSuite aux carrefours d'orientation au Lycée International Descartes 🎓 concernant l'avenir académique de votre enfant {prenom}, je reviens vers vous.\n\nL'IFRAN propose des cursus d'excellence dans le numérique très prisés des élèves du réseau AEFE / Descartes.\n\nAvez-vous déjà arrêté votre choix pour l'orientation de {prenom} ? Nous serions ravis de vous transmettre notre documentation détaillée. 😊");
                    } else {
                      setDescartesJeuneTemplateBody("Bonjour {prenom} ! 👋\n\nJ'espère que tu vas bien. Je suis Méhdi Traoré, de l'Institut Français du Numérique (l'IFRAN).\n\nEn tant qu'élève au Lycée International Descartes 🎓, tu prépares ton orientation Post-Bac. Nos Bachelors et formations supérieures (Génie Logiciel, Design, Data & IA) sont particulièrement adaptés au rythme du Bac Français et au réseau AEFE.\n\nAs-tu déjà choisi ton université pour l'an prochain, ou souhaites-tu recevoir notre brochure spéciale Descartes & échanger avec nous ? 😊");
                      if (activeTemplateTab !== 'descartes_jeune') {
                        setActiveTemplateTab('descartes_jeune');
                      }
                    }
                    showTemporarySuccess("Modèle spécial Lycée Descartes chargé !");
                  }}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Sparkles size={14} className="text-amber-600 shrink-0" />
                  Charger le modèle spécial Lycée Descartes
                </button>
              </div>

              <div className="mt-2 bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-800 text-[11px] flex gap-2">
                <Info size={16} className="shrink-0 text-amber-600 mt-0.5" />
                <p>
                  Astuce : L'envoi WhatsApp ouvrira une discussion avec le texte prérempli. Vous n'aurez plus qu'à cliquer sur "Entrée" ou "Envoyer" dans l'application ou l'onglet WhatsApp Web !
                </p>
              </div>
            </div>

            {/* Smart Phone Interactive Mockup */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
              <h2 className="font-bold text-gray-800 text-lg mb-4 text-left w-full flex items-center gap-2">
                <MessageSquare className="text-emerald-500" size={20} />
                2. Aperçu du message
              </h2>

              {activeContact ? (
                <div className="w-full max-w-[320px] bg-slate-900 rounded-[36px] p-3 shadow-xl border-4 border-slate-800 relative overflow-hidden">
                  {/* Speaker and Camera notch mock */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-800 rounded-full z-20 flex items-center justify-center">
                    <div className="w-10 h-1 bg-gray-700 rounded-full mr-2"></div>
                    <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
                  </div>

                  {/* Screen Content */}
                  <div className="bg-[#efeae2] rounded-[28px] overflow-hidden min-h-[360px] flex flex-col relative pt-6 text-xs text-gray-800 select-none">
                    
                    {/* Phone Header Mockup */}
                    <div className="bg-[#075e54] text-white p-3 pt-4 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-400 text-white font-bold flex items-center justify-center text-xs">
                        {activeContact.firstName.charAt(0).toUpperCase()}
                      </div>
                      <div className="leading-tight">
                        <p className="font-bold">{activeContact.firstName} {activeContact.lastName}</p>
                        <p className="text-[10px] opacity-75">En ligne</p>
                      </div>
                    </div>

                    {/* Chat Bubble Body */}
                    <div className="flex-1 p-3 flex flex-col justify-end space-y-4">
                      <div className="bg-white border border-gray-200/50 p-3 rounded-2xl rounded-tl-none max-w-[85%] shadow-sm self-start leading-relaxed text-gray-700 font-sans whitespace-pre-line relative animate-fade-in">
                        {getPreviewMessage(activeContact) || "Modèle vide. Écrivez quelque chose ci-dessus !"}
                        <span className="text-[9px] text-gray-400 block text-right mt-1">
                          {new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>

                    {/* Message Box Bottom Input */}
                    <div className="p-2 bg-gray-100 flex items-center gap-1.5 border-t border-gray-200/50">
                      <div className="bg-white flex-1 rounded-full px-3 py-1.5 text-gray-400 text-[10px]">
                        Message pour {activeContact.firstName}...
                      </div>
                      <div className="w-7 h-7 rounded-full bg-[#075e54] text-white flex items-center justify-center shadow">
                        <Send size={12} className="ml-0.5" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
                  <AlertCircle size={32} className="text-gray-300" />
                  <p>Aucun contact importé pour afficher l'aperçu.</p>
                </div>
              )}
            </div>

            {/* Custom fields for active contact */}
            {activeContact && activeContact.customFields && Object.keys(activeContact.customFields).length > 0 && (
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Sparkles className="text-indigo-500" size={15} />
                  Informations du contact
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(activeContact.customFields).map(([key, val]) => (
                    <div key={key} className="bg-gray-50/70 p-2.5 rounded-lg border border-gray-100/50">
                      <span className="text-[9px] text-gray-400 font-bold uppercase block truncate" title={key}>{key}</span>
                      <span className="text-xs font-semibold text-gray-700 block whitespace-pre-wrap break-all mt-0.5" title={val}>{val || '-'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Panel: Prospects List & Campaign Controls (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Category Tabs directly linked to Contacts and Campaign Table */}
            <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-gray-200/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => {
                    setCategoryFilter('sheets');
                    setImportMode('standard');
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    categoryFilter === 'sheets'
                      ? 'bg-bde-navy text-white shadow-md ring-2 ring-slate-400'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FileText size={15} />
                  Catégorie 1 : 1er Google Sheet
                  <span className={`px-2 py-0.5 text-[10px] rounded-full font-extrabold ${
                    categoryFilter === 'sheets' ? 'bg-white text-bde-navy' : 'bg-gray-200 text-gray-800'
                  }`}>
                    {sheetsStats.total}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setCategoryFilter('descartes');
                    setImportMode('descartes_pdf');
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    categoryFilter === 'descartes'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md ring-2 ring-indigo-300'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                  }`}
                >
                  <GraduationCap size={15} className={categoryFilter === 'descartes' ? 'text-yellow-300' : 'text-indigo-600'} />
                  Catégorie 2 : Lycée International Descartes
                  <span className={`px-2 py-0.5 text-[10px] rounded-full font-extrabold ${
                    categoryFilter === 'descartes' ? 'bg-white text-indigo-900' : 'bg-indigo-200 text-indigo-800'
                  }`}>
                    {descartesStats.total}
                  </span>
                </button>

                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    categoryFilter === 'all'
                      ? 'bg-gray-800 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Building2 size={14} />
                  Toutes les catégories ({stats.total})
                </button>
              </div>

              {categoryFilter === 'descartes' && (
                <button
                  onClick={() => {
                    setImportMode('descartes_pdf');
                    setIsPasteOpen(true);
                  }}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Clipboard size={14} />
                  Importer PDF Descartes
                </button>
              )}

              {categoryFilter === 'sheets' && (
                <button
                  onClick={() => {
                    setImportMode('standard');
                    setIsPasteOpen(true);
                  }}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Clipboard size={14} />
                  Importer 1er Google Sheet
                </button>
              )}
            </div>

            {/* Campaign Control Toolbar & Contacts Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              
              <div className="p-6 border-b border-gray-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                      <TrendingUp className="text-bde-rose" size={20} />
                      Contacts & Gestion de Campagne
                    </h2>
                    <p className="text-xs text-gray-500">
                      {categoryFilter === 'sheets' && "Base active : 1er Google Sheet"}
                      {categoryFilter === 'descartes' && "Base active : Lycée International Descartes"}
                      {categoryFilter === 'all' && "Base globale : Toutes les catégories"}
                    </p>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => startCampaignFlow(categoryFilter === 'descartes')}
                      disabled={filteredProspects.filter(p => p.status === 'to_do' || p.status === 'in_progress').length === 0}
                      className={`px-4 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer disabled:bg-gray-200 disabled:text-gray-400 ${
                        categoryFilter === 'descartes'
                          ? 'bg-indigo-700 hover:bg-indigo-800 shadow-indigo-100'
                          : 'bg-bde-rose hover:bg-opacity-90 shadow-rose-100'
                      }`}
                    >
                      <Play size={14} fill="currentColor" />
                      {categoryFilter === 'descartes' ? 'Lancer Relances Descartes' : 'Lancer la Campagne'}
                      ({filteredProspects.filter(p => p.status === 'to_do' || p.status === 'in_progress').length})
                    </button>
                    
                    <button
                      onClick={openAddModal}
                      className="px-3 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors shrink-0"
                    >
                      <Plus size={14} />
                      Ajouter contact
                    </button>
                  </div>
                </div>

                {/* Sub-toolbar tools */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-5 pt-4 border-t border-gray-100">
                  {/* Search and filters */}
                  <div className="flex flex-wrap items-center gap-2 flex-1">
                    <div className="relative flex-1 min-w-[180px]">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Rechercher un prospect..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-bde-rose outline-none"
                      />
                    </div>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="p-1.5 bg-gray-50 border border-gray-200 text-xs text-gray-600 rounded-lg outline-none"
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="to_do">À faire</option>
                      <option value="in_progress">En cours</option>
                      <option value="sent">Envoyé</option>
                      <option value="ignored">Ignoré</option>
                    </select>
                  </div>

                  {/* Mass action button controls */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setIsSelectionMode(!isSelectionMode);
                        if (isSelectionMode) setSelectedIds([]);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        isSelectionMode 
                          ? 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' 
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 shadow-sm'
                      }`}
                    >
                      {isSelectionMode ? 'Annuler' : 'Sélection multiple'}
                    </button>

                    {/* Reset campaign list controls */}
                    {!isSelectionMode && prospects.length > 0 && (
                      <div className="flex items-center gap-1 ml-1">
                        <button
                          onClick={handleResetStatuses}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg border border-amber-100"
                          title="Remettre tous les statuts à zéro"
                        >
                          <RefreshCw size={14} />
                        </button>
                        <button
                          onClick={handleClearAll}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-red-100"
                          title="Vider toute la liste"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mass selection action menu bar */}
                {isSelectionMode && selectedIds.length > 0 && (
                  <div className="mt-3 p-2 bg-indigo-50 border border-indigo-100 rounded-lg flex flex-wrap items-center justify-between gap-2 animate-fade-in text-xs">
                    <span className="font-semibold text-indigo-800">
                      {selectedIds.length} contact(s) sélectionné(s)
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleMassStatusUpdate('to_do')}
                        className="px-2 py-1 bg-white text-rose-600 hover:bg-rose-50 border border-gray-200 rounded font-semibold text-[11px]"
                      >
                        Mettre "À faire"
                      </button>
                      <button
                        onClick={() => handleMassStatusUpdate('sent')}
                        className="px-2 py-1 bg-white text-emerald-600 hover:bg-emerald-50 border border-gray-200 rounded font-semibold text-[11px]"
                      >
                        Mettre "Envoyé"
                      </button>
                      <button
                        onClick={handleMassDelete}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-semibold text-[11px] flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Contacts Table View */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      {isSelectionMode && <th className="p-4 w-10 text-center"></th>}
                      <th className="p-4">Nom et Prénom</th>
                      <th className="p-4">Classe</th>
                      <th className="p-4">École de provenance</th>
                      <th className="p-4">Tél. jeune</th>
                      <th className="p-4">Tél. parent</th>
                      <th className="p-4">Filière souhaitée</th>
                      <th className="p-4">Statut</th>
                      <th className="p-4 text-center">Relancer</th>
                      <th className="p-4 rounded-tr-lg">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProspects.map((reg) => {
                      const isSelected = selectedIds.includes(reg.id);
                      const isActive = activeContactId === reg.id;
                      
                      let statusBadge = (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-100">
                          À faire
                        </span>
                      );
                      if (reg.status === 'in_progress') {
                        statusBadge = (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-100">
                            En cours
                          </span>
                        );
                      } else if (reg.status === 'sent') {
                        statusBadge = (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
                            Envoyé
                          </span>
                        );
                      } else if (reg.status === 'ignored') {
                        statusBadge = (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-50 text-gray-500 border border-gray-200">
                            Ignoré
                          </span>
                        );
                      }

                      return (
                        <tr 
                          key={reg.id} 
                          onClick={() => {
                            if (!isSelectionMode) setActiveContactId(reg.id);
                          }}
                          className={`hover:bg-gray-50/70 transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50/50' : ''} ${isActive ? 'bg-amber-50/20' : ''}`}
                        >
                          {isSelectionMode && (
                            <td className="p-4 text-center" onClick={(e) => {
                              e.stopPropagation();
                              toggleSelection(reg.id);
                            }}>
                              {isSelected ? (
                                <CheckSquare className="text-bde-rose mx-auto" size={16} />
                              ) : (
                                <Square className="text-gray-400 mx-auto" size={16} />
                              )}
                            </td>
                          )}

                          <td className="p-4">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-bold text-gray-900 text-sm">
                                  {reg.firstName} {reg.lastName}
                                </p>
                                {activeProfileId === 'all' && (
                                  <span className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-800 text-[9px] font-bold rounded-md flex items-center gap-1 shrink-0" title={`Appartient à ${profiles.find(p => p.id === (reg.profileId || 'mehdi'))?.name}`}>
                                    <span>{profiles.find(p => p.id === (reg.profileId || 'mehdi'))?.avatarEmoji || '👤'}</span>
                                    <span>{profiles.find(p => p.id === (reg.profileId || 'mehdi'))?.name || 'Mehdi'}</span>
                                  </span>
                                )}
                                {isDescartesProspect(reg) && (
                                  <span className="px-1.5 py-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-extrabold rounded-md shadow-2xs flex items-center gap-0.5 shrink-0" title="Prospect du Lycée International Descartes">
                                    <GraduationCap size={10} className="text-yellow-300" /> Descartes
                                  </span>
                                )}
                              </div>
                              {reg.notes && (
                                <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{reg.notes}</p>
                              )}
                            </div>
                          </td>

                          <td className="p-4 text-gray-600 text-xs">
                            {getCustomFieldValue(reg.customFields, 'Classe')}
                          </td>

                          <td className="p-4 text-gray-600 text-xs">
                            {getCustomFieldValue(reg.customFields, 'École de provenance')}
                          </td>

                          <td className="p-4 text-gray-600 text-xs font-mono">
                            {reg.phone || '-'}
                          </td>

                          <td className="p-4 text-gray-600 text-xs font-mono">
                            {reg.parentPhone || '-'}
                          </td>

                          <td className="p-4 text-gray-600 text-xs">
                            {getCustomFieldValue(reg.customFields, 'Filière souhaitée')}
                          </td>

                          <td className="p-4">
                            {statusBadge}
                          </td>

                          <td className="p-4 text-center">
                            <div className="flex gap-1 justify-center flex-wrap" onClick={(e) => e.stopPropagation()}>
                              {isDescartesProspect(reg) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    sendWhatsAppMessage(reg, 'descartes_jeune');
                                  }}
                                  className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors inline-flex shadow-xs"
                                  title="Contacter avec le modèle Spécial Lycée Descartes"
                                >
                                  <GraduationCap size={14} className="text-yellow-300" />
                                </button>
                              )}
                              {reg.status === 'to_do' ? (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      sendWhatsAppMessage(reg, 'jeune');
                                    }}
                                    className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-700 rounded-full transition-colors inline-flex"
                                    title="Contacter Jeune sur WhatsApp"
                                  >
                                    <Send size={14} />
                                  </button>
                                  {reg.parentPhone && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        sendWhatsAppMessage(reg, 'parent');
                                      }}
                                      className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 rounded-full transition-colors inline-flex"
                                      title="Contacter Parent sur WhatsApp"
                                    >
                                      <Send size={14} />
                                    </button>
                                  )}
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      sendWhatsAppMessage(reg, 'relance_jeune');
                                    }}
                                    className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 hover:text-amber-700 rounded-full transition-colors inline-flex"
                                    title="Relancer Jeune sur WhatsApp"
                                  >
                                    <Send size={14} />
                                  </button>
                                  {reg.parentPhone && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        sendWhatsAppMessage(reg, 'relance_parent');
                                      }}
                                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-full transition-colors inline-flex"
                                      title="Relancer Parent sur WhatsApp"
                                    >
                                      <Send size={14} />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => openEditModal(reg)} 
                                className="p-1 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" 
                                title="Modifier"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => handleDelete(reg.id)} 
                                className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors" 
                                title="Supprimer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    
                    {filteredProspects.length === 0 && (
                      <tr>
                        <td colSpan={isSelectionMode ? 6 : 5} className="p-12 text-center text-gray-400 text-sm">
                          <AlertCircle className="mx-auto mb-2 text-gray-300" size={32} />
                          <p className="font-semibold text-gray-600">Aucun contact trouvé</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Commencez par importer des contacts ou coller des cellules Excel.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {filteredProspects.length > 0 && (
                    <tfoot className="bg-gray-50 border-t border-gray-100">
                      <tr>
                        <td colSpan={isSelectionMode ? 6 : 5} className="p-4 text-right text-xs font-bold text-gray-600">
                          Total : {filteredProspects.length} prospect(s) affiché(s)
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Paste Excel/Sheets Modal */}
      {isPasteOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-2xl relative">
            <button
              onClick={() => setIsPasteOpen(false)}
              className="absolute right-4 top-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
                <Clipboard size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Coller des données Excel / Google Sheet</h2>
                <p className="text-xs text-gray-500">Copiez des lignes directement depuis votre tableur Excel ou Google Sheets</p>
              </div>
            </div>

            <div className="mt-4 mb-4">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Destination / Base de données cible :</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPasteTargetCategory('sheets')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                    pasteTargetCategory === 'sheets'
                      ? 'bg-bde-navy text-white border-bde-navy shadow-sm'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <FileText size={15} />
                  1er Google Sheet
                </button>
                <button
                  type="button"
                  onClick={() => setPasteTargetCategory('descartes')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                    pasteTargetCategory === 'descartes'
                      ? 'bg-indigo-700 text-white border-indigo-700 shadow-sm'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                  }`}
                >
                  <GraduationCap size={15} />
                  Liste des Fiches / Descartes
                </button>
              </div>
            </div>

            {importError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle size={15} />
                {importError}
              </div>
            )}

            <div className="space-y-4">
              <textarea
                rows={8}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Collez vos lignes/colonnes copiées depuis Excel ou Google Sheets ici...\n\nExemple de format collé :\nDupont\tJean\tTerminale D\t0102030405\t0505050505\tInformatique\nDiallo\tFatou\tTerminale A\t0708091011\t\tGestion"
                className="w-full p-3 border border-gray-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white resize-none leading-relaxed"
              />

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsPasteOpen(false);
                    setPasteText('');
                    setImportError('');
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="button"
                  onClick={handlePasteImport}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  Analyser et Importer les contacts
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Exporter PDF (Aperçu du travail) */}
      {isPdfPreviewOpen && (
        <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-6 overflow-y-auto animate-fade-in print:p-0 print:bg-white print:static">
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              #printable-report, #printable-report * {
                visibility: visible !important;
              }
              #printable-report {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 20px !important;
                background: white !important;
                color: black !important;
              }
            }
          `}</style>
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden print:max-h-none print:shadow-none print:w-full print:rounded-none">
            
            {/* Non-printable Modal Controls Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Rapport d'Aperçu du Travail</h3>
                  <p className="text-[11px] text-slate-400">Générez un PDF officiel pour la révision de votre campagne de relances</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                >
                  <Printer size={15} />
                  Imprimer / Enregistrer en PDF
                </button>
                <button
                  onClick={() => setIsPdfPreviewOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Area */}
            <div id="printable-report" className="p-6 sm:p-8 overflow-y-auto space-y-6 print:p-0 print:overflow-visible">
              {/* Document Letterhead */}
              <div className="border-b-2 border-gray-900 pb-5 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-xl">
                    <Send size={22} className="text-indigo-600" />
                    BDE - Prospection & Relances WhatsApp
                  </div>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Aperçu officiel de l'avancement du travail et statut des prospects</p>
                </div>
                <div className="text-right text-xs text-gray-600 space-y-0.5">
                  <p className="font-bold text-gray-900">
                    Profil : {profiles.find(p => p.id === activeProfileId)?.senderName || profiles.find(p => p.id === activeProfileId)?.name || 'Vue Globale (Tous)'}
                  </p>
                  <p>Date : {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  <p className="text-[11px] text-indigo-700 font-semibold">
                    Base : {categoryFilter === 'sheets' ? '1er Google Sheet' : categoryFilter === 'descartes' ? 'Lycée International Descartes' : 'Toutes les bases'}
                  </p>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Total Contacts</p>
                  <p className="text-lg font-black text-gray-900">{activeStats.total}</p>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-[10px] font-bold text-amber-700 uppercase">À Faire</p>
                  <p className="text-lg font-black text-amber-900">{activeStats.toDo}</p>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase">Relancés / Envoyés</p>
                  <p className="text-lg font-black text-emerald-900">{activeStats.sent}</p>
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <p className="text-[10px] font-bold text-indigo-700 uppercase">Taux d'Avancement</p>
                  <p className="text-lg font-black text-indigo-900">{activeStats.progressPercent}%</p>
                </div>
              </div>

              {/* Table of Prospects */}
              <div>
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>Liste des prospects ({filteredProspects.length})</span>
                  <span className="text-[10px] font-normal text-gray-500">Document généré automatiquement</span>
                </h4>

                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                      <tr>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">Nom & Prénom</th>
                        <th className="p-2.5">Téléphone</th>
                        <th className="p-2.5">École / Provenance</th>
                        <th className="p-2.5">Statut</th>
                        <th className="p-2.5">Profil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                      {filteredProspects.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-4 text-center text-gray-400">Aucun contact disponible dans ce filtre.</td>
                        </tr>
                      ) : (
                        filteredProspects.map((p, idx) => {
                          const prof = profiles.find(pr => pr.id === (p.profileId || 'mehdi'));
                          const provenance = p.customFields?.['École de provenance'] || (isDescartesProspect(p) ? 'Lycée Descartes' : 'Non précisée');
                          
                          return (
                            <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                              <td className="p-2.5 font-bold text-gray-400">{idx + 1}</td>
                              <td className="p-2.5 font-bold text-gray-900">{p.firstName} {p.lastName}</td>
                              <td className="p-2.5 font-mono text-gray-700">{p.phone}</td>
                              <td className="p-2.5 text-gray-600">{provenance}</td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  p.status === 'sent' ? 'bg-emerald-100 text-emerald-800' :
                                  p.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                  p.status === 'ignored' ? 'bg-red-100 text-red-800' :
                                  'bg-amber-100 text-amber-800'
                                }`}>
                                  {p.status === 'sent' ? 'Relancé' :
                                   p.status === 'in_progress' ? 'En cours' :
                                   p.status === 'ignored' ? 'Ignoré' : 'À faire'}
                                </span>
                              </td>
                              <td className="p-2.5 text-gray-500 font-semibold">{prof?.name || 'Mehdi'}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-gray-200 text-center text-[11px] text-gray-400 flex items-center justify-between">
                <span>Plateforme de Relances WhatsApp - BDE</span>
                <span>Page 1 / 1</span>
              </div>
            </div>

            {/* Non-printable Modal Footer Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0 print:hidden">
              <button
                onClick={() => setIsPdfPreviewOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-100"
              >
                Fermer
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md"
              >
                <Printer size={16} />
                Imprimer / Télécharger en PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Prospect Addition / Edition Dialog */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-800 mb-6">
              {editingProspect ? "Modifier le prospect" : "Nouveau prospect"}
            </h2>
            <form onSubmit={handleSaveProspect} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Catégorie / Base de données</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormProspect(prev => {
                        const newFields = { ...(prev.customFields || {}) };
                        delete newFields['École de provenance'];
                        return { ...prev, category: 'sheets', customFields: newFields };
                      });
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      formProspect.category !== 'descartes'
                        ? 'bg-bde-navy text-white border-bde-navy shadow-xs'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    1er Google Sheets
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormProspect(prev => {
                        const newFields = { ...(prev.customFields || {}), 'École de provenance': 'Lycée International Descartes' };
                        return { ...prev, category: 'descartes', customFields: newFields };
                      });
                    }}
                    className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      formProspect.category === 'descartes'
                        ? 'bg-indigo-700 text-white border-indigo-700 shadow-xs'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    Lycée Descartes
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Prénom *</label>
                  <input 
                    type="text" required
                    value={formProspect.firstName || ''}
                    onChange={e => setFormProspect({...formProspect, firstName: e.target.value})}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-bde-rose outline-none"
                    placeholder="Ex: Jean"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nom</label>
                  <input 
                    type="text"
                    value={formProspect.lastName || ''}
                    onChange={e => setFormProspect({...formProspect, lastName: e.target.value})}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-bde-rose outline-none"
                    placeholder="Ex: Dupont"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Numéro WhatsApp *</label>
                <input 
                  type="text" required
                  value={formProspect.phone || ''}
                  onChange={e => setFormProspect({...formProspect, phone: e.target.value})}
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-bde-rose outline-none font-mono"
                  placeholder="Ex: 0102030405"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Attribué au Profil / Collaborateur</label>
                <select 
                  value={formProspect.profileId || (activeProfileId === 'all' ? 'mehdi' : activeProfileId)}
                  onChange={e => setFormProspect({...formProspect, profileId: e.target.value})}
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-bde-rose outline-none bg-white font-medium"
                >
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.avatarEmoji || '👤'} {p.name} ({p.senderName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Statut</label>
                <select 
                  value={formProspect.status || 'to_do'}
                  onChange={e => setFormProspect({...formProspect, status: e.target.value as any})}
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-bde-rose outline-none bg-white"
                >
                  <option value="to_do">À faire</option>
                  <option value="in_progress">En cours</option>
                  <option value="sent">Envoyé</option>
                  <option value="ignored">Ignoré</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notes / Commentaire</label>
                <textarea 
                  rows={2}
                  value={formProspect.notes || ''}
                  onChange={e => setFormProspect({...formProspect, notes: e.target.value})}
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-sm focus:ring-1 focus:ring-bde-rose outline-none resize-none"
                  placeholder="Notes sur le prospect (filière d'intérêt, etc.)"
                />
              </div>

              {/* Edit existing custom fields */}
              {formProspect.customFields && Object.keys(formProspect.customFields).length > 0 && (
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Champs Personnalisés</span>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(formProspect.customFields).map(([key, val]) => (
                      <div key={key} className="flex flex-col">
                        <label className="block text-[9px] text-gray-500 font-semibold mb-0.5 truncate" title={key}>{key}</label>
                        <input 
                          type="text"
                          value={val || ''}
                          onChange={e => {
                            const updatedFields = { ...formProspect.customFields, [key]: e.target.value };
                            setFormProspect({ ...formProspect, customFields: updatedFields });
                          }}
                          className="w-full p-2 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-bde-rose bg-gray-50 focus:bg-white transition-all"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm hover:bg-gray-50 font-semibold transition-colors"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-bde-rose hover:bg-opacity-90 text-white rounded-xl text-sm font-semibold transition-opacity"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Create New Profile Modal */}
      {isAddProfileModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddProfileModalOpen(false)}
              className="absolute right-4 top-4 p-1 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
                <UserPlus size={18} />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Ajouter un nouveau membre</h2>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Chaque membre aura sa propre base de prospects isolée dans la catégorie WhatsApp Relancer.
            </p>

            <form onSubmit={handleAddProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Prénom / Nom du membre *</label>
                <input
                  type="text"
                  required
                  value={newProfileName}
                  onChange={e => setNewProfileName(e.target.value)}
                  placeholder="Ex: Emmanuelle, Nour, Joshua, Othniel..."
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nom d'expéditeur (dans le message)</label>
                <input
                  type="text"
                  value={newProfileSender}
                  onChange={e => setNewProfileSender(e.target.value)}
                  placeholder="Ex: Emmanuelle (ou laissez vide)"
                  className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[10px] text-gray-400 mt-1">Sera utilisé pour remplacer {"{expediteur}"} et personnaliser les relances.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Rôle</label>
                  <input
                    type="text"
                    value={newProfileRole}
                    onChange={e => setNewProfileRole(e.target.value)}
                    placeholder="Ex: Relanceur"
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Émojis Avatar</label>
                  <select
                    value={newProfileEmoji}
                    onChange={e => setNewProfileEmoji(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="👤">👤 Défaut</option>
                    <option value="🌸">🌸 Emmanuelle</option>
                    <option value="⚡">⚡ Nour</option>
                    <option value="🚀">🚀 Joshua</option>
                    <option value="🌟">🌟 Othniel</option>
                    <option value="🎯">🎯 Membre</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-gray-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsAddProfileModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md"
                >
                  Créer le profil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminProspects;
