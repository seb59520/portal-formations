/**
 * Script de test pour valider l'import d'un cours JSON
 * Usage: npx tsx test-course-import.ts
 */

// Structure du cours à tester
const courseJson = {
  "title": "Intelligence artificielle appliquée aux systèmes d'information de l'entreprise",
  "description": "Cette formation vise à acquérir une compréhension approfondie des concepts et applications de l'Intelligence Artificielle dans les systèmes d'information des entreprises, en mettant l'accent sur les impacts organisationnels, stratégiques et métiers.",
  "status": "published",
  "access_type": "paid",
  "theme": {
    "primaryColor": "#2563EB",
    "secondaryColor": "#7C3AED",
    "fontFamily": "Inter"
  },
  "modules": [
    {
      "title": "Jour 1 – Concepts fondamentaux et impacts stratégiques",
      "position": 1,
      "items": [
        {
          "type": "slide",
          "title": "Introduction au Big Data, à la Data Science et au Machine Learning",
          "position": 1,
          "published": true,
          "content": {
            "summary": "Présentation des concepts clés, définitions, interconnexions et panorama des usages en entreprise."
          },
          "chapters": [
            {
              "title": "Big Data : définitions et caractéristiques",
              "position": 1,
              "content": {
                "text": "Les 5V du Big Data, typologies de données, sources internes et externes."
              }
            },
            {
              "title": "Data Science : rôle et positionnement",
              "position": 2,
              "content": {
                "text": "Cycle de vie de la donnée, rôle du data scientist, interactions avec les métiers."
              }
            },
            {
              "title": "Machine Learning : principes généraux",
              "position": 3,
              "content": {
                "text": "Apprentissage supervisé, non supervisé, cas d'usage génériques."
              }
            }
          ]
        },
        {
          "type": "exercise",
          "title": "Travaux pratiques – Identifier les impacts métiers du Big Data",
          "position": 2,
          "published": true,
          "content": {
            "instruction": "À partir d'un contexte métier donné, identifier où la donnée est produite, exploitée et valorisée."
          }
        },
        {
          "type": "slide",
          "title": "Enjeux des données dans les nouveaux business models",
          "position": 3,
          "published": true,
          "content": {
            "summary": "Analyse du rôle stratégique de la donnée dans l'économie numérique."
          },
          "chapters": [
            {
              "title": "La donnée comme actif stratégique",
              "position": 1,
              "content": {
                "text": "Monétisation des données, plateformes data-driven, effets de réseau."
              }
            },
            {
              "title": "Opportunités et risques",
              "position": 2,
              "content": {
                "text": "Avantages concurrentiels, dépendance aux données, enjeux éthiques."
              }
            }
          ]
        },
        {
          "type": "case",
          "title": "Étude de cas – Modèles économiques basés sur la donnée",
          "position": 4,
          "published": true,
          "content": {
            "instruction": "Analyse comparative de plusieurs entreprises dont le modèle repose sur l'exploitation des données."
          }
        },
        {
          "type": "slide",
          "title": "Rôle de la Data Science et gouvernance des informations",
          "position": 5,
          "published": true,
          "content": {
            "summary": "Comprendre l'organisation, la sécurité et la valorisation des données."
          },
          "chapters": [
            {
              "title": "Gouvernance des données",
              "position": 1,
              "content": {
                "text": "Qualité des données, responsabilités, politiques de gouvernance."
              }
            },
            {
              "title": "Sécurité et conformité",
              "position": 2,
              "content": {
                "text": "RGPD, protection des données, maîtrise des accès."
              }
            }
          ]
        },
        {
          "type": "exercise",
          "title": "Discussion guidée – Bonnes pratiques de gouvernance",
          "position": 6,
          "published": true,
          "content": {
            "instruction": "Identifier les bonnes pratiques et axes d'amélioration de la gouvernance des données dans son organisation."
          }
        }
      ]
    },
    {
      "title": "Jour 2 – Applications pratiques et perspectives organisationnelles",
      "position": 2,
      "items": [
        {
          "type": "slide",
          "title": "Machine Learning et Deep Learning : concepts et applications",
          "position": 1,
          "published": true,
          "content": {
            "summary": "Découverte des principaux algorithmes et technologies."
          },
          "chapters": [
            {
              "title": "Principes du Machine Learning",
              "position": 1,
              "content": {
                "text": "Régression, classification, clustering, évaluation des modèles."
              }
            },
            {
              "title": "Introduction au Deep Learning",
              "position": 2,
              "content": {
                "text": "Réseaux de neurones, cas d'usage avancés (vision, langage)."
              }
            }
          ]
        },
        {
          "type": "tp",
          "title": "Applications pratiques – Prédictions et recommandations",
          "position": 2,
          "published": true,
          "content": {
            "instruction": "Comprendre comment les modèles de ML sont utilisés pour la prédiction, la recommandation et la personnalisation."
          }
        },
        {
          "type": "case",
          "title": "Études de cas – Intégration du Machine Learning dans un SI",
          "position": 3,
          "published": true,
          "content": {
            "instruction": "Analyse de cas concrets d'intégration du ML dans les systèmes d'information."
          }
        },
        {
          "type": "slide",
          "title": "Ouverture des systèmes d'information vers l'extérieur",
          "position": 4,
          "published": true,
          "content": {
            "summary": "Collecte et partage de données : enjeux stratégiques et technologiques."
          },
          "chapters": [
            {
              "title": "Ouverture du SI et interopérabilité",
              "position": 1,
              "content": {
                "text": "APIs, plateformes, écosystèmes partenaires."
              }
            },
            {
              "title": "Sécurité et conformité des données",
              "position": 2,
              "content": {
                "text": "Gestion des risques, conformité réglementaire, contrôle des flux."
              }
            }
          ]
        },
        {
          "type": "tp",
          "title": "Travaux dirigés – Élaborer une stratégie d'ouverture du SI",
          "position": 5,
          "published": true,
          "content": {
            "instruction": "Construire une stratégie d'ouverture du SI en intégrant des outils et usages basés sur l'IA."
          }
        }
      ]
    }
  ]
}

