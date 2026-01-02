import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLearnersTable } from '../../lib/queries/trainerQueries';
import type { LearnerRow } from '../../types/database';
import { LearnersTable } from '../../components/trainer/LearnersTable';
import { TrainerHeader } from '../../components/trainer/TrainerHeader';

export function SessionLearners() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [learners, setLearners] = useState<LearnerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLearners() {
      if (!sessionId) return;

      setLoading(true);
      const { learners: sessionLearners, error } = await getLearnersTable(sessionId);

      if (error) {
        console.error('Error loading learners:', error);
      } else {
        setLearners(sessionLearners);
      }

      setLoading(false);
    }

    loadLearners();
  }, [sessionId]);

  function handleRelance(userId: string) {
    // TODO: Implémenter la relance (email, notification, etc.)
    alert(`Relance pour l'apprenant ${userId} (à implémenter)`);
  }

  function handleAssignResource(userId: string) {
    // TODO: Implémenter l'assignation de ressource
    alert(`Assigner ressource pour l'apprenant ${userId} (à implémenter)`);
  }

  function handleAddNote(userId: string) {
    // Rediriger vers la page de notes avec filtre
    navigate(`/trainer/notes?user_id=${userId}&session_id=${sessionId}`);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TrainerHeader />
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Apprenants de la session</h1>
              <p className="mt-2 text-gray-600">Session: {sessionId}</p>
            </div>
            <button
              onClick={() => navigate('/trainer')}
              className="rounded bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
            >
              Retour
            </button>
          </div>

        <LearnersTable
          learners={learners}
          loading={loading}
          onRelance={handleRelance}
          onAssignResource={handleAssignResource}
          onAddNote={handleAddNote}
        />
        </div>
      </div>
    </div>
  );
}

