# Guide : Comment renseigner la correction d'un exercice

Ce document explique où et sous quel format renseigner la correction d'un exercice dans votre JSON de cours.

## 📍 Emplacement de la correction

La correction se trouve dans le champ `content.correction` d'un item de type `"exercise"` ou `"tp"`.

### Structure de base

```json
{
  "type": "exercise",
  "title": "Titre de l'exercice",
  "position": 0,
  "published": true,
  "content": {
    "question": "...",
    "correction": "..."  // ← ICI
  }
}
```

## 📝 Formats acceptés

La correction accepte **deux formats** :

### Format 1 : String simple (texte brut)

Le format le plus simple pour une correction en texte brut.

```json
{
  "type": "exercise",
  "title": "Exercice – Les bases de l'API REST",
  "position": 1,
  "published": true,
  "content": {
    "question": "Qu'est-ce qu'une API REST ?",
    "correction": "REST (Representational State Transfer) est un style architectural pour les services web basé sur HTTP. Il utilise les méthodes HTTP standard (GET, POST, PUT, DELETE) et des ressources identifiées par des URLs."
  }
}
```

**Avantages** :
- ✅ Simple à écrire
- ✅ Facile à lire dans le JSON
- ✅ Parfait pour les corrections courtes

**Limitations** :
- ❌ Pas de formatage (gras, italique, listes)
- ❌ Pas de structure complexe

---

### Format 2 : TipTap JSON (contenu riche)

Le format TipTap permet d'avoir du contenu riche avec formatage, listes, titres, etc.

```json
{
  "type": "exercise",
  "title": "Exercice – Analyser une API REST",
  "position": 2,
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
              "text": "Analysez cette API et identifiez ses caractéristiques."
            }
          ]
        }
      ]
    },
    "correction": {
      "type": "doc",
      "content": [
        {
          "type": "heading",
          "attrs": { "level": 2 },
          "content": [
            {
              "type": "text",
              "text": "Correction"
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Cette API présente les caractéristiques suivantes :"
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
                      "marks": [
                        {
                          "type": "bold"
                        }
                      ],
                      "text": "Style architectural : "
                    },
                    {
                      "type": "text",
                      "text": "REST"
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "marks": [
                        {
                          "type": "bold"
                        }
                      ],
                      "text": "Méthodes HTTP : "
                    },
                    {
                      "type": "text",
                      "text": "GET, POST, PUT, DELETE"
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Cette API respecte les principes REST en utilisant les verbes HTTP appropriés pour chaque action."
            }
          ]
        }
      ]
    }
  }
}
```

**Avantages** :
- ✅ Formatage riche (gras, italique, listes, titres)
- ✅ Structure complexe possible
- ✅ Cohérent avec le format utilisé pour les slides et chapitres

**Limitations** :
- ❌ Plus verbeux
- ❌ Plus complexe à écrire manuellement

---

## 🎯 Exemples complets par type d'exercice

### Exercice simple (question/correction)

```json
{
  "type": "exercise",
  "title": "Exercice – Concepts fondamentaux",
  "position": 1,
  "published": true,
  "content": {
    "question": "Expliquez la différence entre REST et GraphQL.",
    "correction": "REST utilise plusieurs endpoints avec des méthodes HTTP standard, tandis que GraphQL utilise un seul endpoint avec des requêtes flexibles permettant de récupérer exactement les données nécessaires."
  }
}
```

### Exercice enrichi (avec objectif, critères, etc.)

```json
{
  "type": "exercise",
  "title": "Exercice – Identifier les usages IA dans son SI",
  "position": 2,
  "published": true,
  "content": {
    "objective": "Identifier où et comment les données et l'IA peuvent être exploitées dans un système d'information existant.",
    "duration_minutes": 30,
    "instruction": "À partir de ton contexte professionnel, liste les sources de données disponibles.",
    "criteria": [
      "Identification claire des sources de données",
      "Lien cohérent entre données et usages métiers"
    ],
    "deliverables": [
      "Carte simplifiée du SI",
      "Liste de 3 cas d'usage IA potentiels"
    ],
    "correction": {
      "type": "doc",
      "content": [
        {
          "type": "heading",
          "attrs": { "level": 2 },
          "content": [
            {
              "type": "text",
              "text": "Correction attendue"
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "Voici les éléments attendus dans une bonne réponse :"
            }
          ]
        },
        {
          "type": "orderedList",
          "attrs": { "start": 1 },
          "content": [
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Identification des sources de données (bases de données, fichiers, APIs externes)"
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Analyse des usages métiers actuels et potentiels"
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "text": "Proposition de cas d'usage IA réalistes et pertinents"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  }
}
```

### Exercice d'analyse d'API

