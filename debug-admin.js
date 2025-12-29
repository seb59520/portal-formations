// Script de diagnostic pour la page admin
// À exécuter dans la console du navigateur sur http://localhost:5173/admin

console.log('=== DIAGNOSTIC PAGE ADMIN ===');

// 1. Vérifier l'utilisateur connecté
const { user, profile } = window.authState || {};
console.log('Utilisateur connecté:', user);
console.log('Profil:', profile);
console.log('Rôle:', profile?.role);

// 2. Tester l'accès aux tables
async function testTables() {
  try {
    console.log('Test des tables...');

    // Test profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    console.log('Profiles:', profiles, 'Error:', profilesError);

    // Test courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .limit(1);
    console.log('Courses:', courses, 'Error:', coursesError);

  } catch (error) {
    console.error('Erreur lors du test:', error);
  }
}

testTables();
