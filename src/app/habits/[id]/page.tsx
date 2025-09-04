"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function HabitDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const habitId = params.id as string;

  const { data: habit, isLoading } = api.habit.getById.useQuery({
    id: habitId,
  });
  const { data: analytics } = api.habit.getAnalytics.useQuery({ id: habitId });

  const completeHabit = api.habit.complete.useMutation({
    onSuccess: () => {
      // Refetch data
      window.location.reload();
    },
  });

  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [completionData, setCompletionData] = useState({
    notes: "",
    mood: 5,
    energy: 5,
    photo: "",
  });

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth");
    return null;
  }

  if (!habit) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">
            Habitude non trouvée
          </h1>
          <Link
            href="/habits"
            className="text-purple-600 hover:text-purple-700"
          >
            ← Retour aux habitudes
          </Link>
        </div>
      </div>
    );
  }

  const handleCompleteHabit = (e: React.FormEvent) => {
    e.preventDefault();
    completeHabit.mutate({
      habitId,
      ...completionData,
    });
  };

  const getStreakEmoji = (streak: number) => {
    if (streak >= 30) return "🔥🔥🔥";
    if (streak >= 7) return "🔥🔥";
    if (streak >= 3) return "🔥";
    return "❄️";
  };

  const getMoodEmoji = (mood: number) => {
    const moods = ["😢", "😔", "😐", "😊", "😄"];
    return moods[mood - 1] || "😐";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/habits"
                className="text-gray-500 hover:text-gray-700"
              >
                ← Retour
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                {habit.title}
              </h1>
            </div>
            <button
              onClick={() => setShowCompleteForm(true)}
              className="rounded-lg bg-green-500 px-4 py-2 font-medium text-white transition-colors hover:bg-green-600"
            >
              Compléter
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Habit Info */}
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="flex items-start space-x-4">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full text-3xl"
                  style={{ backgroundColor: habit.color + "20" }}
                >
                  {habit.icon || "🎯"}
                </div>
                <div className="flex-1">
                  <h2 className="mb-2 text-2xl font-bold text-gray-900">
                    {habit.title}
                  </h2>
                  {habit.description && (
                    <p className="mb-4 text-gray-600">{habit.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span>Difficulté: {"⭐".repeat(habit.difficulty)}</span>
                    <span>Points: {habit.points}</span>
                    <span>Fréquence: {habit.frequency}</span>
                    {habit.timeOfDay && <span>Moment: {habit.timeOfDay}</span>}
                  </div>

                  {habit.hashtags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {habit.hashtags.map((tag: string, index: number) => (
                        <span
                          key={index}
                          className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-lg bg-white p-6 text-center shadow">
                <div className="mb-2 text-3xl font-bold text-orange-500">
                  {getStreakEmoji(habit.currentStreak)} {habit.currentStreak}
                </div>
                <p className="text-gray-600">Streak actuel</p>
              </div>

              <div className="rounded-lg bg-white p-6 text-center shadow">
                <div className="mb-2 text-3xl font-bold text-blue-500">
                  {habit.longestStreak}
                </div>
                <p className="text-gray-600">Meilleur streak</p>
              </div>

              <div className="rounded-lg bg-white p-6 text-center shadow">
                <div className="mb-2 text-3xl font-bold text-green-500">
                  {habit.totalCompletions}
                </div>
                <p className="text-gray-600">Complétions totales</p>
              </div>
            </div>

            {/* Recent Completions */}
            <div className="rounded-lg bg-white shadow">
              <div className="border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Complétions récentes
                </h3>
              </div>
              <div className="p-6">
                {habit.completions && habit.completions.length > 0 ? (
                  <div className="space-y-4">
                    {habit.completions.map((completion) => (
                      <div
                        key={completion.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 p-4"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl">
                            {getMoodEmoji(completion.mood || 3)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {completion.completedAt.toLocaleDateString()}
                            </p>
                            {completion.notes && (
                              <p className="text-sm text-gray-600">
                                {completion.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          {completion.mood && (
                            <span>Humeur: {completion.mood}/5</span>
                          )}
                          {completion.energy && (
                            <span>Énergie: {completion.energy}/5</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-gray-500">
                    Aucune completion récente
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold text-gray-900">
                Actions rapides
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowCompleteForm(true)}
                  className="w-full rounded-lg bg-green-500 px-4 py-2 font-medium text-white transition-colors hover:bg-green-600"
                >
                  Compléter maintenant
                </button>
                <Link
                  href={`/habits/${habit.id}/edit`}
                  className="block w-full rounded-lg bg-purple-500 px-4 py-2 text-center font-medium text-white transition-colors hover:bg-purple-600"
                >
                  Modifier
                </Link>
              </div>
            </div>

            {/* Analytics */}
            {analytics && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">
                  Analytics
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Taux de succès</span>
                    <span className="font-medium">
                      {analytics.successRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Complétions (30j)</span>
                    <span className="font-medium">
                      {analytics.completions.length}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complete Habit Modal */}
      {showCompleteForm && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div className="w-full max-w-md rounded-lg bg-white">
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Compléter l&apos;habitude
                </h2>
                <button
                  onClick={() => setShowCompleteForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCompleteHabit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={completionData.notes}
                    onChange={(e) =>
                      setCompletionData({
                        ...completionData,
                        notes: e.target.value,
                      })
                    }
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                    placeholder="Comment vous sentez-vous ?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Humeur (1-5)
                    </label>
                    <select
                      value={completionData.mood}
                      onChange={(e) =>
                        setCompletionData({
                          ...completionData,
                          mood: parseInt(e.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                    >
                      <option value={1}>😢 Très bas</option>
                      <option value={2}>😔 Bas</option>
                      <option value={3}>😐 Neutre</option>
                      <option value={4}>😊 Bon</option>
                      <option value={5}>😄 Excellent</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Énergie (1-5)
                    </label>
                    <select
                      value={completionData.energy}
                      onChange={(e) =>
                        setCompletionData({
                          ...completionData,
                          energy: parseInt(e.target.value),
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                    >
                      <option value={1}>😴 Très basse</option>
                      <option value={2}>😑 Basse</option>
                      <option value={3}>😐 Normale</option>
                      <option value={4}>😊 Élevée</option>
                      <option value={5}>⚡ Très élevée</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCompleteForm(false)}
                    className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={completeHabit.isPending}
                    className="rounded-lg bg-green-500 px-4 py-2 text-white transition-colors hover:bg-green-600 disabled:opacity-50"
                  >
                    {completeHabit.isPending ? "Complétion..." : "Compléter"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
