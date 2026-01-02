/**
 * Requêtes pour les utilisateurs (étudiants)
 */

import { supabase } from '../supabaseClient';
import type { Org } from '../../types/database';

/**
 * Récupère l'organisation de rattachement d'un utilisateur
 */
export async function getUserOrg(userId: string): Promise<{
  org: Org | null;
  error: Error | null;
}> {
  try {
    // Récupérer l'organisation via org_members
    const { data: member, error: memberError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (memberError) {
      console.error('❌ Erreur lors de la récupération du membre:', memberError);
      return { org: null, error: memberError };
    }

    if (!member) {
      return { org: null, error: null };
    }

    // Récupérer l'organisation
    const { data: org, error: orgError } = await supabase
      .from('orgs')
      .select('*')
      .eq('id', member.org_id)
      .single();

    if (orgError) {
      console.error('❌ Erreur lors de la récupération de l\'organisation:', orgError);
      return { org: null, error: orgError };
    }

    return { org, error: null };
  } catch (error) {
    console.error('❌ Erreur inattendue dans getUserOrg:', error);
    return { org: null, error: error as Error };
  }
}

/**
 * Récupère toutes les organisations d'un utilisateur (si plusieurs)
 */
export async function getUserOrgs(userId: string): Promise<{
  orgs: Org[];
  error: Error | null;
}> {
  try {
    // Récupérer toutes les organisations via org_members
    const { data: members, error: membersError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', userId);

    if (membersError) {
      console.error('❌ Erreur lors de la récupération des membres:', membersError);
      return { orgs: [], error: membersError };
    }

    if (!members || members.length === 0) {
      return { orgs: [], error: null };
    }

    const orgIds = members.map(m => m.org_id);
    const { data: orgs, error: orgsError } = await supabase
      .from('orgs')
      .select('*')
      .in('id', orgIds)
      .order('created_at', { ascending: false });

    if (orgsError) {
      console.error('❌ Erreur lors de la récupération des organisations:', orgsError);
      return { orgs: [], error: orgsError };
    }

    return { orgs: orgs || [], error: null };
  } catch (error) {
    console.error('❌ Erreur inattendue dans getUserOrgs:', error);
    return { orgs: [], error: error as Error };
  }
}

