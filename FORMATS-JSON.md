# Formats JSON - Documentation

Ce document décrit les formats JSON attendus pour chaque entité du système.

## 1. Format JSON d'un Chapitre

Le format JSON d'un chapitre est le plus simple et le plus modulaire. Un chapitre peut être de type "content" (contenu normal) ou "game" (jeu interactif).

### Chapitre de type "content" (par défaut)

```json
{
  "title": "Titre du chapitre",
  "position": 0,
  "type": "content",
  "content": {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "Contenu du chapitre en format TipTap JSON."
          }
        ]
      }
    ]
  }
}
```

### Chapitre de type "game"

```json
{
  "title": "Jeu : Associer les termes",
  "position": 1,
  "type": "game",
  "game_content": {
    "gameType": "matching",
    "pairs": [
      { "term": "REST", "definition": "Architecture stateless avec ressources HTTP" },
      { "term": "GraphQL", "definition": "Requêtes flexibles avec un seul endpoint" }
    ]
  }
}
```

### Champs

- **title** (string, requis) : Titre du chapitre
- **position** (number, requis) : Position du chapitre dans la liste (0-indexed)
- **type** (string, optionnel) : Type de chapitre - `"content"` (par défaut) ou `"game"`
- **content** (object, optionnel) : Contenu au format TipTap JSON. Utilisé uniquement si `type === "content"`. Peut être `null` si le chapitre n'a pas encore de contenu.
- **game_content** (object, optionnel) : Contenu du jeu. Utilisé uniquement si `type === "game"`. Structure dépend du `gameType` :
  - `matching` : `{ gameType: "matching", pairs: Array<{term: string, definition: string}> }`
  - `column-matching` : `{ gameType: "column-matching", leftColumn: string[], rightColumn: string[], correctMatches: Array<{left: number, right: number}> }`
  - `api-types` : `{ gameType: "api-types", apiTypes: any[], scenarios: any[] }`
  - `format-files` : `{ gameType: "format-files", levels: Array<{level: number, name: string, questions: any[]}> }`

### Exemple minimal (chapitre de contenu)

```json
{
  "title": "Introduction aux APIs",
  "position": 0,
  "content": null
}
```

### Exemple minimal (chapitre de jeu)

```json
{
  "title": "Jeu : Types d'API",
  "position": 1,
  "type": "game",
  "game_content": {
    "gameType": "matching",
    "pairs": []
  }
}
```

---

## 2. Format JSON d'un Item

Un item peut contenir des chapitres, mais ceux-ci peuvent aussi être édités séparément.

```json
{
  "type": "resource",
  "title": "Titre de l'élément",
  "position": 0,
  "published": true,
  "content": {
    "body": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Contenu principal de l'élément..."
            }
          ]
        }
      ]
    }
  },
  "chapters": [
    {
      "title": "Chapitre 1",
      "position": 0,
      "content": {
        "type": "doc",
        "content": [
          {
            "type": "paragraph",
            "content": [
              {
                "type": "text",
                "text": "Contenu du chapitre..."
              }
            ]
          }
        ]
      }
    }
  ],
  "asset_path": "chemin/vers/fichier.pdf",
  "external_url": "https://example.com",
  "theme": {
    "primaryColor": "#3B82F6",
    "secondaryColor": "#8B5CF6",
    "fontFamily": "Inter"
  }
}
```

### Types d'items

#### 1. Resource (`type: "resource"`)

```json
{
  "type": "resource",
  "title": "Documentation API",
  "position": 0,
  "published": true,
  "content": {
    "description": "Description de la ressource",
    "body": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Contenu de la ressource..."
            }
          ]
        }
      ]
    }
  },
  "asset_path": "modules/module-id/item-id/document.pdf",
  "external_url": "https://example.com"
}
```

#### 2. Slide (`type: "slide"`)

```json
{
  "type": "slide",
  "title": "Support de cours",
  "position": 0,
  "published": true,
  "content": {
    "body": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Contenu du support..."
            }
          ]
        }
      ]
    }
  }
}
```

#### 3. Exercise (`type: "exercise"`)

```json
{
  "type": "exercise",
  "title": "Exercice pratique",
  "position": 0,
  "published": true,
  "content": {
    "question": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Question de l'exercice..."
            }
          ]
        }
      ]
    },
    "correction": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Correction de l'exercice..."
            }
          ]
        }
      ]
    }
  }
}
```

#### 4. TP (`type: "tp"`)

```json
{
  "type": "tp",
  "title": "Travaux pratiques",
  "position": 0,
  "published": true,
  "content": {
    "instructions": {
      "type": "doc",
      "content": [
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Instructions du TP..."
            }
          ]
        }
      ]
    },
    "checklist": [
      "Tâche 1 à réaliser",
      "Tâche 2 à réaliser",
      "Tâche 3 à réaliser"
    ]
  }
}
```