// Types de validation (similaire à AdminCourseEditJson.tsx)
type ValidItemType = 'resource' | 'slide' | 'exercise' | 'tp' | 'game'
type CourseStatus = 'draft' | 'published'
type AccessType = 'free' | 'paid' | 'invite'

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  stats: {
    modules: number
    items: number
    chapters: number
    itemsByType: Record<string, number>
  }
}

// Fonction de validation des types d'items (identique à AdminCourseEditJson.tsx)
function validateItemType(type: string | undefined | null): ValidItemType | null {
  if (!type) {
    return null
  }
  
  const normalizedType = type.toLowerCase().trim()
  
  const typeMap: Record<string, ValidItemType> = {
    'resource': 'resource',
    'slide': 'slide',
    'slides': 'slide',
    'exercise': 'exercise',
    'exercice': 'exercise',
    'exercises': 'exercise',
    'case': 'exercise', // Étude de cas → exercice
    'case-study': 'exercise',
    'case study': 'exercise',
    'étude de cas': 'exercise',
    'etude de cas': 'exercise',
    'tp': 'tp',
    'travaux-pratiques': 'tp',
    'travaux pratiques': 'tp',
    'game': 'game',
    'jeu': 'game',
    'games': 'game',
    'jeux': 'game'
  }
  
  return typeMap[normalizedType] || null
}

