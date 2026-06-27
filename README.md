# GGA 2026 — Logiciel de Gestion Gomme Arabique

Logiciel de gestion complet pour **Camara Mahamadou** — Gestion Gomme Arabique 2026.

## Fonctionnalités

- **Tableau de Bord** : KPIs, graphiques en temps réel, dettes collecteurs
- **Registre Employés** : Friable Femmes/Garçons, Karaya Femmes/Garçons, Collecteurs
- **Présence Hebdomadaire** : Suivi Présent/Absent avec calcul automatique des salaires
- **Fiches de Paiement** : Générées automatiquement, imprimables
- **Collecteurs & Stock** : Suivi des livraisons, prix, acomptes, dettes
- **Dépenses** : Suivi complet par catégorie et par mois
- **Rapports** : Graphiques mensuels/annuels, export Excel
- **Paramètres** : Email, sauvegarde/restauration des données

## Installation & Lancement

```bash
npm install
npm run dev
```

Ouvrez `http://localhost:5173` dans votre navigateur.

## Utilisation sur Android (PWA)

L'application est une **Progressive Web App**. Pour l'utiliser sur Android :

1. Ouvrez l'URL dans Chrome sur Android
2. Appuyez sur le menu (3 points) → "Ajouter à l'écran d'accueil"
3. L'application s'installe comme une vraie application

## Export Excel

Les données peuvent être exportées vers Excel depuis l'onglet **Rapports**.

## Sauvegarde

Les données sont stockées localement. Exportez régulièrement depuis **Paramètres** pour éviter toute perte.