#### 5. Game (`type: "game"`)

##### Matching Game

```json
{
  "type": "game",
  "title": "Jeu de correspondance",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "matching",
    "description": "Description du jeu",
    "instructions": "Instructions pour jouer",
    "pairs": [
      {
        "term": "Terme 1",
        "definition": "Définition 1"
      },
      {
        "term": "Terme 2",
        "definition": "Définition 2"
      }
    ]
  }
}
```

##### Column Matching Game

```json
{
  "type": "game",
  "title": "Jeu de correspondance par colonnes",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "column-matching",
    "description": "Description du jeu",
    "instructions": "Instructions pour jouer",
    "leftColumn": [
      "Élément gauche 1",
      "Élément gauche 2",
      "Élément gauche 3"
    ],
    "rightColumn": [
      "Élément droit 1",
      "Élément droit 2",
      "Élément droit 3"
    ],
    "correctMatches": [
      {
        "left": 0,
        "right": 0
      },
      {
        "left": 1,
        "right": 1
      },
      {
        "left": 2,
        "right": 2
      }
    ]
  }
}
```

##### API Types Game

```json
{
  "type": "game",
  "title": "Jeu des types d'API",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "api-types",
    "description": "Description du jeu",
    "instructions": "Instructions pour jouer",
    "apiTypes": [
      {
        "name": "REST",
        "description": "Representational State Transfer",
        "characteristics": ["Stateless", "Cacheable", "Uniform Interface"]
      },
      {
        "name": "GraphQL",
        "description": "Query Language for APIs",
        "characteristics": ["Single Endpoint", "Flexible Queries", "Strongly Typed"]
      }
    ],
    "scenarios": [
      {
        "description": "Scénario 1",
        "correctType": "REST"
      }
    ]
  }
}
```

##### Format Files Game (JSON / XML / Protobuf)

```json
{
  "type": "game",
  "title": "Jeu : Formats de fichiers",
  "position": 0,
  "published": true,
  "content": {
    "gameType": "format-files",
    "description": "Apprenez à reconnaître et utiliser les formats JSON, XML et Protobuf",
    "instructions": "Répondez aux questions pour progresser dans les 3 niveaux de difficulté",
    "levels": [
      {
        "level": 1,
        "name": "Découverte",
        "questions": [
          {
            "id": "q1-1",
            "type": "identify-format",
            "prompt": "Quel est ce format de données ?",
            "snippet": "{\n  \"name\": \"John\",\n  \"age\": 30\n}",
            "options": ["JSON", "XML", "Protobuf"],
            "answer": "JSON",
            "explanation": "C'est du JSON car il utilise des accolades {} et des paires clé-valeur avec des guillemets.",
            "difficulty": 1
          },
          {
            "id": "q1-2",
            "type": "json-valid",
            "prompt": "Ce JSON est-il valide ?",
            "snippet": "{\"name\": \"John\", \"age\": 30}",
            "answer": true,
            "explanation": "Oui, c'est un JSON valide avec une syntaxe correcte.",
            "difficulty": 1
          }
        ]
      },
      {
        "level": 2,
        "name": "Intermédiaire",
        "questions": [
          {
            "id": "q2-1",
            "type": "fix-json-mcq",
            "prompt": "Quelle est l'erreur dans ce JSON ?",
            "snippet": "{\n  \"name\": \"John\",\n  age: 30\n}",
            "options": [
              "Manque des guillemets autour de \"age\"",
              "Manque une virgule",
              "Manque une accolade fermante"
            ],
            "answer": "Manque des guillemets autour de \"age\"",
            "explanation": "En JSON, toutes les clés doivent être entre guillemets doubles.",
            "difficulty": 2
          }
        ]
      },
      {
        "level": 3,
        "name": "Avancé",
        "questions": [
          {
            "id": "q3-1",
            "type": "choose-format",
            "prompt": "Quel format choisiriez-vous pour une API microservices haute performance ?",
            "options": ["JSON", "XML", "Protobuf"],
            "answer": "Protobuf",
            "explanation": "Protobuf est binaire et optimisé pour la performance, idéal pour les microservices.",
            "difficulty": 3
          }
        ]
      }
    ]
  }
}
```

**Types de questions supportés :**
- `identify-format` : Identifier le format (JSON, XML, Protobuf)
- `json-valid` : Déterminer si un JSON est valide (réponse booléenne)
- `fix-json-mcq` : Corriger une erreur JSON (QCM)
- `fix-json-editor` : Corriger un JSON dans un éditeur (réponse texte)
- `choose-format` : Choisir le format selon un cas d'usage

### Champs communs aux items

