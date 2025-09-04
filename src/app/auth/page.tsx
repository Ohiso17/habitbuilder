"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    username: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const signUpMutation = api.user.signUp.useMutation({
    onSuccess: () => {
      setIsLogin(true);
      setError("");
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (isLogin) {
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          setError("Email ou mot de passe incorrect");
        } else {
          router.push("/dashboard");
        }
      } else {
        await signUpMutation.mutateAsync({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          username: formData.username,
        });
      }
    } catch (error) {
      console.error("Auth error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            🎯 HabitBuilder
          </h1>
          <p className="text-gray-600">
            {isLogin ? "Connectez-vous à votre compte" : "Créez votre compte"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Nom complet
                </label>
                <input
                  type="text"
                  required={!isLogin}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                  placeholder="Votre nom"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Nom d&apos;utilisateur
                </label>
                <input
                  type="text"
                  required={!isLogin}
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-purple-500"
                  placeholder="nom_utilisateur"
                />
              </div>
            </>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-purple-500"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Mot de passe
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-purple-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-4 py-3 font-semibold text-white transition-all duration-200 hover:from-purple-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading
              ? "Chargement..."
              : isLogin
                ? "Se connecter"
                : "S'inscrire"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setFormData({ name: "", email: "", password: "", username: "" });
            }}
            className="font-medium text-purple-600 hover:text-purple-700"
          >
            {isLogin
              ? "Pas de compte ? Créez-en un"
              : "Déjà un compte ? Connectez-vous"}
          </button>
        </div>

        {process.env.AUTH_DISCORD_ID && process.env.AUTH_DISCORD_SECRET && (
          <div className="mt-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">
                  Ou continuez avec
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => signIn("discord")}
                className="w-full rounded-lg bg-[#5865F2] px-4 py-3 font-semibold text-white transition-colors duration-200 hover:bg-[#4752C4]"
              >
                Discord
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
