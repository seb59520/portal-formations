/**
 * Requêtes Supabase pour le dashboard Formateur
 */

import { supabase } from '../supabaseClient';
import type {
  Org,
  OrgMember,
  Session,
  SessionKPIs,
  LearnerRow,
  ModuleAnalytics,
  ExerciseAnalytics,
  TrainerNote,
} from '../../types/database';

import { getUserRole } from './userRole';

/**
 * Récupère toutes les organisations d'un formateur/admin
 */
export async function getAllTrainerOrgs(): Promise<{
  orgs: Org[];
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { orgs: [], error: new Error('Non authentifié') };
    }

    // Vérifier si admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    // Si admin, retourner toutes les organisations
    if (profile && profile.role === 'admin') {
      const { data: allOrgs, error: orgsError } = await supabase
        .from('orgs')
        .select('*')
        .order('created_at', { ascending: false });

      if (orgsError) {
        return { orgs: [], error: orgsError };
      }

      return { orgs: allOrgs || [], error: null };
    }

    // Sinon, récupérer les organisations où l'utilisateur est membre
    const { data: members, error: membersError } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id);

    if (membersError) {
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
      return { orgs: [], error: orgsError };
    }

    return { orgs: orgs || [], error: null };
  } catch (error) {
    console.error('❌ Erreur inattendue dans getAllTrainerOrgs:', error);
    return { orgs: [], error: error as Error };
  }
}

/**
 * Récupère le contexte du formateur (org + role)
 * Utilise getUserRole() pour une détermination cohérente du rôle
 */
export async function getTrainerContext(): Promise<{
  org: Org | null;
  role: string | null;
  error: Error | null;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { org: null, role: null, error: new Error('Non authentifié') };
    }

    // Utiliser la fonction unifiée pour déterminer le rôle
    const roleContext = await getUserRole(user.id);
    console.log('🔍 getTrainerContext - Rôle déterminé:', roleContext);

    // Si admin, essayer de trouver une org (mais pas obligatoire)
    if (roleContext.role === 'admin') {
      const { data: anyOrg } = await supabase
        .from('orgs')
        .select('*')
        .limit(1)
        .maybeSingle();

      return { org: anyOrg || null, role: 'admin', error: null };
    }

    // Si le rôle vient de org_members, récupérer l'org
    if (roleContext.orgId) {
      const { data: org, error: orgError } = await supabase
        .from('orgs')
        .select('*')
        .eq('id', roleContext.orgId)
        .single();

      if (orgError) {
        console.error('❌ Erreur lors de la récupération de l\'org:', orgError);
        return { org: null, role: roleContext.role, error: orgError };
      }

      return { org, role: roleContext.role, error: null };
    }

    // Si pas d'org mais un rôle valide (trainer, student, etc.)
    if (roleContext.role) {
      return { org: null, role: roleContext.role, error: null };
    }

    // Aucun rôle trouvé
    return { org: null, role: null, error: new Error('Aucune organisation ou rôle trouvé') };
  } catch (error) {
    console.error('❌ Erreur inattendue dans getTrainerContext:', error);
    return { org: null, role: null, error: error as Error };
  }
}

/**
 * Récupère les sessions actives pour une organisation
 */
export async function getSessions(orgId: string | null, isAdmin: boolean = false): Promise<{
  sessions: Session[];
  error: Error | null;
}> {
  try {
    console.log(`🔍 Chargement des sessions pour orgId: ${orgId}, isAdmin: ${isAdmin}`);
    let query = supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (!isAdmin && orgId) {
      query = query.eq('org_id', orgId);
    }
    // Si admin, on ne filtre pas par org_id pour voir toutes les sessions

    console.log('🔍 getSessions - orgId:', orgId, 'isAdmin:', isAdmin);
    const { data, error } = await query;

    if (error) {
      console.error('❌ Erreur lors du chargement des sessions:', error);
      return { sessions: [], error };
    }

    console.log('✅ Sessions chargées:', data?.length || 0, 'sessions');
    if (data && data.length > 0) {
      console.log('📋 Sessions:', data.map(s => ({ id: s.id, title: s.title, org_id: s.org_id, status: s.status })));
    }

    return { sessions: data || [], error: null };
  } catch (error) {
    console.error('❌ Exception lors du chargement des sessions:', error);
    return { sessions: [], error: error as Error };
  }
}

/**
 * Récupère les KPIs d'une session
 */
