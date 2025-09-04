"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);

  const { data: habits, isLoading: habitsLoading } =
    api.habit.getAll.useQuery();
  const { data: stats } = api.user.getStats.useQuery();
  const { data: level } = api.user.getLevel.useQuery();
  const { data: dailyChallenges } = api.challenge.getDailyChallenges.useQuery();
  const { data: notifications } = api.notification.getAll.useQuery({
    limit: 5,
  });

  const completeHabit = api.habit.complete.useMutation({
    onSuccess: () => {
      setSelectedHabit(null);
      // Refetch data
      window.location.reload();
    },
  });

  if (status === "loading") {
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

  const handleCompleteHabit = (habitId: string) => {
    completeHabit.mutate({
      habitId,
      mood: 5, // Default mood
      energy: 5, // Default energy
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                🎯 HabitBuilder
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 font-bold text-white">
                  {session?.user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <span className="font-medium text-gray-700">
                  {session?.user?.name}
                </span>
              </div>
              <Link
                href="/api/auth/signout"
                className="text-gray-500 hover:text-gray-700"
              >
                Déconnexion
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats Overview */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                  <span className="text-sm font-bold text-white">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Niveau</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {level?.level || 1}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                  <span className="text-sm font-bold text-white">⭐</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Points</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.totalPoints || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500">
                  <span className="text-sm font-bold text-white">🔥</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Streak Moyen
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.averageStreak || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500">
                  <span className="text-sm font-bold text-white">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Habitudes</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.totalHabits || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Habitudes du jour */}
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white shadow">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Habitudes d'aujourd'hui
                  </h2>
                  <Link
                    href="/habits"
                    className="font-medium text-purple-600 hover:text-purple-700"
                  >
                    Gérer
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {habitsLoading ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-16 rounded-lg bg-gray-200"
                      ></div>
                    ))}
                  </div>
                ) : habits && habits.length > 0 ? (
                  <div className="space-y-4">
                    {habits.map((habit) => (
                      <div
                        key={habit.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <div
                            className="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
                            style={{ backgroundColor: habit.color + "20" }}
                          >
                            {habit.icon || "🎯"}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {habit.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Streak: {habit.currentStreak} jours
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCompleteHabit(habit.id)}
                          disabled={completeHabit.isPending}
                          className="rounded-lg bg-green-500 px-4 py-2 font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-50"
                        >
                          {completeHabit.isPending ? "..." : "Compléter"}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <div className="mb-4 text-6xl">🎯</div>
                    <h3 className="mb-2 text-lg font-medium text-gray-900">
                      Aucune habitude
                    </h3>
                    <p className="mb-4 text-gray-500">
                      Commencez par créer votre première habitude !
                    </p>
                    <Link
                      href="/habits/new"
                      className="rounded-lg bg-purple-600 px-6 py-3 font-medium text-white transition-colors hover:bg-purple-700"
                    >
                      Créer une habitude
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Défis quotidiens */}
            <div className="rounded-lg bg-white shadow">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Défis quotidiens
                </h2>
              </div>
              <div className="p-6">
                {dailyChallenges && dailyChallenges.length > 0 ? (
                  <div className="space-y-3">
                    {dailyChallenges.map((challenge) => (
                      <div
                        key={challenge.id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                      >
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {challenge.title}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {challenge.points} points
                          </p>
                        </div>
                        <button className="rounded bg-purple-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-purple-700">
                          {challenge.isCompleted ? "✅" : "Participer"}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Aucun défi disponible</p>
                )}
              </div>
            </div>

            {/* Notifications */}
            <div className="rounded-lg bg-white shadow">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Notifications
                </h2>
              </div>
              <div className="p-6">
                {notifications && notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`rounded-lg p-3 ${
                          notification.isRead ? "bg-gray-50" : "bg-blue-50"
                        }`}
                      >
                        <h3 className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {notification.message}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Aucune notification</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
