# Guide : Comment ajouter un nouveau jeu

Ce guide explique comment ajouter un nouveau jeu au système de manière modulaire, sans modifier les fichiers de rendu existants.

## Architecture du système

Le système utilise un **registre de jeux** (`gameRegistry`) qui permet d'enregistrer dynamiquement des jeux. Chaque jeu est un module indépendant qui peut être ajouté facilement.

### Fichiers clés

- **`src/lib/gameRegistry.ts`** : Registre centralisé des jeux
- **`src/components/GameRenderer.tsx`** : Composant générique qui rend n'importe quel jeu enregistré
- **`src/components/ChapterViewer.tsx`** : Utilise `GameRenderer` pour afficher les jeux dans les chapitres

## Étapes pour ajouter un nouveau jeu

### 1. Créer le composant du jeu

Créez un nouveau fichier dans `src/components/` avec votre composant de jeu.

**Exemple : `src/components/MonNouveauJeu.tsx`**

```typescript
import { useState } from 'react'
import { BaseGameProps } from '../lib/gameRegistry'

// Interface pour les props spécifiques à votre jeu
interface MonNouveauJeuProps extends BaseGameProps {
  questions?: Array<{
    id: string
    question: string
    options: string[]
    correctAnswer: string
  }>
  // Ajoutez d'autres props spécifiques à votre jeu
}

export function MonNouveauJeu({ 
  questions = [], 
  onScore, 
  description 
}: MonNouveauJeuProps) {
  const [score, setScore] = useState(0)
  
  // Votre logique de jeu ici
  
  const handleAnswer = (questionId: string, answer: string) => {
    // Logique de validation
    const question = questions.find(q => q.id === questionId)
    if (question && question.correctAnswer === answer) {
      setScore(prev => prev + 1)
    }
    
    // Appeler onScore quand le jeu est terminé
    if (onScore) {
      onScore(score, { /* metadata */ })
    }
  }
  
  return (
    <div className="space-y-6">
      {description && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">{description}</p>
        </div>
      )}
      
      {/* Votre interface de jeu */}
      <div>
        {questions.map(question => (
          <div key={question.id} className="mb-4">
            <p className="font-semibold mb-2">{question.question}</p>
            <div className="space-y-2">
              {question.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(question.id, option)}
                  className="w-full text-left p-3 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 2. Enregistrer le jeu dans le registre

Ouvrez `src/lib/gameRegistry.ts` et ajoutez votre jeu :

```typescript
import { MonNouveauJeu } from '../components/MonNouveauJeu'

// ... dans la section d'enregistrement des jeux