export async function getSessionKPIs(sessionId: string): Promise<{
  kpis: SessionKPIs | null;
  error: Error | null;
}> {
  try {
    // Récupérer les données de la session
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('course_id, org_id')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      return { kpis: null, error: sessionError };
    }

    // Récupérer tous les enrollments de la session
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('user_id')
      .eq('session_id', sessionId)
      .eq('status', 'active');

    const userIds = enrollments?.map((e: any) => e.user_id) || [];

    if (userIds.length === 0) {
      return {
        kpis: {
          active_learners_7d: 0,
          completion_rate: 0,
          avg_score: null,
          difficult_modules: [],
        },
        error: null,
      };
    }

    // Apprenants actifs (7 derniers jours)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: recentActivity } = await supabase
      .from('activity_events')
      .select('user_id')
      .eq('session_id', sessionId)
      .in('user_id', userIds)
      .gte('created_at', sevenDaysAgo.toISOString());

    const activeUserIds = new Set(recentActivity?.map((a: any) => a.user_id) || []);
    const active_learners_7d = activeUserIds.size;

    // Taux de complétion
    const { data: progress } = await supabase
      .from('module_progress')
      .select('percent')
      .eq('session_id', sessionId)
      .in('user_id', userIds);

    const totalProgress = progress?.reduce((sum, p) => sum + (p.percent || 0), 0) || 0;
    const completion_rate = progress && progress.length > 0 ? totalProgress / progress.length : 0;

    // Score moyen
    const { data: submissions } = await supabase
      .from('submissions')
      .select('grade')
      .eq('session_id', sessionId)
      .in('user_id', userIds)
      .not('grade', 'is', null);

    const scores = submissions?.map((s: any) => s.grade).filter((g: any) => g !== null) || [];
    const avg_score = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

    // Modules en difficulté
    const { data: moduleProgress } = await supabase
      .from('module_progress')
      .select('module_id, percent')
      .eq('session_id', sessionId)
      .in('user_id', userIds);

    const moduleStats: Record<string, { total: number; sum: number }> = {};
    moduleProgress?.forEach((mp: any) => {
      if (!moduleStats[mp.module_id]) {
        moduleStats[mp.module_id] = { total: 0, sum: 0 };
      }
      moduleStats[mp.module_id].total += 1;
      moduleStats[mp.module_id].sum += mp.percent || 0;
    });

    const difficult_modules = Object.entries(moduleStats)
      .map(([moduleId, stats]) => ({
        module_id: moduleId,
        avg_completion: stats.total > 0 ? stats.sum / stats.total : 0,
      }))
      .filter((m) => m.avg_completion < 50)
      .slice(0, 5);

    return {
      kpis: {
        active_learners_7d,
        completion_rate,
        avg_score,
        difficult_modules,
      },
      error: null,
    };
  } catch (error) {
    return { kpis: null, error: error as Error };
  }
}

/**
 * Récupère la table des apprenants pour une session
 */
export async function getLearnersTable(sessionId: string): Promise<{
  learners: LearnerRow[];
  error: Error | null;
}> {
  try {
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('user_id')
      .eq('session_id', sessionId)
      .eq('status', 'active');

    if (enrollError) {
      return { learners: [], error: enrollError };
    }

    const userIds = enrollments?.map((e: any) => e.user_id) || [];

    if (userIds.length === 0) {
      return { learners: [], error: null };
    }

    // Récupérer les profils
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds);

    // Récupérer les progressions
    const { data: progress } = await supabase
      .from('module_progress')
      .select('user_id, percent')
      .eq('session_id', sessionId)
      .in('user_id', userIds);

    // Récupérer les scores
    const { data: submissions } = await supabase
      .from('submissions')
      .select('user_id, grade')
      .eq('session_id', sessionId)
      .in('user_id', userIds)
      .not('grade', 'is', null);

    // Récupérer la dernière activité
    const { data: activities } = await supabase
      .from('activity_events')
      .select('user_id, created_at')
      .eq('session_id', sessionId)
      .in('user_id', userIds)
      .order('created_at', { ascending: false });

    const learners: LearnerRow[] = userIds.map((userId) => {
      const profile = profiles?.find((p: any) => p.id === userId);
      const userProgress = progress?.filter((p: any) => p.user_id === userId) || [];
      const userScores = submissions?.filter((s: any) => s.user_id === userId).map((s: any) => s.grade) || [];
      const userActivities = activities?.filter((a: any) => a.user_id === userId) || [];

      const completion_percent = userProgress.length > 0
        ? userProgress.reduce((sum, p) => sum + (p.percent || 0), 0) / userProgress.length
        : 0;

      const avg_score = userScores.length > 0
        ? userScores.reduce((a, b) => a + b, 0) / userScores.length
        : null;

      const last_activity_at = userActivities.length > 0 ? userActivities[0].created_at : null;

      // Trouver le module avec la plus faible progression
      const moduleProgress = userProgress.map((p: any) => p.percent || 0);
      const minProgress = Math.min(...moduleProgress, 100);
      const main_blockage = minProgress < 50 ? `Module bloqué (${Math.round(minProgress)}%)` : null;

      return {
        user_id: userId,
        display_name: profile?.display_name || 'Utilisateur inconnu',
        completion_percent,
        avg_score,
        last_activity_at,
        main_blockage,
      };
    });

    return { learners, error: null };
  } catch (error) {
    return { learners: [], error: error as Error };
  }
}

