// Script à exécuter dans la console du navigateur pour tester le registre de jeux
// Copiez-collez ce code dans la console (F12) de votre navigateur

// 1. Vérifier que le registre est chargé
console.log('=== Test du registre de jeux ===')

// 2. Vérifier les jeux enregistrés (nécessite d'importer depuis le module)
// Note: Cette partie nécessite que le code soit compilé et chargé

// Alternative: Vérifier dans les logs de la console au chargement de la page
// Vous devriez voir: "✅ Jeu "Types de fichiers JSON" (json-file-types) enregistré avec succès"

// 3. Vérifier les erreurs React
// Regardez dans la console pour les erreurs qui commencent par:
// - "The above error occurred in the"
// - "Error:"
// - "TypeError:"
// - "Cannot read property"

// 4. Vérifier les props passées au jeu
// Dans GameRenderer, vous devriez voir des logs comme:
// "[GameRenderer] Rendering game "json-file-types" with props: {...}"

// 5. Vérifier que le composant est bien importé
// Dans les sources (Sources tab), cherchez JsonFileTypesGame.tsx
// Vérifiez qu'il n'y a pas d'erreurs de syntaxe

