# Guide : Gestion de plusieurs organisations

## Situation actuelle

### ✅ Ce qui fonctionne

1. **Interface Admin (`/admin/orgs`)** :
   - ✅ Affiche **toutes les organisations**
   - ✅ Permet de créer plusieurs organisations
   - ✅ Permet de gérer les membres de chaque organisation

2. **Base de données** :
   - ✅ Un utilisateur **peut être membre de plusieurs organisations**
   - ✅ Chaque organisation peut avoir plusieurs sessions
   - ✅ Les sessions sont liées à une organisation spécifique

### ⚠️ Limitations actuelles

1. **Dashboard Formateur (`/trainer`)** :
   - ⚠️ Affiche seulement **une seule organisation** (la plus récente)
   - ⚠️ Ne permet pas de **sélectionner** entre plusieurs organisations
   - ⚠️ Si vous êtes formateur dans plusieurs classes/orgs, vous ne voyez que la première

2. **Détermination du rôle** :
   - ⚠️ `getUserRole()` retourne seulement la première organisation trouvée
   - ⚠️ Utilise `.limit(1)` donc prend la plus récente

## Comment ça fonctionne actuellement

### Pour les Admins
- **Interface Admin** : Vous voyez **toutes les organisations** dans `/admin/orgs`
- **Dashboard Formateur** : Vous voyez la première organisation trouvée (ou toutes les sessions si admin)

### Pour les Formateurs
- Si vous êtes formateur dans **plusieurs organisations** :
  - Le système prend la **première organisation** (la plus récente)
  - Vous voyez seulement les sessions de cette organisation dans `/trainer`
  - Les autres organisations ne sont pas accessibles depuis le dashboard formateur

### Pour les Étudiants
- Si un étudiant est dans plusieurs organisations :
  - Le système détermine son rôle depuis la première organisation trouvée
  - Ses soumissions sont liées à la session correspondante (automatiquement)

## Solutions possibles

### Option 1 : Sélecteur d'organisation (Recommandé)

Ajouter un sélecteur dans le dashboard formateur pour choisir l'organisation active :

```
┌─────────────────────────────────────┐
│ Dashboard Formateur                │
│                                     │
│ Organisation: [Classe A ▼]         │
│   - Classe A                       │
│   - Classe B                       │
│   - Classe C                       │
│                                     │
│ Sessions de Classe A:              │
│   - Session 1                      │
│   - Session 2                      │
└─────────────────────────────────────┘
```

**Avantages** :
- Permet de gérer plusieurs classes facilement
- Interface claire et intuitive
- Pas de changement de structure de données

### Option 2 : Vue multi-organisations

Afficher toutes les organisations avec leurs sessions :

```
┌─────────────────────────────────────┐
│ Dashboard Formateur                │
│                                     │
│ 📁 Classe A                        │
│   - Session 1                      │
│   - Session 2                      │
│                                     │
│ 📁 Classe B                        │
│   - Session 3                      │
│                                     │
│ 📁 Classe C                        │
│   - Session 4                      │
└─────────────────────────────────────┘
```

**Avantages** :
- Vue d'ensemble de toutes les classes
- Pas besoin de changer d'organisation

### Option 3 : Garder l'état actuel

Si vous n'avez qu'une organisation à la fois, l'état actuel fonctionne.

## Recommandation

Pour gérer **plusieurs classes en même temps**, je recommande l'**Option 1 (Sélecteur d'organisation)** car :
1. C'est le plus flexible
2. Interface claire
3. Permet de se concentrer sur une classe à la fois
4. Facile à implémenter

## Implémentation

Si vous voulez que j'implémente le sélecteur d'organisation, je peux :
1. Modifier `getTrainerContext()` pour retourner toutes les organisations d'un formateur
2. Ajouter un sélecteur dans `TrainerDashboard`
3. Filtrer les sessions selon l'organisation sélectionnée
4. Sauvegarder la sélection dans le localStorage

Souhaitez-vous que j'implémente cette fonctionnalité ?

