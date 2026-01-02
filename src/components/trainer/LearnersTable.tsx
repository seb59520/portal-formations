import React from 'react';
import type { LearnerRow } from '../../types/database';
import { formatRelativeDate, formatPercent, formatScore, getScoreColor } from '../../utils/trainerUtils';

interface LearnersTableProps {
  learners: LearnerRow[];
  loading?: boolean;
  onRelance?: (userId: string) => void;
  onAssignResource?: (userId: string) => void;
  onAddNote?: (userId: string) => void;
}

export function LearnersTable({
  learners,
  loading,
  onRelance,
  onAssignResource,
  onAddNote,
}: LearnersTableProps) {
  if (loading) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  if (learners.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center">
        <p className="text-gray-500">Aucun apprenant trouvé</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Apprenant
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Complétion
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Score moyen
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Dernière activité
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Blocage principal
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {learners.map((learner) => (
            <tr key={learner.user_id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-6 py-4">
                <div className="font-medium text-gray-900">{learner.display_name}</div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex items-center">
                  <span className="text-sm text-gray-900">
                    {formatPercent(learner.completion_percent)}
                  </span>
                  <div className="ml-2 h-2 w-24 rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-blue-600"
                      style={{ width: `${learner.completion_percent}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <span
                  className={`text-sm font-medium ${
                    getScoreColor(learner.avg_score) === 'green'
                      ? 'text-green-600'
                      : getScoreColor(learner.avg_score) === 'yellow'
                      ? 'text-yellow-600'
                      : getScoreColor(learner.avg_score) === 'red'
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}
                >
                  {formatScore(learner.avg_score)}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {formatRelativeDate(learner.last_activity_at)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {learner.main_blockage || '-'}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                  {onRelance && (
                    <button
                      onClick={() => onRelance(learner.user_id)}
                      className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                    >
                      Relancer
                    </button>
                  )}
                  {onAssignResource && (
                    <button
                      onClick={() => onAssignResource(learner.user_id)}
                      className="rounded bg-gray-200 px-3 py-1 text-gray-700 hover:bg-gray-300"
                    >
                      Ressource
                    </button>
                  )}
                  {onAddNote && (
                    <button
                      onClick={() => onAddNote(learner.user_id)}
                      className="rounded bg-gray-200 px-3 py-1 text-gray-700 hover:bg-gray-300"
                    >
                      Note
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