gameRegistry.register({
  gameType: 'mon-nouveau-jeu', // Type unique (utilisé dans game_content.gameType)
  name: 'Mon Nouveau Jeu',
  description: 'Description de votre jeu',
  component: MonNouveauJeu,
  validateConfig: (config) => {
    // Fonction optionnelle pour valider la configuration
    return (
      Array.isArray(config.questions) &&
      config.questions.length > 0 &&
      config.questions.every(q => 
        q.id && 
        q.question && 
        Array.isArray(q.options) && 
        q.correctAnswer
      )
    )
  }
})
```

### 3. Créer un exemple de configuration JSON

Créez un fichier d'exemple pour documenter le format attendu dans `game_content` :

**Exemple : `exemples-chapitres-jeux-mon-nouveau.json`**

```json
{
  "title": "Jeu : Mon Nouveau Jeu",
  "position": 0,
  "type": "game",
  "game_content": {
    "gameType": "mon-nouveau-jeu",
    "description": "Apprenez les concepts de base",
    "instructions": "Répondez aux questions pour progresser",
    "questions": [
      {
        "id": "q1",
        "question": "Quelle est la capitale de la France ?",
        "options": ["Paris", "Lyon", "Marseille", "Toulouse"],
        "correctAnswer": "Paris"
      },
      {
        "id": "q2",
        "question": "Quel est le langage de programmation le plus utilisé ?",
        "options": ["JavaScript", "Python", "Java", "C++"],
        "correctAnswer": "JavaScript"
      }
    ]
  }
}
```

### 4. Utiliser le jeu dans un chapitre

Dans la base de données Supabase, créez un chapitre avec :

- `type` = `'game'`
- `game_content` = l'objet JSON (sans `type`, `title`, `position` qui sont dans les autres colonnes)

**Format dans la colonne `game_content` :**

```json
{
  "gameType": "mon-nouveau-jeu",
  "description": "Apprenez les concepts de base",
  "instructions": "Répondez aux questions pour progresser",
  "questions": [
    {
      "id": "q1",
      "question": "Quelle est la capitale de la France ?",
      "options": ["Paris", "Lyon", "Marseille", "Toulouse"],
      "correctAnswer": "Paris"
    }
  ]
}
```

## Structure des props communes

Tous les jeux reçoivent automatiquement ces props via `BaseGameProps` :

- **`onScore?: (score: number, metadata?: any) => void`** : Callback appelé quand le score est calculé
- **`description?: string`** : Description du jeu (affichée en haut)
- **`instructions?: string`** : Instructions pour jouer

## Validation de la configuration

Si vous fournissez une fonction `validateConfig`, elle sera appelée automatiquement pour vérifier que la configuration est valide avant de rendre le jeu.

```typescript
validateConfig: (config) => {
  // Retourne true si la config est valide, false sinon
  return Array.isArray(config.questions) && config.questions.length > 0
}
```

Si la validation échoue, un message d'erreur sera affiché automatiquement.

## Exemple complet : Jeu "Quel type d'API utiliser ?"

Le jeu `ApiTypesGame` est un bon exemple à suivre :

1. **Composant** : `src/components/ApiTypesGame.tsx`
2. **Enregistrement** : Dans `src/lib/gameRegistry.ts` :
   ```typescript
   gameRegistry.register({
     gameType: 'api-types',
     name: 'Quel type d\'API utiliser ?',
     description: 'Choisissez le type d\'API approprié pour chaque scénario',
     component: ApiTypesGame,
     validateConfig: (config) => {
       return (
         Array.isArray(config.apiTypes) &&
         Array.isArray(config.scenarios) &&
         config.apiTypes.length > 0 &&
         config.scenarios.length > 0
       )
     }
   })
   ```
3. **Format JSON** : Voir `GUIDE-FORMAT-JEU-CHAPITRE.md` section "API Types"

## Avantages de ce système

✅ **Modulaire** : Chaque jeu est indépendant  
✅ **Extensible** : Ajoutez de nouveaux jeux sans modifier les fichiers existants  
✅ **Type-safe** : TypeScript garantit la cohérence des types  
✅ **Validation automatique** : Les configurations invalides sont détectées  
✅ **Réutilisable** : Le même système fonctionne dans `ChapterViewer`, `ReactRenderer`, etc.

## Dépannage

### Le jeu ne s'affiche pas

1. Vérifiez que le jeu est bien enregistré dans `gameRegistry.ts`
2. Vérifiez que `gameType` dans `game_content` correspond exactement au `gameType` dans le registre
3. Vérifiez la console pour les erreurs de validation

### Erreur de validation

Si vous voyez "Configuration invalide", vérifiez :
- Que tous les champs requis sont présents
- Que les types de données sont corrects (tableaux, objets, etc.)
- Que votre fonction `validateConfig` retourne `true` pour une config valide

### Le composant ne reçoit pas les bonnes props

Vérifiez que :
- Les props spécifiques à votre jeu sont bien dans `game_content`
- Vous avez bien étendu `BaseGameProps` dans votre interface
- Les noms des props correspondent exactement aux clés dans `game_content`

## Prochaines étapes

Une fois votre jeu créé et enregistré :

1. Testez-le dans un chapitre
2. Documentez le format JSON attendu
3. Ajoutez des exemples dans la documentation
4. Partagez avec l'équipe !

