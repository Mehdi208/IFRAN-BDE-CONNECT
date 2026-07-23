import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';
import { ProspectContact } from '../../types';
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
  ChevronRight, 
  AlertCircle,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';

const AdminProspects = () => {
  const navigate = useNavigate();
  const [prospects, setProspects] = useState<ProspectContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [templateBody, setTemplateBody] = useState('');
  const [parentTemplateBody, setParentTemplateBody] = useState('');
  const [activeTemplateTab, setActiveTemplateTab] = useState<'jeune' | 'parent'>('jeune');
  const [isTemplateSaving, setIsTemplateSaving] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [isPasteOpen, setIsPasteOpen] = useState(false);
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

  // Campaign auto-advance handler
  const handleCampaignSend = async (contact: ProspectContact, target: 'jeune' | 'parent' = 'jeune') => {
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
      setTemplateBody(tJeune);
      setParentTemplateBody(tParent);
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

  // Replace template tags with contact details
  const personalizeMessage = (template: string, contact: ProspectContact | Partial<ProspectContact>): string => {
    if (!template) return '';
    let msg = template
      .replace(/{prenom}/gi, contact.firstName || '')
      .replace(/{nom}/gi, contact.lastName || '')
      .replace(/{telephone}/gi, contact.phone || '');

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

  const handleSaveTemplate = async () => {
    setIsTemplateSaving(true);
    try {
      if (activeTemplateTab === 'jeune') {
        await dataService.saveCampaignTemplate(templateBody, 'jeune');
      } else {
        await dataService.saveCampaignTemplate(parentTemplateBody, 'parent');
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
    } else {
      setParentTemplateBody(newText);
    }
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
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
    const firstLineColsLower = firstLineCols.map(c => c.toLowerCase());
    
    const firstNameHeaders = ['prénom', 'prenom', 'first name', 'firstname', 'nom1', 'first', 'nom et prénom', 'nom et prenom', 'nom complet', 'nom'];
    const lastNameHeaders = ['nom', 'last name', 'lastname', 'family name', 'surname', 'last'];
    const phoneHeaders = ['téléphone', 'telephone', 'tél', 'tel', 'phone', 'phone number', 'numéro', 'numero', 'whatsapp', 'tel', 'num', 'contact', 'cell'];
    const youthPhoneHeaders = ['jeune', 'eleve', 'élève', 'enfant', 'candidat'];
    const parentPhoneHeaders = ['parent', 'pere', 'père', 'mere', 'mère', 'tuteur'];
    const linkHeaders = ['lien', 'lien whatsapp', 'url', 'whatsapp link'];
    const statusHeaders = ['statut', 'status', 'état', 'etat'];

    let firstNameIdx = firstLineColsLower.findIndex(col => firstNameHeaders.some(h => col === h || col.includes(h)));
    let lastNameIdx = firstLineColsLower.findIndex(col => lastNameHeaders.some(h => col === h || col.includes(h)) && col !== 'nom et prénom' && col !== 'nom'); // 'nom' can be ambiguous, let's just let it be caught by firstNameIdx if 'nom et prenom'
    
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

    // Collect custom columns indices
    const customCols: { name: string; idx: number }[] = [];
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
            customFields[cc.name] = cols[cc.idx];
          }
        });
      } else {
        // Fallback column guessing if NO headers were found
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

  const handlePasteImport = async () => {
    setImportError('');
    if (!pasteText.trim()) {
      setImportError("Veuillez coller du texte d'abord.");
      return;
    }

    try {
      const parsed = parseImportedText(pasteText);
      if (parsed.length === 0) {
        setImportError("Aucun contact valide détecté. Vérifiez le format.");
        return;
      }

      // Bulk save (replaces current list, or prompts to add to it)
      const merge = window.confirm(`Détecté ${parsed.length} contacts. Souhaitez-vous AJOUTER ces contacts à la liste existante ?\n(Cliquez sur "Annuler" pour REMPLACER la liste actuelle)`);
      
      let newList: ProspectContact[];
      if (merge) {
        newList = [...prospects];
        parsed.forEach(p => {
          newList.push({
            ...p,
            id: 'local_' + Math.random().toString(36).substr(2, 9)
          } as ProspectContact);
        });
      } else {
        newList = parsed.map(p => ({
          ...p,
          id: 'local_' + Math.random().toString(36).substr(2, 9)
        } as ProspectContact));
      }

      const updated = await dataService.saveProspectsBulk(newList);
      setProspects(updated);
      setIsPasteOpen(false);
      setPasteText('');
      if (updated.length > 0) {
        setActiveContactId(updated[0].id);
      }
      showTemporarySuccess(`Importation réussie : ${parsed.length} contacts synchronisés !`);
    } catch (e) {
      setImportError("Une erreur est survenue lors de l'importation.");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const parsed = parseImportedText(text);
        if (parsed.length === 0) {
          setImportError("Aucun contact valide détecté dans le fichier.");
          return;
        }

        const merge = window.confirm(`Détecté ${parsed.length} contacts. Souhaitez-vous AJOUTER ces contacts à la liste existante ?\n(Cliquez sur "Annuler" pour REMPLACER la liste actuelle)`);
        
        let newList: ProspectContact[];
        if (merge) {
          newList = [...prospects];
          parsed.forEach(p => {
            newList.push({
              ...p,
              id: 'local_' + Math.random().toString(36).substr(2, 9)
            } as ProspectContact);
          });
        } else {
          newList = parsed.map(p => ({
            ...p,
            id: 'local_' + Math.random().toString(36).substr(2, 9)
          } as ProspectContact));
        }

        const updated = await dataService.saveProspectsBulk(newList);
        setProspects(updated);
        if (updated.length > 0) {
          setActiveContactId(updated[0].id);
        }
        showTemporarySuccess(`Importation réussie : ${parsed.length} contacts importés depuis le fichier !`);
      } catch (err) {
        setImportError("Erreur lors de la lecture du fichier CSV.");
      }
    };
    reader.readAsText(file);
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
    if (window.confirm("⚠️ Attention : Voulez-vous vraiment supprimer TOUS les contacts de la campagne ? Cette action est irréversible.")) {
      try {
        const updated = await dataService.saveProspectsBulk([]);
        setProspects(updated);
        setActiveContactId(null);
        showTemporarySuccess("Toutes les données de la campagne ont été effacées.");
      } catch (e) {
        alert("Erreur lors de la réinitialisation");
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
    setFormProspect({
      firstName: '',
      lastName: '',
      phone: '',
      status: 'to_do',
      notes: ''
    });
    setIsEditModalOpen(true);
  };

  const openEditModal = (p: ProspectContact) => {
    setEditingProspect(p);
    setFormProspect(p);
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
      if (editingProspect) {
        updated = await dataService.updateProspect({
          ...editingProspect,
          ...formProspect
        } as ProspectContact);
      } else {
        updated = await dataService.addProspect({
          firstName: formProspect.firstName,
          lastName: formProspect.lastName || '',
          phone: formProspect.phone,
          status: formProspect.status || 'to_do',
          notes: formProspect.notes || ''
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
  const sendWhatsAppMessage = async (contact: ProspectContact, target: 'jeune' | 'parent' = 'jeune') => {
    const template = target === 'jeune' ? templateBody : parentTemplateBody;
    const message = personalizeMessage(template, contact);
    const encodedMsg = encodeURIComponent(message);
    const phoneToUse = target === 'jeune' ? contact.phone : (contact.parentPhone || contact.phone);
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
    const template = activeTemplateTab === 'jeune' ? templateBody : parentTemplateBody;
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

  const startCampaignFlow = () => {
    const list = prospects.filter(p => p.status === 'to_do' || p.status === 'in_progress');
    if (list.length === 0) {
      alert("Aucun contact à relancer avec le statut 'À faire' ou 'En cours' !");
      return;
    }
    setCampaignList(list);
    setCurrentCampaignIndex(0);
    setCampaignMode(true);
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

  // Live filtered list of prospects
  const filteredProspects = useMemo(() => {
    return prospects.filter(p => {
      const matchSearch = 
        p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone.includes(searchTerm) ||
        (p.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      
      return matchSearch && matchStatus;
    });
  }, [prospects, searchTerm, statusFilter]);

  // Collect all unique custom fields from prospects to show in template builder
  const availableCustomFields = useMemo(() => {
    const fields = new Set<string>();
    prospects.forEach(p => {
      if (p.customFields) {
        Object.keys(p.customFields).forEach(k => fields.add(k));
      }
    });
    return Array.from(fields);
  }, [prospects]);

  // Statistics
  const stats = useMemo(() => {
    const total = prospects.length;
    const toDo = prospects.filter(p => p.status === 'to_do').length;
    const inProgress = prospects.filter(p => p.status === 'in_progress').length;
    const sent = prospects.filter(p => p.status === 'sent').length;
    const ignored = prospects.filter(p => p.status === 'ignored').length;
    
    const progressPercent = total > 0 ? Math.round((sent / total) * 100) : 0;
    const completionPercent = total > 0 ? Math.round(((sent + ignored) / total) * 100) : 0;

    return { total, toDo, inProgress, sent, ignored, progressPercent, completionPercent };
  }, [prospects]);

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
              onClick={() => setIsPasteOpen(true)}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-sm font-semibold flex items-center gap-2 border border-indigo-200 transition-colors"
            >
              <Clipboard size={16} />
              Coller des cellules Excel/Sheets
            </button>
            <label className="px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-semibold flex items-center gap-2 border border-emerald-200 cursor-pointer transition-colors">
              <UploadCloud size={16} />
              Importer un CSV
              <input 
                type="file" 
                accept=".csv,.txt" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
            </label>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-white text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-semibold flex items-center gap-2 border border-gray-200 shadow-sm transition-colors"
            >
              <FileDown size={16} />
              Exporter CSV
            </button>
          </div>
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
              <h3 className="text-lg font-bold text-gray-800">{stats.total}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">À faire</p>
              <h3 className="text-lg font-bold text-gray-800">{stats.toDo}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">En cours</p>
              <h3 className="text-lg font-bold text-gray-800">{stats.inProgress}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Envoyés</p>
              <h3 className="text-lg font-bold text-gray-800 text-emerald-600">{stats.sent}</h3>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 col-span-2 md:col-span-1">
            <div className="flex justify-between items-center mb-1">
              <p className="text-xs text-gray-500 font-medium">Progression</p>
              <span className="text-xs font-bold text-bde-rose">{stats.progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div 
                className="bg-bde-rose h-2 rounded-full transition-all duration-500" 
                style={{ width: `${stats.progressPercent}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">{stats.sent} sur {stats.total} complétés</p>
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

              <div className="flex flex-wrap gap-2">
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
              <div className="flex gap-2 border-b border-gray-200 mb-4 pb-2">
                <button
                  onClick={() => setActiveTemplateTab('jeune')}
                  className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTemplateTab === 'jeune' ? 'bg-bde-rose text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                >
                  Message Jeune
                </button>
                <button
                  onClick={() => setActiveTemplateTab('parent')}
                  className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTemplateTab === 'parent' ? 'bg-bde-rose text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                >
                  Message Parent
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
                  value={activeTemplateTab === 'jeune' ? templateBody : parentTemplateBody}
                  onChange={(e) => activeTemplateTab === 'jeune' ? setTemplateBody(e.target.value) : setParentTemplateBody(e.target.value)}
                  placeholder={`Rédigez ici votre modèle de message pour le ${activeTemplateTab}...`}
                  className="w-full p-3.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-bde-rose focus:border-transparent outline-none font-sans leading-relaxed resize-none bg-gray-50 focus:bg-white transition-all"
                />
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
          <div className="lg:col-span-7 space-y-6">
            
            {/* Campaign Control Toolbar & Contacts Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              
              <div className="p-6 border-b border-gray-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                      <TrendingUp className="text-bde-rose" size={20} />
                      3. Contacts & Gestion de Campagne
                    </h2>
                    <p className="text-xs text-gray-500">Sélectionnez, modifiez et lancez vos messages</p>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={startCampaignFlow}
                      disabled={prospects.filter(p => p.status === 'to_do' || p.status === 'in_progress').length === 0}
                      className="px-4 py-2 bg-bde-rose hover:bg-opacity-90 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-100 transition-all cursor-pointer"
                    >
                      <Play size={14} fill="currentColor" />
                      Lancer la Campagne
                    </button>
                    
                    <button
                      onClick={openAddModal}
                      className="px-3 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
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
                      <th className="p-4">Contact</th>
                      <th className="p-4">Téléphone</th>
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
                              <p className="font-bold text-gray-900 text-sm">
                                {reg.firstName} {reg.lastName}
                              </p>
                              {reg.notes && (
                                <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{reg.notes}</p>
                              )}
                              {reg.customFields && Object.keys(reg.customFields).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Object.entries(reg.customFields).slice(0, 3).map(([key, val]) => (
                                    <span key={key} className="inline-block text-[9px] bg-indigo-50/80 text-indigo-700 px-1.5 py-0.5 rounded font-medium max-w-[120px] truncate border border-indigo-100" title={`${key}: ${val}`}>
                                      {val}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="p-4 text-gray-600 text-xs font-mono">
                            <div>
                              <span>{reg.phone}</span>
                              {reg.parentPhone && (
                                <span className="block mt-1 text-[10px] text-indigo-500">Parent: {reg.parentPhone}</span>
                              )}
                            </div>
                          </td>

                          <td className="p-4">
                            {statusBadge}
                          </td>

                          <td className="p-4 text-center">
                            <div className="flex gap-1 justify-center" onClick={(e) => e.stopPropagation()}>
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

      {/* Paste Excel/Sheets Cells Modal Box */}
      {isPasteOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Clipboard className="text-indigo-600" size={20} />
              Coller des cellules Excel / Google Sheets
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Copiez directement vos lignes/colonnes depuis Excel ou Google Sheets (Nom et prénom, Classe, École de provenance, Tél. jeune, Tél. parent, Filière souhaitée) et collez-les dans la zone ci-dessous. Les colonnes seront détectées automatiquement !
            </p>

            {importError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle size={14} />
                {importError}
              </div>
            )}

            <div className="space-y-4">
              <textarea
                rows={8}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Exemple de format collé :&#10;Jean Dupont	Terminale D	Lycée Classique	0102030405	0505050505	Informatique"
                className="w-full p-3 border border-gray-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white resize-none"
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
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Analyser et Importer
                </button>
              </div>
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
    </AdminLayout>
  );
};

export default AdminProspects;
