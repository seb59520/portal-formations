/**
 * Script de test pour valider l'import du cours JSON unifié
 * Usage: node test-course-unifie.js
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Charger le JSON unifié
const courseJsonPath = path.join(__dirname, 'course-ia-si-unifie.json')
const courseJson = JSON.parse(fs.readFileSync(courseJsonPath, 'utf8'))

// Fonction de validation des types d'items
function validateItemType(type) {
  if (!type) {
    return null
  }
  
  const normalizedType = type.toLowerCase().trim()
  
  const typeMap = {
    'resource': 'resource',
    'slide': 'slide',
    'slides': 'slide',
    'exercise': 'exercise',
    'exercice': 'exercise',
    'exercises': 'exercise',
    'case': 'exercise',
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
function validateCourseJson(json) {
  const errors = []
  const warnings = []
  const stats = {
    modules: 0,
    items: 0,
    chapters: 0,
    itemsByType: {},
    itemsWithNewFields: {
      objective: 0,
      duration_minutes: 0,
      criteria: 0,
      deliverables: 0
    }
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

  json.modules.forEach((module, moduleIndex) => {
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

    module.items.forEach((item, itemIndex) => {
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
      } else {
        // Compter les nouveaux champs dans content
        if (item.content.objective) stats.itemsWithNewFields.objective++
        if (item.content.duration_minutes) stats.itemsWithNewFields.duration_minutes++
        if (item.content.criteria) stats.itemsWithNewFields.criteria++
        if (item.content.deliverables) stats.itemsWithNewFields.deliverables++
      }

      // Validation des chapitres
      if (item.chapters && Array.isArray(item.chapters)) {
        item.chapters.forEach((chapter, chapterIndex) => {
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
console.log('🧪 Test de validation du cours JSON unifié\n')
console.log('='.repeat(60))

const result = validateCourseJson(courseJson)

console.log('\n📊 Statistiques:')
console.log(`  - Modules: ${result.stats.modules}`)
console.log(`  - Items: ${result.stats.items}`)
console.log(`  - Chapitres: ${result.stats.chapters}`)
console.log('\n  Items par type:')
Object.entries(result.stats.itemsByType).forEach(([type, count]) => {
  console.log(`    - ${type}: ${count}`)
})

console.log('\n  Nouveaux champs dans content:')
console.log(`    - objective: ${result.stats.itemsWithNewFields.objective} items`)
console.log(`    - duration_minutes: ${result.stats.itemsWithNewFields.duration_minutes} items`)
console.log(`    - criteria: ${result.stats.itemsWithNewFields.criteria} items`)
console.log(`    - deliverables: ${result.stats.itemsWithNewFields.deliverables} items`)

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
  console.log(`  - Modules: ${result.stats.modules} (unifié)`)
  console.log(`  - Items totaux: ${result.stats.items}`)
  console.log(`  - Chapitres totaux: ${result.stats.chapters}`)
  console.log(`\n✨ Nouveaux champs détectés:`)
  console.log(`  - ${result.stats.itemsWithNewFields.objective} items avec "objective"`)
  console.log(`  - ${result.stats.itemsWithNewFields.duration_minutes} items avec "duration_minutes"`)
  console.log(`  - ${result.stats.itemsWithNewFields.criteria} items avec "criteria"`)
  console.log(`  - ${result.stats.itemsWithNewFields.deliverables} items avec "deliverables"`)
  
  if (result.warnings.length > 0) {
    console.log(`\n⚠️  ${result.warnings.length} avertissement(s) - voir ci-dessus`)
  }
  
  console.log('\n✅ Prêt pour l\'import via /admin/courses/new/json')
  console.log('\n📌 Note: Les nouveaux champs (objective, duration_minutes, criteria, deliverables)')
  console.log('   seront stockés dans le champ JSONB "content" et seront accessibles dans l\'application.')
  process.exit(0)
}