```json
{
  "type": "exercise",
  "title": "Étude de cas – Analyse d'un business model data-driven",
  "position": 3,
  "published": true,
  "content": {
    "objective": "Analyser l'impact stratégique de la donnée sur un modèle économique.",
    "duration_minutes": 45,
    "instruction": "Analyse un cas d'entreprise utilisant massivement les données.",
    "input_api": {
      "endpoints": [
        "GET /api/users",
        "POST /api/users"
      ]
    },
    "instructions": [
      "Analysez les endpoints fournis",
      "Identifiez les méthodes HTTP utilisées"
    ],
    "criteria": [
      "Compréhension du modèle économique",
      "Lien clair entre données et création de valeur"
    ],
    "correction": {
      "type": "doc",
      "content": [
        {
          "type": "heading",
          "attrs": { "level": 2 },
          "content": [
            {
              "type": "text",
              "text": "Analyse attendue"
            }
          ]
        },
        {
          "type": "paragraph",
          "content": [
            {
              "type": "text",
              "text": "L'analyse doit couvrir les points suivants :"
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
                      "marks": [
                        {
                          "type": "bold"
                        }
                      ],
                      "text": "Style architectural : "
                    },
                    {
                      "type": "text",
                      "text": "REST (utilisation des méthodes HTTP standard)"
                    }
                  ]
                }
              ]
            },
            {
              "type": "listItem",
              "content": [
                {
                  "type": "paragraph",
                  "content": [
                    {
                      "type": "text",
                      "marks": [
                        {
                          "type": "bold"
                        }
                      ],
                      "text": "Points forts : "
                    },
                    {
                      "type": "text",
                      "text": "Simplicité, stateless, cacheable"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  }
}
```

---

## ✅ Checklist de validation

Pour qu'une correction soit correctement renseignée :

- [ ] Le champ `correction` est dans `content.correction` (pas ailleurs)
- [ ] Le format est soit :
  - Une string simple (texte brut)
  - Un objet TipTap JSON valide
- [ ] Si format TipTap : la structure commence par `{ "type": "doc", "content": [...] }`
- [ ] La correction est optionnelle mais recommandée pour les exercices notés

---

## 🔍 Comment l'application détecte le format

L'application détecte automatiquement le format :

```typescript
// Si c'est un objet → Format TipTap
if (typeof content.correction === 'object') {
  // Affiche avec RichTextEditor (formatage riche)
  <RichTextEditor content={content.correction} />
} else {
  // Sinon → String simple
  // Affiche en texte brut
  <p>{content.correction}</p>
}
```

---

## 📚 Où renseigner la correction

### Option 1 : Dans le JSON de cours (import)

Lors de l'import d'un cours JSON, la correction doit être dans `content.correction` :

```json
{
  "modules": [
    {
      "items": [
        {
          "type": "exercise",
          "content": {
            "correction": "Votre correction ici"
          }
        }
      ]
    }
  ]
}
```

### Option 2 : Via l'interface d'administration

1. Aller dans **Admin** → **Cours** → Sélectionner un cours
2. Cliquer sur un **exercice**
3. Dans la section **Contenu**, trouver le champ **"Correction (optionnel)"**
4. Renseigner la correction (texte brut ou utiliser l'éditeur riche si disponible)

### Option 3 : Via l'éditeur JSON d'un item

1. Aller dans **Admin** → **Cours** → Sélectionner un cours
2. Cliquer sur un **exercice**
3. Cliquer sur **"Éditer le JSON"**
4. Modifier directement le champ `correction` dans le JSON

---

## 🚨 Erreurs courantes à éviter

1. ❌ Mettre `correction` au niveau de l'item (doit être dans `content`)
   ```json
   // ❌ MAUVAIS
   {
     "type": "exercise",
     "correction": "..."
   }
   
   // ✅ BON
   {
     "type": "exercise",
     "content": {
       "correction": "..."
     }
   }
   ```

2. ❌ Format TipTap invalide (structure incorrecte)
   ```json
   // ❌ MAUVAIS
   {
     "correction": {
       "content": [...]  // Manque "type": "doc"
     }
   }
   
   // ✅ BON
   {
     "correction": {
       "type": "doc",
       "content": [...]
     }
   }
   ```

3. ❌ Mélanger les formats
   ```json
   // ❌ MAUVAIS (mélange string et objet)
   {
     "correction": "Texte" + { "type": "doc" }
   }
   ```

---

## 💡 Recommandations

- **Pour des corrections courtes** : Utilisez une string simple
- **Pour des corrections longues avec formatage** : Utilisez le format TipTap
- **Pour des corrections avec listes, titres, gras** : Utilisez le format TipTap
- **Toujours tester** : Vérifiez que la correction s'affiche correctement après import

---

## 📖 Ressources supplémentaires

- `FORMATS-JSON.md` : Documentation complète des formats JSON
- `STRUCTURE-COMPLETE-EXERCICES.md` : Structure complète des exercices
- `course-ia-si-tiptap.json` : Exemples de cours avec corrections