- **type** (string, requis) : Type d'item (`"resource"`, `"slide"`, `"exercise"`, `"tp"`, `"game"`)
- **title** (string, requis) : Titre de l'élément
- **position** (number, requis) : Position dans le module (0-indexed)
- **published** (boolean, optionnel) : Si l'élément est publié (défaut: `true`)
- **content** (object, requis) : Contenu selon le type (voir exemples ci-dessus)
- **chapters** (array, optionnel) : Liste des chapitres (peuvent être édités séparément)
- **asset_path** (string, optionnel) : Chemin vers un fichier (PDF, etc.)
- **external_url** (string, optionnel) : URL externe
- **theme** (object, optionnel) : Thème personnalisé
  - `primaryColor` (string) : Couleur principale (hex)
  - `secondaryColor` (string) : Couleur secondaire (hex)
  - `fontFamily` (string) : Police de caractères

---

## 3. Format JSON d'un Cours

Le format JSON d'un cours contient tous les modules et leurs items.

```json
{
  "title": "Titre du cours",
  "description": "Description du cours",
  "status": "published",
  "access_type": "free",
  "price_cents": 0,
  "currency": "EUR",
  "theme": {
    "primaryColor": "#3B82F6",
    "secondaryColor": "#8B5CF6",
    "fontFamily": "Inter"
  },
  "modules": [
    {
      "title": "Module 1",
      "position": 0,
      "theme": {
        "primaryColor": "#10B981",
        "secondaryColor": "#059669",
        "fontFamily": "Inter"
      },
      "items": [
        {
          "id": "item-id-1",
          "type": "resource",
          "title": "Ressource 1",
          "position": 0,
          "published": true,
          "content": {},
          "chapters": [
            {
              "title": "Chapitre 1",
              "position": 0,
              "content": {
                "type": "doc",
                "content": [
                  {
                    "type": "paragraph",
                    "content": [
                      {
                        "type": "text",
                        "text": "Contenu..."
                      }
                    ]
                  }
                ]
              }
            }
          ]
        }
      ]
    }
  ]
}
```

### Champs du cours

- **title** (string, requis) : Titre du cours
- **description** (string, requis) : Description du cours
- **status** (string, requis) : Statut (`"draft"` ou `"published"`)
- **access_type** (string, requis) : Type d'accès (`"free"`, `"paid"`, `"invite"`)
- **price_cents** (number, optionnel) : Prix en centimes (si `access_type: "paid"`)
- **currency** (string, optionnel) : Devise (ex: `"EUR"`, `"USD"`)
- **theme** (object, optionnel) : Thème du cours
- **modules** (array, requis) : Liste des modules

### Champs d'un module

- **title** (string, requis) : Titre du module
- **position** (number, requis) : Position dans le cours (0-indexed)
- **theme** (object, optionnel) : Thème du module (hérite du thème du cours si non défini)
- **items** (array, requis) : Liste des items du module

### Champs d'un item dans un cours

Les items dans un cours ont les mêmes champs que les items indépendants, avec en plus :
- **id** (string, optionnel) : ID de l'item (pour les liens dans la sidebar)

---

## Format TipTap JSON

Le contenu des chapitres et des items utilise le format TipTap JSON. Voici un exemple de base :

```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "Texte simple"
        }
      ]
    },
    {
      "type": "heading",
      "attrs": {
        "level": 1
      },
      "content": [
        {
          "type": "text",
          "text": "Titre de niveau 1"
        }
      ]
    },
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [
                {
                  "type": "text",
                  "text": "Premier élément de liste"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### Types de nœuds TipTap courants

- `paragraph` : Paragraphe de texte
- `heading` : Titre (avec `attrs.level` de 1 à 6)
- `bulletList` / `orderedList` : Listes
- `listItem` : Élément de liste
- `text` : Texte simple
- `hardBreak` : Saut de ligne
- `blockquote` : Citation
- `codeBlock` : Bloc de code
- `horizontalRule` : Ligne horizontale

---

## Notes importantes

1. **Modularité** : Les chapitres peuvent être édités séparément de leur item parent pour plus de modularité.

2. **IDs** : Les IDs ne sont pas nécessaires dans le JSON (sauf pour les items dans un cours pour les liens). Ils sont générés automatiquement lors de la sauvegarde.

3. **Positions** : Les positions sont 0-indexed (commencent à 0).

4. **Contenu optionnel** : Le champ `content` peut être `null` ou un objet vide `{}` si le contenu n'est pas encore défini.

5. **Thèmes** : Les thèmes sont optionnels et héritent des valeurs par défaut si non définis.

6. **Chapitres** : Les chapitres dans un item sont optionnels. Ils peuvent être édités dans le JSON de l'item ou séparément via leur propre page JSON.

