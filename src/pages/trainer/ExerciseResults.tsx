import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExerciseResults } from '../../lib/queries/trainerQueries';
import { TrainerHeader } from '../../components/trainer/TrainerHeader';
import { formatScore, formatRelativeDate } from '../../utils/trainerUtils';
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

export function ExerciseResults() {
  const { sessionId, exerciseId } = useParams<{ sessionId: string; exerciseId: string }>();
  const navigate = useNavigate();
  const [results, setResults] = useState<any[]>([]);
  const [exerciseTitle, setExerciseTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    async function loadResults() {
      if (!sessionId || !exerciseId) return;

      setLoading(true);
      const { results: exerciseResults, exercise_title, error } = await getExerciseResults(
        sessionId,
        exerciseId
      );

      if (error) {
        console.error('Error loading exercise results:', error);
      } else {
        setResults(exerciseResults);
        setExerciseTitle(exercise_title);
      }

      setLoading(false);
    }

    loadResults();
  }, [sessionId, exerciseId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  // Grouper les résultats par utilisateur
  const resultsByUser = results.reduce((acc, result) => {
    if (!acc[result.user_id]) {
      acc[result.user_id] = {
        user_id: result.user_id,
        display_name: result.display_name,
        attempts: [],
      };
    }
    acc[result.user_id].attempts.push(result);
    return acc;
  }, {} as Record<string, any>);

  const userList = Object.values(resultsByUser);

  return (
    <div className="min-h-screen bg-gray-50">
      <TrainerHeader />
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Résultats de l'exercice</h1>
              <p className="mt-2 text-gray-600">{exerciseTitle}</p>
            </div>
            <button
              onClick={() => navigate(`/trainer/analytics/${sessionId}`)}
              className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
            >
              Retour aux analyses
            </button>
          </div>

          {results.length === 0 ? (
            <div className="rounded-lg border bg-white p-8 text-center">
              <p className="text-gray-500">Aucun résultat disponible pour cet exercice</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Liste des utilisateurs */}
              <div className="lg:col-span-1">
                <div className="rounded-lg border bg-white p-4">
                  <h2 className="mb-4 text-lg font-semibold text-gray-900">Apprenants</h2>
                  <div className="space-y-2">
                    {userList.map((user: any) => {
                      const bestAttempt = user.attempts.reduce((best: any, current: any) => {
                        if (!best) return current;
                        if (current.score !== null && (best.score === null || current.score > best.score)) {
                          return current;
                        }
                        if (current.is_correct && !best.is_correct) {
                          return current;
                        }
                        return best;
                      }, null);

                      return (
                        <button
                          key={user.user_id}
                          onClick={() => setSelectedUser(user.user_id)}
                          className={`w-full rounded-lg border p-3 text-left transition-colors ${
                            selectedUser === user.user_id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{user.display_name}</span>
                            {bestAttempt && (
                              <div className="flex items-center space-x-2">
                                {bestAttempt.is_correct ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                {bestAttempt.score !== null && (
                                  <span className="text-sm font-medium text-gray-700">
                                    {formatScore(bestAttempt.score)}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {user.attempts.length} tentative{user.attempts.length > 1 ? 's' : ''}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Détails des tentatives */}
              <div className="lg:col-span-2">
                {selectedUser ? (
                  <div className="space-y-4">
                    {resultsByUser[selectedUser].attempts.map((attempt: any, index: number) => (
                      <div
                        key={index}
                        className="rounded-lg border bg-white p-6 shadow-sm"
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                attempt.is_correct
                                  ? 'bg-green-100 text-green-600'
                                  : attempt.is_correct === false
                                  ? 'bg-red-100 text-red-600'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {attempt.is_correct ? (
                                <CheckCircle className="h-5 w-5" />
                              ) : attempt.is_correct === false ? (
                                <XCircle className="h-5 w-5" />
                              ) : (
                                <Clock className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                Tentative #{attempt.attempt_number}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {formatRelativeDate(attempt.submitted_at)}
                              </p>
                            </div>
                          </div>
                          {attempt.score !== null && (
                            <div className="text-right">
                              <div className="text-2xl font-bold text-gray-900">
                                {formatScore(attempt.score)}
                              </div>
                              <div className="text-sm text-gray-500">Score</div>
                            </div>
                          )}
                        </div>

                        {/* Réponse texte */}
                        {attempt.answer_text && (
                          <div className="mb-4">
                            <h4 className="mb-2 text-sm font-medium text-gray-700">Réponse :</h4>
                            <div className="rounded-lg bg-gray-50 p-4">
                              <p className="whitespace-pre-wrap text-gray-900">{attempt.answer_text}</p>
                            </div>
                          </div>
                        )}

                        {/* Réponse JSON (pour les exercices structurés) */}
                        {attempt.answer_json && (
                          <div className="mb-4">
                            <h4 className="mb-2 text-sm font-medium text-gray-700">Réponse structurée :</h4>
                            <div className="rounded-lg bg-gray-50 p-4">
                              <pre className="overflow-x-auto text-sm text-gray-900">
                                {JSON.stringify(attempt.answer_json, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Feedback */}
                        {attempt.feedback && (
                          <div className="mb-4">
                            <h4 className="mb-2 text-sm font-medium text-gray-700">Feedback :</h4>
                            <div className="rounded-lg bg-blue-50 p-4">
                              <p className="text-gray-900">{attempt.feedback}</p>
                            </div>
                          </div>
                        )}

                        {/* Statut */}
                        <div className="flex items-center space-x-4 text-sm">
                          <div>
                            <span className="text-gray-500">Statut : </span>
                            <span
                              className={`font-medium ${
                                attempt.is_correct
                                  ? 'text-green-600'
                                  : attempt.is_correct === false
                                  ? 'text-red-600'
                                  : 'text-gray-600'
                              }`}
                            >
                              {attempt.is_correct === true
                                ? 'Correct'
                                : attempt.is_correct === false
                                ? 'Incorrect'
                                : 'En attente'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Soumis le : </span>
                            <span className="font-medium text-gray-900">
                              {new Date(attempt.submitted_at).toLocaleString('fr-FR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border bg-white p-8 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-4 text-gray-500">Sélectionnez un apprenant pour voir ses résultats</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

