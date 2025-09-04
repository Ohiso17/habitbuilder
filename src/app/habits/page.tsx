"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function HabitsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const { data: habits, isLoading, refetch } = api.habit.getAll.useQuery(undefined, {
    enabled: status === "authenticated",
  });

  const createHabit = api.habit.create.useMutation({
    onSuccess: () => {
      setShowCreateForm(false);
      void refetch();
    },
  });

  const deleteHabit = api.habit.delete.useMutation({
    onSuccess: () => {
      void refetch();
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

  const handleCreateHabit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createHabit.mutate({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      icon: formData.get("icon") as string,
      color: formData.get("color") as string,
      difficulty: parseInt(formData.get("difficulty") as string),
      frequency: formData.get("frequency") as
        | "DAILY"
        | "WEEKLY"
        | "MONTHLY"
        | "CUSTOM",
      timeOfDay: formData.get("timeOfDay") as string,
      reminderTime: formData.get("reminderTime") as string,
      isPublic: formData.get("isPublic") === "on",
      hashtags:
        (formData.get("hashtags") as string)
          ?.split(",")
          .map((tag) => tag.trim())
          .filter(Boolean) || [],
    });
  };

  const handleDeleteHabit = (habitId: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette habitude ?")) {
      deleteHabit.mutate({ id: habitId });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-500 hover:text-gray-700"
              >
                ← Retour
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">
                Mes Habitudes
              </h1>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700"
            >
              + Nouvelle habitude
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Create Habit Modal */}
        {showCreateForm && (
          <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
            <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white">
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Créer une habitude
                  </h2>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateHabit} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Titre *
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                      placeholder="Ex: Méditation quotidienne"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                      placeholder="Décrivez votre habitude..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Icône
                      </label>
                      <input
                        type="text"
                        name="icon"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                        placeholder="🧘‍♀️"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Couleur
                      </label>
                      <input
                        type="color"
                        name="color"
                        defaultValue="#3B82F6"
                        className="h-10 w-full rounded-lg border border-gray-300 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Difficulté
                      </label>
                      <select
                        name="difficulty"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                      >
                        <option value={1}>⭐ Facile</option>
                        <option value={2}>⭐⭐ Moyen</option>
                        <option value={3}>⭐⭐⭐ Difficile</option>
                        <option value={4}>⭐⭐⭐⭐ Très difficile</option>
                        <option value={5}>⭐⭐⭐⭐⭐ Expert</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Fréquence
                      </label>
                      <select
                        name="frequency"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="DAILY">Quotidien</option>
                        <option value="WEEKLY">Hebdomadaire</option>
                        <option value="MONTHLY">Mensuel</option>
                        <option value="CUSTOM">Personnalisé</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Moment de la journée
                      </label>
                      <select
                        name="timeOfDay"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">N&apos;importe quand</option>
                        <option value="morning">Matin</option>
                        <option value="afternoon">Après-midi</option>
                        <option value="evening">Soir</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Heure de rappel
                      </label>
                      <input
                        type="time"
                        name="reminderTime"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Hashtags (séparés par des virgules)
                    </label>
                    <input
                      type="text"
                      name="hashtags"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                      placeholder="santé, bien-être, méditation"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isPublic"
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                      Rendre cette habitude publique
                    </label>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={createHabit.isPending}
                      className="rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
                    >
                      {createHabit.isPending ? "Création..." : "Créer"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Habits List */}
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-gray-200"></div>
            ))}
          </div>
        ) : habits && habits.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {habits.map((habit) => (
              <div
                key={habit.id}
                className="rounded-lg bg-white shadow transition-shadow hover:shadow-lg"
              >
                <div className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
                      style={{ backgroundColor: habit.color + "20" }}
                    >
                      {habit.icon || "🎯"}
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        href={`/habits/${habit.id}`}
                        className="text-purple-600 hover:text-purple-700"
                      >
                        Voir
                      </Link>
                      <button
                        onClick={() => handleDeleteHabit(habit.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>

                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    {habit.title}
                  </h3>

                  {habit.description && (
                    <p className="mb-4 text-sm text-gray-600">
                      {habit.description}
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Streak actuel</span>
                      <span className="font-medium">
                        {habit.currentStreak} jours
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Meilleur streak</span>
                      <span className="font-medium">
                        {habit.longestStreak} jours
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Complétions</span>
                      <span className="font-medium">
                        {habit.totalCompletions}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">
                        Points par completion
                      </span>
                      <span className="font-medium">{habit.points}</span>
                    </div>
                  </div>

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
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="mb-4 text-6xl">🎯</div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">
              Aucune habitude
            </h3>
            <p className="mb-6 text-gray-500">
              Commencez par créer votre première habitude !
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="rounded-lg bg-purple-600 px-6 py-3 font-medium text-white transition-colors hover:bg-purple-700"
            >
              Créer ma première habitude
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
