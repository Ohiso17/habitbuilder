"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function ChallengesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"all" | "my" | "joined">("all");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Only run queries when authenticated and mounted
  const [mounted, setMounted] = useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { data: challenges, isLoading } = api.challenge.getAll.useQuery(
    {
      type: activeTab,
      limit: 20,
    },
    {
      enabled: status === "authenticated" && mounted,
    }
  );

  const createChallenge = api.challenge.create.useMutation({
    onSuccess: () => {
      setShowCreateForm(false);
      // Refetch data
      window.location.reload();
    },
  });

  const joinChallenge = api.challenge.join.useMutation({
    onSuccess: () => {
      // Refetch data
      window.location.reload();
    },
  });

  if (status === "loading" || !mounted) {
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

  const handleCreateChallenge = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    createChallenge.mutate({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      type: formData.get("type") as
        | "STREAK"
        | "POINTS"
        | "COMPLETION"
        | "TIME_BASED",
      goal: parseInt(formData.get("goal") as string),
      duration: parseInt(formData.get("duration") as string),
      points: parseInt(formData.get("points") as string),
      isPublic: formData.get("isPublic") === "on",
    });
  };

  const handleJoinChallenge = (challengeId: string) => {
    joinChallenge.mutate({ challengeId });
  };

  const getChallengeTypeLabel = (type: string) => {
    const types = {
      STREAK: "Streak",
      POINTS: "Points",
      COMPLETION: "Complétion",
      TIME_BASED: "Temps",
    };
    return types[type as keyof typeof types] || type;
  };

  const getChallengeTypeIcon = (type: string) => {
    const icons = {
      STREAK: "🔥",
      POINTS: "⭐",
      COMPLETION: "✅",
      TIME_BASED: "⏰",
    };
    return icons[type as keyof typeof icons] || "🎯";
  };

  const isChallengeActive = (endDate: Date) => {
    return new Date() < endDate;
  };

  const getTimeRemaining = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} jours restants` : "Terminé";
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
              <h1 className="text-2xl font-bold text-gray-900">Challenges</h1>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700"
            >
              + Créer un challenge
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="mb-6 rounded-lg bg-white shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: "all", label: "Tous les challenges", icon: "🌍" },
                { id: "my", label: "Mes challenges", icon: "👤" },
                { id: "joined", label: "Challenges rejoints", icon: "🤝" },
              ].map((tab: { id: string; label: string; icon: string }) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`border-b-2 px-1 py-4 text-sm font-medium ${
                    activeTab === tab.id
                      ? "border-purple-500 text-purple-600"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Create Challenge Modal */}
        {showCreateForm && (
          <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
            <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white">
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Créer un challenge
                  </h2>
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateChallenge} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Titre *
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                      placeholder="Ex: 30 jours de méditation"
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
                      placeholder="Décrivez votre challenge..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Type
                      </label>
                      <select
                        name="type"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="STREAK">Streak</option>
                        <option value="POINTS">Points</option>
                        <option value="COMPLETION">Complétion</option>
                        <option value="TIME_BASED">Temps</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Objectif
                      </label>
                      <input
                        type="number"
                        name="goal"
                        required
                        min="1"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                        placeholder="30"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Durée (jours)
                      </label>
                      <input
                        type="number"
                        name="duration"
                        required
                        min="1"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                        placeholder="30"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Points de récompense
                      </label>
                      <input
                        type="number"
                        name="points"
                        required
                        min="1"
                        defaultValue="100"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isPublic"
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <label className="ml-2 block text-sm text-gray-700">
                      Rendre ce challenge public
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
                      disabled={createChallenge.isPending}
                      className="rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
                    >
                      {createChallenge.isPending ? "Création..." : "Créer"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Challenges List */}
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-lg bg-gray-200"></div>
            ))}
          </div>
        ) : challenges && challenges.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {challenges.map((challenge: any) => (
              <div
                key={challenge.id}
                className="rounded-lg bg-white shadow transition-shadow hover:shadow-lg"
              >
                <div className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">
                        {getChallengeTypeIcon(challenge.type)}
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {challenge.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {getChallengeTypeLabel(challenge.type)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {getTimeRemaining(challenge.endDate)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {challenge._count.participants} participants
                      </p>
                    </div>
                  </div>

                  {challenge.description && (
                    <p className="mb-4 text-sm text-gray-600">
                      {challenge.description}
                    </p>
                  )}

                  <div className="mb-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Objectif</span>
                      <span className="font-medium">{challenge.goal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Durée</span>
                      <span className="font-medium">
                        {challenge.duration} jours
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Récompense</span>
                      <span className="font-medium">
                        {challenge.points} pts
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-600 text-xs font-bold text-white">
                        {challenge.creator.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-600">
                        {challenge.creator.name}
                      </span>
                    </div>

                    {isChallengeActive(challenge.endDate) && (
                      <button
                        onClick={() => handleJoinChallenge(challenge.id)}
                        disabled={joinChallenge.isPending}
                        className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
                      >
                        {joinChallenge.isPending ? "..." : "Rejoindre"}
                      </button>
                    )}
                  </div>

                  {challenge.userParticipation && (
                    <div className="mt-4 rounded-lg bg-green-50 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-800">
                          Vous participez à ce challenge
                        </span>
                        <span className="text-sm text-green-600">
                          Progrès: {challenge.userParticipation.progress}/
                          {challenge.goal}
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full rounded-full bg-green-200">
                        <div
                          className="h-2 rounded-full bg-green-600 transition-all duration-300"
                          style={{
                            width: `${Math.min(
                              (challenge.userParticipation.progress /
                                challenge.goal) *
                                100,
                              100,
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="mb-4 text-6xl">🎯</div>
            <h3 className="mb-2 text-xl font-semibold text-gray-900">
              Aucun challenge
            </h3>
            <p className="mb-6 text-gray-500">
              {activeTab === "all"
                ? "Aucun challenge disponible pour le moment."
                : activeTab === "my"
                  ? "Vous n'avez créé aucun challenge."
                  : "Vous n'avez rejoint aucun challenge."}
            </p>
            {activeTab === "all" && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="rounded-lg bg-purple-600 px-6 py-3 font-medium text-white transition-colors hover:bg-purple-700"
              >
                Créer le premier challenge
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
