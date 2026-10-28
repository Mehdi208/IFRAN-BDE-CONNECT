# Plan d'Implémentation : Visualisation Analytique Recharts sur la Page Polos & Stocks (`AdminPolos.tsx`)

## 1. Objectif
Ajouter une section de **visualisation analytique en temps réel** (avec la bibliothèque `recharts` déjà présente dans le projet) positionnée **en haut de la page `AdminPolos.tsx`, juste sous les 4 cartes KPI**, afin d'offrir aux administrateurs une vue d'ensemble immédiate sur :
1. **La répartition des stocks et demandes par année/couleur** via un **Graphique en Barres Empilées (`BarChart`)**.
2. **Le taux de paiement global des étudiants** via un **Graphique en Anneau (`PieChart` / Donut)**.

---

## 2. Architecture des Graphiques (`pages/admin/AdminPolos.tsx`)

### A. Positionnement & Mise en Page
- Grille responsive à **2 colonnes** (`grid-cols-1 lg:grid-cols-2 gap-5`) placée directement sous la bande des 4 cartes KPI et au-dessus de la section `01. État du Stock par Couleur (Année) et Taille`.
- Respect strict du design système BDE IFRAN (support complet du Mode Clair et du Mode Sombre `#131b2e`, bordures fines `border-slate-200 dark:border-slate-800`, police tabulaire `font-mono tabular-nums` pour toutes les valeurs chiffrées et montants formatés avec des points `.`).

### B. Graphique 1 : Répartition des Stocks par Année — Barres Empilées (`BarChart`)
- **Axe X (`year`)** :
  - `Blanc - 1ère Année`
  - `Rouge - 2e Année`
  - `Bleu - 3e Année`
- **Séries empilées (`stackId="poloStock"`)** :
  1. **Polos Remis (`delivered`)** — Vert Émeraude (`#10b981`) : Nombre d'étudiants ayant déjà récupéré leur polo.
  2. **Stock Physique Disponible (`available`)** — Bleu Indigo (`#3b82f6`) : Nombre de polos restant physiquement en stock.
  3. **En Attente de Stock / À Commander (`pending`)** — Ambre/Rose (`#f59e0b` / `#e11d48`) : Demandes étudiantes en attente de réapprovisionnement.
- **Infobulle personnalisée (`CustomTooltip`)** :
  - Affiche le détail exact pour l'année survolée (Stock initial approvisionné, Polos remis, Stock disponible, En attente, et Déficit à commander).

### C. Graphique 2 : Taux de Paiement Global des Étudiants — Anneau Donut (`PieChart`)
- **Données segmentées** :
  1. **Payé intégralement (`PAID`)** — Vert Émeraude (`#10b981`)
  2. **Acompte versé (`PARTIAL`)** — Ambre (`#f59e0b`)
  3. **Non payé (`UNPAID`)** — Rose/Rouge (`#e11d48`)
- **Indicateur central & Légende enrichie** :
  - Affichage du **Taux de Paiement Global (%)** au centre ou à côté de l'anneau (pourcentage d'étudiants à jour de paiement + ratio financier encaissé vs total attendu en FCFA).
  - Gestion élégante de l'état vide (si `0` étudiant enregistré, affichage d'un anneau neutre indicatif avec message explicite).

---

## 3. Fichiers Modifiés
- `pages/admin/AdminPolos.tsx` :
  - Importation des composants `ResponsiveContainer`, `BarChart`, `Bar`, `XAxis`, `YAxis`, `CartesianGrid`, `Tooltip`, `Legend`, `PieChart`, `Pie`, `Cell` depuis `recharts`.
  - Calcul mémorisé (`useMemo`) des séries `stockChartData` et `paymentChartData` synchronisées en temps réel avec Firestore.
  - Intégration de la section graphique entre les KPIs et la matrice des tailles.
