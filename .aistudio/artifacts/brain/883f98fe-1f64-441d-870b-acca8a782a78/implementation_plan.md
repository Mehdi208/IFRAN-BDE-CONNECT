# Plan d'Implémentation : Gestion des Polos Étudiants & Suivi de Stock en Temps Réel

## 1. Vue d'Ensemble & Objectifs
Création d'un module complet **« Suivi Polos & Stocks »** dans l'espace Administrateur (`/admin/polos`) permettant à tous les membres connectés au BDE / Administration de gérer en **temps réel** (synchronisation instantanée via Firebase Firestore `onSnapshot`) :
- L'attribution et la réservation des polos pour chaque étudiant (Nom, Prénom(s), Classe, Année/Couleur de Polo, Taille souhaitée, Date).
- Le suivi financier précis par étudiant (**Payé**, **Acompte versé** avec montant payé et reste à payer, ou **Non payé**).
- Le statut de remise physique (**Polo déjà remis** vs **En attente de stock / Réservé**).
- La gestion de l'inventaire par **Couleur/Année** et par **Taille (`S`, `M`, `L`, `XL`, `XXL`, `3XL`)**, avec détection automatique des **ruptures de stock** et calcul exact du **nombre de polos à commander** par taille et par couleur.
- L'exportation en **PDF** du **Bon de Commande Fournisseur** (récapitulatif exact des quantités à commander par couleur et taille) ainsi que l'export **PDF et CSV** de la liste complète des étudiants.

---

## 2. Modèle de Données & Synchronisation Temps Réel (`types.ts` & `services/dataService.ts`)

### A. Types de Polos & Tailles (`types.ts`)
- **Couleurs par Niveau (`PoloColorYear`)** :
  - `BLANC_1A` : **Polo Blanc - 1ère année**
  - `ROUGE_2A` : **Polo Rouge - 2e année**
  - `BLEU_3A` : **Polo Bleu - 3e année**