// Fonction de validation complète
function validateCourseJson(json: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const stats = {
    modules: 0,
    items: 0,
    chapters: 0,
    itemsByType: {} as Record<string, number>
  }

  // Validation du niveau cours
  if (!json.title || typeof json.title !== 'string') {
    errors.push('Le champ "title" est requis et doit être une chaîne de caractères')
  }

  if (!json.description || typeof json.description !== 'string') {
    errors.push('Le champ "description" est requis et doit être une chaîne de caractères')
  }

  if (!json.status || !['draft', 'published'].includes(json.status)) {
    errors.push('Le champ "status" doit être "draft" ou "published"')
  }

  if (!json.access_type || !['free', 'paid', 'invite'].includes(json.access_type)) {
    errors.push('Le champ "access_type" doit être "free", "paid" ou "invite"')
  }

  if (json.access_type === 'paid' && !json.price_cents) {
    warnings.push('Le cours est payant mais "price_cents" n\'est pas défini')
  }

  // Validation des modules
  if (!Array.isArray(json.modules)) {
    errors.push('Le champ "modules" doit être un tableau')
    return { valid: false, errors, warnings, stats }
  }

  stats.modules = json.modules.length

  if (json.modules.length === 0) {
    warnings.push('Aucun module défini dans le cours')
  }

  json.modules.forEach((module: any, moduleIndex: number) => {
    if (!module.title || typeof module.title !== 'string') {
      errors.push(`Module ${moduleIndex + 1}: le champ "title" est requis`)
    }

    if (typeof module.position !== 'number') {
      errors.push(`Module ${moduleIndex + 1}: le champ "position" doit être un nombre`)
    }

    // Validation des items
    if (!Array.isArray(module.items)) {
      errors.push(`Module ${moduleIndex + 1}: le champ "items" doit être un tableau`)
      return
    }

    module.items.forEach((item: any, itemIndex: number) => {
      stats.items++

      if (!item.type) {
        errors.push(`Module ${moduleIndex + 1}, Item ${itemIndex + 1}: le type est requis`)
        return
      }

      const validatedType = validateItemType(item.type)
      if (!validatedType) {
        errors.push(`Module ${moduleIndex + 1}, Item ${itemIndex + 1}: type invalide "${item.type}". Types autorisés: resource, slide, exercise, tp, game`)
        return
      }

      // Compter les types
      stats.itemsByType[validatedType] = (stats.itemsByType[validatedType] || 0) + 1

      // Avertissement si le type a été converti
      if (item.type.toLowerCase() !== validatedType) {
        warnings.push(`Module ${moduleIndex + 1}, Item "${item.title}": type "${item.type}" converti en "${validatedType}"`)
      }

      if (!item.title || typeof item.title !== 'string') {
        errors.push(`Module ${moduleIndex + 1}, Item ${itemIndex + 1}: le champ "title" est requis`)
      }

      if (typeof item.position !== 'number') {
        errors.push(`Module ${moduleIndex + 1}, Item ${itemIndex + 1}: le champ "position" doit être un nombre`)
      }

      if (!item.content || typeof item.content !== 'object') {
        errors.push(`Module ${moduleIndex + 1}, Item ${itemIndex + 1}: le champ "content" est requis et doit être un objet`)
      }

      // Validation des chapitres
      if (item.chapters && Array.isArray(item.chapters)) {
        item.chapters.forEach((chapter: any, chapterIndex: number) => {
          stats.chapters++

          if (!chapter.title || typeof chapter.title !== 'string') {
            errors.push(`Module ${moduleIndex + 1}, Item "${item.title}", Chapitre ${chapterIndex + 1}: le champ "title" est requis`)
          }

          if (typeof chapter.position !== 'number') {
            errors.push(`Module ${moduleIndex + 1}, Item "${item.title}", Chapitre ${chapterIndex + 1}: le champ "position" doit être un nombre`)
          }
        })
      }
    })
  })

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats
  }
}

// Exécution du test
console.log('🧪 Test de validation du cours JSON\n')
console.log('=' .repeat(60))

const result = validateCourseJson(courseJson)

console.log('\n📊 Statistiques:')
console.log(`  - Modules: ${result.stats.modules}`)
console.log(`  - Items: ${result.stats.items}`)
console.log(`  - Chapitres: ${result.stats.chapters}`)
console.log('\n  Items par type:')
Object.entries(result.stats.itemsByType).forEach(([type, count]) => {
  console.log(`    - ${type}: ${count}`)
})

if (result.warnings.length > 0) {
  console.log('\n⚠️  Avertissements:')
  result.warnings.forEach(warning => {
    console.log(`  - ${warning}`)
  })
}

if (result.errors.length > 0) {
  console.log('\n❌ Erreurs:')
  result.errors.forEach(error => {
    console.log(`  - ${error}`)
  })
  console.log('\n❌ Le JSON n\'est PAS valide')
  process.exit(1)
} else {
  console.log('\n✅ Le JSON est valide et peut être importé dans l\'application!')
  console.log('\n📝 Résumé:')
  console.log(`  - Titre: ${courseJson.title}`)
  console.log(`  - Statut: ${courseJson.status}`)
  console.log(`  - Type d'accès: ${courseJson.access_type}`)
  console.log(`  - Modules: ${result.stats.modules}`)
  console.log(`  - Items totaux: ${result.stats.items}`)
  console.log(`  - Chapitres totaux: ${result.stats.chapters}`)
  
  if (result.warnings.length > 0) {
    console.log(`\n⚠️  ${result.warnings.length} avertissement(s) - voir ci-dessus`)
  }
  
  console.log('\n✅ Prêt pour l\'import via /admin/courses/new/json')
  process.exit(0)
}

