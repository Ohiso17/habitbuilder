import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "~/server/auth";

export default async function Home() {
  const session = await auth();

  // Rediriger vers le dashboard si l'utilisateur est connecté
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white">
          <h1 className="mb-8 text-6xl font-extrabold">🎯 HabitBuilder</h1>
          <p className="mb-4 text-2xl font-light">
            Transformez vos bonnes résolutions en habitudes durables
          </p>
          <p className="mb-12 text-lg opacity-90">
            L'application qui rend la construction d'habitudes addictive et
            sociale
          </p>

          <div className="mb-16 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/auth"
              className="rounded-lg bg-white px-8 py-4 text-lg font-semibold text-purple-600 transition-colors hover:bg-gray-100"
            >
              Commencer gratuitement
            </Link>
            <Link
              href="#features"
              className="rounded-lg border-2 border-white px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-white hover:text-purple-600"
            >
              Découvrir les fonctionnalités
            </Link>
          </div>

          {/* Features Section */}
          <div id="features" className="mx-auto max-w-6xl">
            <h2 className="mb-12 text-4xl font-bold">
              Pourquoi 92% des gens abandonnent leurs résolutions ?
            </h2>

            <div className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg bg-white/10 p-6 backdrop-blur-sm">
                <div className="mb-4 text-4xl">🎮</div>
                <h3 className="mb-3 text-xl font-semibold">Gamification</h3>
                <p className="text-gray-200">
                  Points, badges, streaks et niveaux pour rendre vos habitudes
                  addictives
                </p>
              </div>

              <div className="rounded-lg bg-white/10 p-6 backdrop-blur-sm">
                <div className="mb-4 text-4xl">👥</div>
                <h3 className="mb-3 text-xl font-semibold">Social</h3>
                <p className="text-gray-200">
                  Défiez vos amis, partagez vos succès et restez motivé ensemble
                </p>
              </div>

              <div className="rounded-lg bg-white/10 p-6 backdrop-blur-sm">
                <div className="mb-4 text-4xl">🧠</div>
                <h3 className="mb-3 text-xl font-semibold">IA Personnalisée</h3>
                <p className="text-gray-200">
                  Recommandations intelligentes et rappels adaptés à vos
                  habitudes
                </p>
              </div>

              <div className="rounded-lg bg-white/10 p-6 backdrop-blur-sm">
                <div className="mb-4 text-4xl">📊</div>
                <h3 className="mb-3 text-xl font-semibold">Analytics</h3>
                <p className="text-gray-200">
                  Suivez vos progrès avec des graphiques détaillés et des
                  insights
                </p>
              </div>

              <div className="rounded-lg bg-white/10 p-6 backdrop-blur-sm">
                <div className="mb-4 text-4xl">🏆</div>
                <h3 className="mb-3 text-xl font-semibold">Challenges</h3>
                <p className="text-gray-200">
                  Participez à des défis quotidiens et hebdomadaires pour rester
                  engagé
                </p>
              </div>

              <div className="rounded-lg bg-white/10 p-6 backdrop-blur-sm">
                <div className="mb-4 text-4xl">🔔</div>
                <h3 className="mb-3 text-xl font-semibold">Notifications</h3>
                <p className="text-gray-200">
                  Rappels intelligents pour ne jamais oublier vos habitudes
                  importantes
                </p>
              </div>
            </div>

            <div className="mb-16 rounded-lg bg-white/10 p-8 backdrop-blur-sm">
              <h3 className="mb-4 text-2xl font-bold">Comment ça marche ?</h3>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <div className="text-center">
                  <div className="mb-4 text-6xl">1️⃣</div>
                  <h4 className="mb-2 text-xl font-semibold">
                    Créez vos habitudes
                  </h4>
                  <p className="text-gray-200">
                    Définissez vos objectifs avec des icônes, couleurs et
                    difficultés
                  </p>
                </div>
                <div className="text-center">
                  <div className="mb-4 text-6xl">2️⃣</div>
                  <h4 className="mb-2 text-xl font-semibold">
                    Complétez quotidiennement
                  </h4>
                  <p className="text-gray-200">
                    Marquez vos habitudes comme terminées et gagnez des points
                  </p>
                </div>
                <div className="text-center">
                  <div className="mb-4 text-6xl">3️⃣</div>
                  <h4 className="mb-2 text-xl font-semibold">Restez motivé</h4>
                  <p className="text-gray-200">
                    Suivez vos streaks, débloquez des badges et défiez vos amis
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <h3 className="mb-6 text-3xl font-bold">
                Prêt à transformer votre vie ?
              </h3>
              <Link
                href="/auth"
                className="inline-block rounded-lg bg-white px-12 py-4 text-xl font-bold text-purple-600 transition-colors hover:bg-gray-100"
              >
                Commencer maintenant
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