/**
 * Récupère les analyses des modules pour une session
 */
export async function getModuleAnalytics(sessionId: string): Promise<{
  analytics: ModuleAnalytics[];
  error: Error | null;
}> {
  try {
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('course_id')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      return { analytics: [], error: sessionError };
    }

    const courseId = (sessionData as any).course_id;

    // Récupérer tous les modules du cours
    const { data: modules } = await supabase
      .from('modules')
      .select('id, title')
      .eq('course_id', courseId);

    const analytics: ModuleAnalytics[] = [];

    for (const module of modules || []) {
      // Récupérer les progressions pour ce module
      const { data: progress } = await supabase
        .from('module_progress')
        .select('percent, updated_at')
        .eq('module_id', module.id)
        .eq('session_id', sessionId);

      const totalUsers = progress?.length || 0;
      const completedUsers = progress?.filter((p: any) => (p.percent || 0) >= 100).length || 0;
      const startedUsers = progress?.filter((p: any) => (p.percent || 0) > 0).length || 0;
      const abandon_rate = startedUsers > 0 ? ((startedUsers - completedUsers) / startedUsers) * 100 : 0;

      // Temps moyen (simplifié - basé sur updated_at - started_at)
      const times = progress?.map((p: any) => {
        // Approximation basée sur updated_at
        return 30; // minutes par défaut
      }) || [];
      const avg_time_minutes = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

      // Score moyen (basé sur les submissions des items de ce module)
      const { data: items } = await supabase
        .from('items')
        .select('id')
        .eq('module_id', module.id);

      const itemIds = items?.map((i: any) => i.id) || [];
      const { data: submissions } = await supabase
        .from('submissions')
        .select('grade')
        .in('item_id', itemIds)
        .eq('session_id', sessionId)
        .not('grade', 'is', null);

      const scores = submissions?.map((s: any) => s.grade).filter((g: any) => g !== null) || [];
      const avg_score = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

      analytics.push({
        module_id: module.id,
        module_title: module.title,
        abandon_rate,
        avg_time_minutes,
        avg_score,
      });
    }

    return { analytics, error: null };
  } catch (error) {
    return { analytics: [], error: error as Error };
  }
}

export async function getExerciseAnalytics(sessionId: string): Promise<{
  analytics: ExerciseAnalytics[];
  error: Error | null;
}> {
  try {
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('course_id')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      return { analytics: [], error: sessionError };
    }

    const courseId = (sessionData as any).course_id;

    // Récupérer tous les exercices du cours
    const { data: modules } = await supabase
      .from('modules')
      .select('id')
      .eq('course_id', courseId);

    const moduleIds = modules?.map((m: any) => m.id) || [];
    const { data: items } = await supabase
      .from('items')
      .select('id, title')
      .in('module_id', moduleIds)
      .eq('type', 'exercise');

    const { data: exercises } = await supabase
      .from('exercises')
      .select('id, item_id')
      .in('item_id', items?.map((i: any) => i.id) || []);

    const analytics: ExerciseAnalytics[] = [];

    for (const exercise of exercises || []) {
      const item = items?.find((i: any) => i.id === exercise.item_id);
      const { data: attempts } = await supabase
        .from('exercise_attempts')
        .select('score, is_correct, answer_json, metadata')
        .eq('exercise_id', exercise.id)
        .eq('session_id', sessionId);

      const totalAttempts = attempts?.length || 0;
      const failedAttempts = attempts?.filter((a: any) => !a.is_correct || (a.score !== null && a.score < 60)).length || 0;
      const failure_rate = totalAttempts > 0 ? (failedAttempts / totalAttempts) * 100 : 0;

      const scores = attempts?.filter((a: any) => a.score !== null).map((a: any) => a.score) || [];
      const avg_score = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : null;

      // Top erreurs (simplifié - analyser answer_json/metadata si disponible)
      const top_errors: Array<{ error: string; count: number }> = [];
      // TODO: Implémenter l'analyse des erreurs depuis answer_json/metadata

      analytics.push({
        exercise_id: exercise.id,
        exercise_title: item?.title || 'Exercice inconnu',
        failure_rate,
        avg_score,
        top_errors,
      });
    }

    return { analytics, error: null };
  } catch (error) {
    return { analytics: [], error: error as Error };
  }
}

