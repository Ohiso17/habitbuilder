"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import Link from "next/link";

export default function SocialPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "feed" | "friends" | "leaderboard"
  >("feed");
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendEmail, setFriendEmail] = useState("");

  const { data: feed } = api.social.getFeed.useQuery({ limit: 20 });
  const { data: friends } = api.social.getFriends.useQuery();
  const { data: leaderboard } = api.social.getLeaderboard.useQuery({
    limit: 50,
  });
  const { data: pendingRequests } = api.social.getPendingRequests.useQuery();

  const addFriend = api.social.addFriend.useMutation({
    onSuccess: () => {
      setShowAddFriend(false);
      setFriendEmail("");
    },
  });

  const acceptFriend = api.social.acceptFriend.useMutation({
    onSuccess: () => {
      // Refetch data
      window.location.reload();
    },
  });

  const rejectFriend = api.social.rejectFriend.useMutation({
    onSuccess: () => {
      // Refetch data
      window.location.reload();
    },
  });

  const likePost = api.social.likePost.useMutation({
    onSuccess: () => {
      // Refetch feed
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

  const handleAddFriend = (e: React.FormEvent) => {
    e.preventDefault();
    addFriend.mutate({ emailOrUsername: friendEmail });
  };

  const handleLikePost = (postId: string) => {
    likePost.mutate({ postId });
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return "À l'instant";
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays}j`;
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
              <h1 className="text-2xl font-bold text-gray-900">Social</h1>
            </div>
            <button
              onClick={() => setShowAddFriend(true)}
              className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white transition-colors hover:bg-purple-700"
            >
              + Ajouter un ami
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
                { id: "feed", label: "Feed", icon: "📱" },
                { id: "friends", label: "Amis", icon: "👥" },
                { id: "leaderboard", label: "Classement", icon: "🏆" },
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

        {/* Add Friend Modal */}
        {showAddFriend && (
          <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
            <div className="w-full max-w-md rounded-lg bg-white">
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Ajouter un ami
                  </h2>
                  <button
                    onClick={() => setShowAddFriend(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddFriend} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Email ou nom d&apos;utilisateur
                    </label>
                    <input
                      type="text"
                      value={friendEmail}
                      onChange={(e) => setFriendEmail(e.target.value)}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                      placeholder="ami@example.com ou nom_utilisateur"
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowAddFriend(false)}
                      className="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={addFriend.isPending}
                      className="rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700 disabled:opacity-50"
                    >
                      {addFriend.isPending ? "Envoi..." : "Envoyer"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {activeTab === "feed" && (
          <div className="space-y-6">
            {/* Pending Friend Requests */}
            {pendingRequests && pendingRequests.length > 0 && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-2 font-medium text-blue-900">
                  Demandes d&apos;amitié en attente
                </h3>
                <div className="space-y-2">
                  {pendingRequests.map((request: any) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between rounded-lg bg-white p-3"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 font-bold text-white">
                          {request.user.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {request.user.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            @{request.user.username}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            acceptFriend.mutate({ friendshipId: request.id })
                          }
                          className="rounded bg-green-500 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-green-600"
                        >
                          Accepter
                        </button>
                        <button
                          onClick={() =>
                            rejectFriend.mutate({ friendshipId: request.id })
                          }
                          className="rounded bg-red-500 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-red-600"
                        >
                          Refuser
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feed Posts */}
            {feed && feed.length > 0 ? (
              <div className="space-y-6">
                {feed.map((post: any) => (
                  <div key={post.id} className="rounded-lg bg-white shadow">
                    <div className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 font-bold text-white">
                          {post.user.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="mb-2 flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900">
                              {post.user.name}
                            </h3>
                            <span className="text-sm text-gray-500">
                              @{post.user.username}
                            </span>
                            <span className="text-sm text-gray-500">
                              • {getTimeAgo(post.createdAt)}
                            </span>
                          </div>

                          <p className="mb-4 text-gray-900">{post.content}</p>

                          {post.habit && (
                            <div className="mb-4 flex items-center space-x-2 rounded-lg bg-gray-50 p-3">
                              <div
                                className="flex h-8 w-8 items-center justify-center rounded-full text-lg"
                                style={{
                                  backgroundColor: post.habit.color + "20",
                                }}
                              >
                                {post.habit.icon || "🎯"}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {post.habit.title}
                                </p>
                                <p className="text-sm text-gray-500">
                                  Habitude complétée
                                </p>
                              </div>
                            </div>
                          )}

                          {post.image && (
                            <img
                              src={post.image}
                              alt="Post image"
                              className="mb-4 h-64 w-full rounded-lg object-cover"
                            />
                          )}

                          <div className="flex items-center space-x-6">
                            <button
                              onClick={() => handleLikePost(post.id)}
                              className="flex items-center space-x-2 text-gray-500 transition-colors hover:text-red-500"
                            >
                              <span>❤️</span>
                              <span>{post._count.likes}</span>
                            </button>
                            <button className="flex items-center space-x-2 text-gray-500 transition-colors hover:text-blue-500">
                              <span>💬</span>
                              <span>{post._count.comments}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="mb-4 text-6xl">📱</div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">
                  Aucun post
                </h3>
                <p className="text-gray-500">
                  Le feed sera rempli quand vos amis publieront des activités.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "friends" && (
          <div className="rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Mes amis ({friends?.length || 0})
              </h2>
            </div>
            <div className="p-6">
              {friends && friends.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {friends.map((friendship: any) => (
                    <div
                      key={friendship.id}
                      className="flex items-center space-x-4 rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 font-bold text-white">
                        {friendship.user.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {friendship.user.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          @{friendship.user.username}
                        </p>
                        <p className="text-sm text-gray-500">
                          Niveau {friendship.user.level} •{" "}
                          {friendship.user.totalPoints} pts
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="mb-4 text-6xl">👥</div>
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    Aucun ami
                  </h3>
                  <p className="mb-4 text-gray-500">
                    Ajoutez des amis pour voir leurs activités !
                  </p>
                  <button
                    onClick={() => setShowAddFriend(true)}
                    className="rounded-lg bg-purple-600 px-6 py-3 font-medium text-white transition-colors hover:bg-purple-700"
                  >
                    Ajouter un ami
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="rounded-lg bg-white shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Classement global
              </h2>
            </div>
            <div className="p-6">
              {leaderboard && leaderboard.length > 0 ? (
                <div className="space-y-4">
                  {leaderboard.map((user: any, index: number) => (
                    <div
                      key={user.id}
                      className={`flex items-center space-x-4 rounded-lg p-4 ${
                        index < 3
                          ? "bg-gradient-to-r from-yellow-50 to-orange-50"
                          : "bg-gray-50"
                      }`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 font-bold text-white">
                        {index + 1}
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 font-bold text-white">
                        {user.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {user.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          @{user.username}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          {user.totalPoints} pts
                        </p>
                        <p className="text-sm text-gray-500">
                          Niveau {user.level}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="mb-4 text-6xl">🏆</div>
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    Aucun classement
                  </h3>
                  <p className="text-gray-500">
                    Le classement sera disponible quand il y aura plus
                    d&apos;utilisateurs.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
