/**
 * Fonction unifiée pour déterminer le rôle d'un utilisateur
 * Priorité : profiles.role === 'admin' > org_members.role > profiles.role
 */

import { supabase } from '../supabaseClient';

export type UnifiedRole = 'admin' | 'trainer' | 'student' | 'instructor' | 'auditor' | null;

export interface UserRoleContext {
  role: UnifiedRole;
  source: 'profiles_admin' | 'org_members' | 'profiles_default';
  orgId: string | null;
}

/**
 * Récupère le rôle unifié d'un utilisateur
 * Cette fonction garantit une détermination cohérente du rôle
 */
export async function getUserRole(userId: string): Promise<UserRoleContext> {
  try {
    console.log('🔍 getUserRole - Début pour userId:', userId);

    // 1. Vérifier d'abord le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Erreur lors de la récupération du profil:', profileError);
      console.error('❌ Code erreur:', profileError.code);
      console.error('❌ Message:', profileError.message);
      console.error('❌ Détails:', profileError.details);
      console.error('❌ Hint:', profileError.hint);
    }

    console.log('📋 Profil récupéré:', profile);
    
    if (!profile) {
      console.warn('⚠️ Aucun profil trouvé pour userId:', userId);
      console.warn('⚠️ Cela peut signifier :');
      console.warn('   1. Le profil n\'existe pas dans la base de données');
      console.warn('   2. Les policies RLS bloquent l\'accès');
      console.warn('   3. L\'utilisateur n\'est pas authentifié correctement');
    }

    // 2. Si admin dans profiles, retourner immédiatement 'admin'
    // (priorité absolue pour les admins)
    if (profile && profile.role === 'admin') {
      console.log('✅ Rôle déterminé: admin (depuis profiles)');
      return {
        role: 'admin',
        source: 'profiles_admin',
        orgId: null,
      };
    }

    // 3. Chercher dans org_members (si l'utilisateur est dans une organisation)
    // Prendre le premier membre trouvé (ou le plus récent si plusieurs)
    const { data: members, error: memberError } = await supabase
      .from('org_members')
      .select('org_id, role, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (memberError) {
      console.error('❌ Erreur lors de la récupération des membres:', memberError);
    }

    console.log('📋 Membres récupérés:', members);

    // 4. Si trouvé dans org_members, utiliser ce rôle
    if (members && members.length > 0) {
      const member = members[0];
      console.log('✅ Rôle déterminé:', member.role, '(depuis org_members, org:', member.org_id, ')');
      
      // Mapper les rôles org_members vers les rôles unifiés
      const unifiedRole: UnifiedRole = 
        member.role === 'admin' ? 'admin' :
        member.role === 'trainer' ? 'trainer' :
        member.role === 'student' ? 'student' :
        member.role === 'auditor' ? 'auditor' :
        'student'; // Par défaut

      return {
        role: unifiedRole,
        source: 'org_members',
        orgId: member.org_id,
      };
    }

    // 5. Fallback : utiliser le rôle du profil (student, instructor, etc.)
    if (profile) {
      const unifiedRole: UnifiedRole = 
        profile.role === 'admin' ? 'admin' :
        profile.role === 'instructor' ? 'trainer' : // Mapper instructor -> trainer
        profile.role === 'student' ? 'student' :
        'student'; // Par défaut

      console.log('✅ Rôle déterminé:', unifiedRole, '(depuis profiles, fallback)');
      return {
        role: unifiedRole,
        source: 'profiles_default',
        orgId: null,
      };
    }

    // 6. Aucun rôle trouvé
    console.warn('⚠️ Aucun rôle trouvé pour userId:', userId);
    console.warn('⚠️ Profil:', profile ? 'existe mais sans rôle valide' : 'n\'existe pas');
    console.warn('⚠️ Membres org:', members && members.length > 0 ? `${members.length} trouvé(s)` : 'aucun');
    
    // Si le profil n'existe pas, suggérer de le créer
    if (!profile) {
      console.error('❌ ACTION REQUISE: Le profil n\'existe pas dans la base de données.');
      console.error('❌ Exécutez cette requête SQL dans Supabase pour créer le profil:');
      console.error(`   INSERT INTO profiles (id, role, full_name) VALUES ('${userId}', 'admin', 'Admin User');`);
    }
    
    return {
      role: null,
      source: 'profiles_default',
      orgId: null,
    };
  } catch (error) {
    console.error('❌ Erreur inattendue dans getUserRole:', error);
    return {
      role: null,
      source: 'profiles_default',
      orgId: null,
    };
  }
}

/**
 * Récupère le rôle de l'utilisateur actuellement authentifié
 */
export async function getCurrentUserRole(): Promise<UserRoleContext> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      role: null,
      source: 'profiles_default',
      orgId: null,
    };
  }
  return getUserRole(user.id);
}

