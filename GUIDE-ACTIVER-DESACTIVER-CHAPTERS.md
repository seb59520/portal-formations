# Guide : Activer/Désactiver des chapitres

## Fonctionnalité

Vous pouvez maintenant activer ou désactiver des chapitres dans un cours pour réduire le temps de formation. Les chapitres désactivés ne sont pas visibles pour les étudiants en mode cours, mais restent visibles et modifiables en mode admin.

## Installation

### 1. Exécuter le script SQL

Dans l'interface SQL de Supabase, exécutez le script :
```sql
add-chapters-published-field.sql
```

Ce script :
- Ajoute la colonne `published` (BOOLEAN) à la table `chapters`
- Définit la valeur par défaut à `true` pour tous les chapitres existants
- Crée un index pour optimiser les requêtes filtrées

## Utilisation

### En mode Admin

1. **Accéder à l'édition d'un item** : Allez dans `/admin/items/{itemId}`
2. **Voir tous les chapitres** : Tous les chapitres sont visibles, qu'ils soient publiés ou non
3. **Activer/Désactiver un chapitre** :
   - Cliquez sur l'icône 👁️ (Eye) pour activer un chapitre (vert = publié)
   - Cliquez sur l'icône 👁️‍🗨️ (EyeOff) pour désactiver un chapitre (gris = non publié)
   - Le changement est sauvegardé automatiquement

### Indicateurs visuels

- **Chapitre publié** : Icône 👁️ verte, chapitre avec opacité normale
- **Chapitre non publié** : Icône 👁️‍🗨️ grise, chapitre avec opacité réduite (60%) et fond gris clair

### En mode Cours

- **Étudiants** : Ne voient que les chapitres publiés (`published = true`)
- **Admins** : Voient tous les chapitres (publiés et non publiés)

## Comportement technique

### Requêtes SQL

Les requêtes sont automatiquement filtrées selon le rôle de l'utilisateur :

```typescript
// Pour les étudiants
.eq('published', true)

// Pour les admins
// Pas de filtre, tous les chapitres sont visibles
```

### Sauvegarde

- Les nouveaux chapitres sont créés avec `published: true` par défaut
- Le changement de statut est sauvegardé immédiatement en base de données
- Les chapitres temporaires (non sauvegardés) peuvent aussi être activés/désactivés

## Cas d'usage

### Réduire le temps de formation

1. Identifiez les chapitres optionnels ou avancés
2. Désactivez-les en cliquant sur l'icône 👁️
3. Les étudiants ne verront plus ces chapitres dans le cours
4. Vous pouvez les réactiver à tout moment

### Créer des versions de cours

- **Version complète** : Tous les chapitres activés
- **Version rapide** : Seulement les chapitres essentiels activés
- **Version débutant** : Chapitres de base uniquement

### Tests et développement

- Créez des chapitres de test et désactivez-les
- Les chapitres restent dans la base mais ne sont pas visibles pour les étudiants
- Parfait pour tester de nouveaux contenus sans affecter les étudiants

## Notes importantes

- ⚠️ Les chapitres désactivés ne sont **pas supprimés**, ils sont juste masqués
- ✅ Les chapitres désactivés restent **modifiables en mode admin**
- ✅ L'ordre des chapitres est **préservé** même si certains sont désactivés
- ✅ Les chapitres de type "game" peuvent aussi être activés/désactivés

