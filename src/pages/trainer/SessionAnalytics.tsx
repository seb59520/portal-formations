import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getModuleAnalytics, getExerciseAnalytics } from '../../lib/queries/trainerQueries';
import type { ModuleAnalytics, ExerciseAnalytics } from '../../types/database';
import { TrainerHeader } from '../../components/trainer/TrainerHeader';
import { formatPercent, formatScore, formatDuration } from '../../utils/trainerUtils';

export function SessionAnalytics() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [moduleAnalytics, setModuleAnalytics] = useState<ModuleAnalytics[]>([]);
  const [exerciseAnalytics, setExerciseAnalytics] = useState<ExerciseAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'modules' | 'exercises'>('modules');

  useEffect(() => {
    async function loadAnalytics() {
      if (!sessionId) return;

      setLoading(true);

      const [modulesResult, exercisesResult] = await Promise.all([
        getModuleAnalytics(sessionId),
        getExerciseAnalytics(sessionId),
      ]);

      if (modulesResult.error) {
        console.error('Error loading module analytics:', modulesResult.error);
      } else {
        setModuleAnalytics(modulesResult.analytics);
      }

      if (exercisesResult.error) {
        console.error('Error loading exercise analytics:', exercisesResult.error);
      } else {
        setExerciseAnalytics(exercisesResult.analytics);
      }

      setLoading(false);
    }

    loadAnalytics();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TrainerHeader />
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Analyses détaillées</h1>
            <button
              onClick={() => navigate('/trainer')}
              className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
            >
              Retour
            </button>
          </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('modules')}
              className={`border-b-2 py-4 px-1 text-sm font-medium ${
                activeTab === 'modules'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Modules en difficulté
            </button>
            <button
              onClick={() => setActiveTab('exercises')}
              className={`border-b-2 py-4 px-1 text-sm font-medium ${
                activeTab === 'exercises'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Exercices
            </button>
          </nav>
        </div>

        {/* Modules Analytics */}
        {activeTab === 'modules' && (
          <div className="space-y-4">
            {moduleAnalytics.length === 0 ? (
              <div className="rounded-lg border bg-white p-8 text-center">
                <p className="text-gray-500">Aucune donnée disponible</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border bg-white">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Module
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Taux d'abandon
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Temps moyen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Score moyen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {moduleAnalytics.map((module) => (
                      <tr key={module.module_id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                          {module.module_title}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`text-sm font-medium ${
                              module.abandon_rate > 30 ? 'text-red-600' : module.abandon_rate > 15 ? 'text-yellow-600' : 'text-green-600'
                            }`}
                          >
                            {formatPercent(module.abandon_rate)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {formatDuration(module.avg_time_minutes)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`text-sm font-medium ${
                              module.avg_score !== null && module.avg_score < 60
                                ? 'text-red-600'
                                : module.avg_score !== null && module.avg_score < 80
                                ? 'text-yellow-600'
                                : 'text-green-600'
                            }`}
                          >
                            {formatScore(module.avg_score)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Exercises Analytics */}
        {activeTab === 'exercises' && (
          <div className="space-y-4">
            {exerciseAnalytics.length === 0 ? (
              <div className="rounded-lg border bg-white p-8 text-center">
                <p className="text-gray-500">Aucune donnée disponible</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border bg-white">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Exercice (cliquez pour voir les résultats)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Taux d'échec
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Score moyen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Erreurs fréquentes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {exerciseAnalytics.map((exercise) => (
                      <tr key={exercise.exercise_id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">
                          <button
                            onClick={() => navigate(`/trainer/session/${sessionId}/exercise/${exercise.exercise_id}/results`)}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {exercise.exercise_title}
                          </button>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`text-sm font-medium ${
                              exercise.failure_rate > 50 ? 'text-red-600' : exercise.failure_rate > 30 ? 'text-yellow-600' : 'text-green-600'
                            }`}
                          >
                            {formatPercent(exercise.failure_rate)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`text-sm font-medium ${
                              exercise.avg_score !== null && exercise.avg_score < 60
                                ? 'text-red-600'
                                : exercise.avg_score !== null && exercise.avg_score < 80
                                ? 'text-yellow-600'
                                : 'text-green-600'
                            }`}
                          >
                            {formatScore(exercise.avg_score)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {exercise.top_errors.length > 0 ? (
                            <ul className="list-disc pl-5">
                              {exercise.top_errors.slice(0, 3).map((error, idx) => (
                                <li key={idx}>
                                  {error.error} ({error.count}x)
                                </li>
                              ))}
                            </ul>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