/**
 * Récupère les résultats détaillés d'un exercice pour une session
 */
export async function getExerciseResults(
  sessionId: string,
  exerciseId: string
): Promise<{
  results: Array<{
    user_id: string;
    display_name: string;
    attempt_number: number;
    answer_text: string | null;
    answer_json: any;
    score: number | null;
    is_correct: boolean | null;
    feedback: string | null;
    submitted_at: string;
  }>;
  exercise_title: string;
  error: Error | null;
}> {
  try {
    // Récupérer l'exercice et son item
    const { data: exercise, error: exerciseError } = await supabase
      .from('exercises')
      .select('item_id')
      .eq('id', exerciseId)
      .single();

    if (exerciseError) {
      return { results: [], exercise_title: '', error: exerciseError };
    }

    const { data: item } = await supabase
      .from('items')
      .select('title')
      .eq('id', exercise.item_id)
      .single();

    // Récupérer toutes les tentatives pour cet exercice dans cette session
    const { data: attempts, error: attemptsError } = await supabase
      .from('exercise_attempts')
      .select('user_id, attempt_number, answer_text, answer_json, score, is_correct, feedback, submitted_at')
      .eq('exercise_id', exerciseId)
      .eq('session_id', sessionId)
      .order('submitted_at', { ascending: false });

    if (attemptsError) {
      return { results: [], exercise_title: item?.title || '', error: attemptsError };
    }

    // Récupérer les profils des utilisateurs
    const userIds = [...new Set(attempts?.map((a: any) => a.user_id) || [])];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds);

    // Combiner les données
    const results = (attempts || []).map((attempt: any) => {
      const profile = profiles?.find((p: any) => p.id === attempt.user_id);
      return {
        user_id: attempt.user_id,
        display_name: profile?.display_name || 'Utilisateur inconnu',
        attempt_number: attempt.attempt_number,
        answer_text: attempt.answer_text,
        answer_json: attempt.answer_json,
        score: attempt.score,
        is_correct: attempt.is_correct,
        feedback: attempt.feedback,
        submitted_at: attempt.submitted_at,
      };
    });

    return {
      results,
      exercise_title: item?.title || 'Exercice inconnu',
      error: null,
    };
  } catch (error) {
    return { results: [], exercise_title: '', error: error as Error };
  }
}

/**
 * Récupère les notes du formateur
 */
export async function getTrainerNotes(
  trainerId: string,
  orgId: string,
  filters?: {
    course_id?: string;
    module_id?: string;
    session_id?: string;
    user_id?: string;
  }
): Promise<{
  notes: TrainerNote[];
  error: Error | null;
}> {
  try {
    let query = supabase
      .from('trainer_notes')
      .select('*')
      .eq('trainer_id', trainerId)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (filters?.course_id) {
      query = query.eq('course_id', filters.course_id);
    }
    if (filters?.module_id) {
      query = query.eq('module_id', filters.module_id);
    }
    if (filters?.session_id) {
      query = query.eq('session_id', filters.session_id);
    }
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    const { data, error } = await query;

    if (error) {
      return { notes: [], error };
    }

    return { notes: data || [], error: null };
  } catch (error) {
    return { notes: [], error: error as Error };
  }
}

/**
 * Crée une note formateur
 */
export async function createTrainerNote(
  note: Omit<TrainerNote, 'id' | 'created_at' | 'updated_at'>
): Promise<{ note: TrainerNote | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('trainer_notes')
      .insert(note)
      .select()
      .single();

    if (error) {
      return { note: null, error };
    }

    return { note: data as TrainerNote, error: null };
  } catch (error) {
    return { note: null, error: error as Error };
  }
}

/**
 * Met à jour une note formateur
 */
export async function updateTrainerNote(
  noteId: string,
  updates: Partial<Omit<TrainerNote, 'id' | 'created_at' | 'updated_at'>>
): Promise<{ note: TrainerNote | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('trainer_notes')
      .update(updates)
      .eq('id', noteId)
      .select()
      .single();

    if (error) {
      return { note: null, error };
    }

    return { note: data as TrainerNote, error: null };
  } catch (error) {
    return { note: null, error: error as Error };
  }
}

/**
 * Supprime une note formateur
 */
export async function deleteTrainerNote(noteId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('trainer_notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      return { error };
    }

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}