- **Tailles disponibles (`PoloSize`)** : `'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL'`
- **Enregistrement Étudiant (`StudentPoloOrder`)** :
  - `id`: Identifiant unique
  - `lastName`: Nom de l'étudiant
  - `firstName`: Prénom(s) de l'étudiant
  - `studentClass`: Classe / Filière (ex. *B1 Créa, B1 Dev, B1 Com, B2 Créa, B2 Dev, B2 Com, B3...* ou saisie libre)
  - `poloType`: `'BLANC_1A' | 'ROUGE_2A' | 'BLEU_3A'` (automatiquement lié à l'année ou sélectionnable)
  - `size`: `'S' | 'M' | 'L' | 'XL' | 'XXL' | '3XL'`
  - `date`: Date de prise / réservation (`YYYY-MM-DD`)
  - `paymentStatus`: `'PAID' | 'PARTIAL' | 'UNPAID'` (Payé / Acompte / Non payé)
  - `amountPaid`: Montant versé en FCFA (ex. `5.000` FCFA)
  - `totalPrice`: Prix unitaire du polo en FCFA
  - `deliveryStatus`: `'DELIVERED' | 'PENDING_STOCK'` (Polo déjà remis / En attente de stock)
  - `notes`: Observation éventuelle
  - `updatedAt`: Horodatage de dernière mise à jour
- **Inventaire & Stock (`PoloStockConfig`)** :
  - Stock initial / approvisionné par combinaison `poloType` × `size` (18 références au total : 3 couleurs × 6 tailles).
  - Seuil d'alerte de stock faible configurable (par défaut : alerte stock bas à `≤ 3` unités, rupture à `0` ou déficit négatif).
  - Prix unitaire de référence modifiable.

### B. Synchronisation Temps Réel Firestore (`services/dataService.ts`)
- **Collection `polo_orders`** :
  - `subscribeToPoloOrders(callback)` utilisant `onSnapshot` de Firestore pour mettre à jour instantanément l'écran de tous les administrateurs connectés dès qu'un étudiant est ajouté, modifié ou supprimé.
  - Fonctions CRUD : `addPoloOrder`, `updatePoloOrder`, `deletePoloOrder` avec sauvegarde locale de secours (`localStorage`).
- **Document / Collection `polo_inventory`** :
  - `subscribeToPoloInventory(callback)` utilisant `onSnapshot` pour synchroniser en temps réel les quantités en stock initiales et les réapprovisionnements enregistrés.
  - Fonction `updatePoloStock(poloType, size, newTotalStock)` et bouton rapide `« Réceptionner une commande (+X au stock) »`.

---

## 3. Logique de Calcul du Stock & des Commandes Fournisseur

Pour chaque couleur (**Blanc - 1ère année**, **Rouge - 2e année**, **Bleu - 3e année**) et chaque taille (**S, M, L, XL, XXL, 3XL**) :
1. **Stock Total Approvisionné** : Nombre total de polos reçus par le BDE/Administration pour cette taille et couleur.
2. **Polos Remis (`DELIVERED`)** : Nombre d'étudiants ayant déjà récupéré physiquement leur polo.
3. **Stock Physique Disponible** : $\text{Stock Approvisionné} - \text{Polos Remis}$.
4. **Demandes en Attente (`PENDING_STOCK`)** : Étudiants ayant demandé cette taille/couleur mais n'ayant pas encore reçu leur polo (faute de stock ou réservé).
5. **Quantité Exacte à Commander (`À Commander`)** :
   - Si $(\text{Demandes en Attente} > \text{Stock Physique Disponible})$, alors :
     $$\text{À Commander} = \text{Demandes en Attente} - \text{Stock Physique Disponible}$$
   - Permet de savoir immédiatement, en cas de rupture, **combien de polos exacts commander, dans quelle taille précise et dans quelle couleur précise**.

---

## 4. Architecture de l'Interface Administrateur (`pages/admin/AdminPolos.tsx`)

### A. Bandeau de Synthèse Temps Réel (KPIs en Haut de Page)
- **Total Étudiants Enregistrés** (avec répartition Polos Remis vs En attente de stock).
- **Stock Physique Restant** (somme des unités en stock et nombre de tailles en rupture).
- **Polos à Commander (Ruptures / Déficit)** : Total exact de polos manquants à commander auprès du fournisseur avec alerte visuelle si $> 0$.
- **Bilan des Encaissements Polos** : Total encaissé en FCFA (formaté avec des points, ex. `150.000 FCFA`) + Reste à recouvrer sur les acomptes et non-payés.

### B. Matrice Interactive des Stocks & Alertes de Rupture (3 Cartes par Couleur/Année)
- Trois blocs visuels distincts :
  1. **Polo Blanc — 1ère Année**
  2. **Polo Rouge — 2e Année**
  3. **Polo Bleu — 3e Année**
- Pour chaque couleur, une grille claire des **6 tailles (`S`, `M`, `L`, `XL`, `XXL`, `3XL`)** affichant en police tabulaire (`tabular-nums`) :
  - **Stock dispo** (modifiable en 1 clic avec boutons `-` / `+` ou saisie directe du stock reçu).
  - **Remis** (nombre d'étudiants servis).
  - **En attente** (étudiants en attente de polo).
  - **Statut & À commander** :
    - *En stock* (Vert)
    - *Stock faible* (Ambre, $\le 3$ unités)
    - *Rupture / À commander : X unité(s)* (Rouge vif si stock à 0 ou demande $>$ disponible).

### C. Récapitulatif Automatique « Bon de Commande Fournisseur »
- Panneau dédié qui liste automatiquement toutes les références en rupture ou en déficit (ex. *Polo Blanc 1ère année — Taille L : 4 à commander*, *Polo Rouge 2e année — Taille XL : 2 à commander*).
- Possibilité d'ajouter une marge de sécurité optionnelle (ex. +2 ou +5 polos de stock tampon) avant d'exporter le **Bon de Commande PDF**.

### D. Registre des Étudiants (Ajout, Recherche, Filtres & Actions Rapides)
- **Formulaire / Modal d'enregistrement rapide** :
  - Nom & Prénom(s)
  - Classe & Sélection automatique ou manuelle du Polo (`Polo Blanc - 1ère année`, `Polo Rouge - 2e année`, `Polo Bleu - 3e année`)
  - Taille souhaitée (`S`, `M`, `L`, `XL`, `XXL`, `3XL`) avec indication immédiate si la taille est en stock ou en rupture
  - Date de prise / réservation (pré-remplie à la date du jour)
  - Statut de paiement (`Payé`, `Acompte`, `Non payé`) et montant payé
  - Statut de remise (`Polo déjà remis` ou `En attente de stock` — bascule automatiquement sur *En attente de stock* si le stock disponible de cette taille est à 0)
- **Barre de filtres multicritères** :
  - Recherche instantanée par nom, prénom ou classe
  - Filtre par Couleur/Année (`Tous`, `Blanc - 1A`, `Rouge - 2A`, `Bleu - 3A`)
  - Filtre par Taille (`Toutes`, `S`, `M`, `L`, `XL`, `XXL`, `3XL`)
  - Filtre par Statut de Paiement (`Tous`, `Payé`, `Acompte`, `Non payé`)
  - Filtre par Statut de Remise (`Tous`, `Remis`, `En attente de stock`)
- **Actions en 1 clic dans le tableau** :
  - Basculer un étudiant de *Non payé / Acompte* à *Payé*.
  - Basculer un étudiant de *En attente de stock* à *Polo remis* dès que le réapprovisionnement arrive.
  - Modifier ou supprimer une ligne.

---

## 5. Exports PDF & CSV (`services/pdfService.ts` & `pages/admin/AdminPolos.tsx`)
- **Export PDF — Bon de Commande Fournisseur** :
  - En-tête officiel avec le logo de l'**INSTITUT FRANÇAIS DU NUMÉRIQUE (IFRAN)**.
  - Tableau matriciel par couleur (`Blanc 1A`, `Rouge 2A`, `Bleu 3A`) et par taille (`S` à `3XL`) indiquant le stock actuel, le nombre d'étudiants en attente et la **quantité exacte à commander**.
- **Export PDF & CSV — Liste de Suivi des Étudiants** :
  - Liste complète ou filtrée des étudiants avec Nom, Prénom(s), Classe, Polo, Taille, Date, Statut de Paiement (montants formatés avec des points `.` et jamais de `/`), et Statut de Remise.

---

## 6. Intégration dans la Navigation (`App.tsx` & `components/AdminLayout.tsx`)
- Ajout de la route protégée `/admin/polos` dans `App.tsx`.
- Ajout de l'entrée **« Polos & Stocks »** (icône `Shirt` de `lucide-react`) dans la barre latérale de `components/AdminLayout.tsx`.
