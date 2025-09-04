import { db } from "~/server/db";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Seeding database...");

  // Créer des utilisateurs de test
  const hashedPassword = await bcrypt.hash("password123", 12);

  const user1 = await db.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      name: "Test User",
      username: "testuser",
      password: hashedPassword,
      level: 3,
      totalPoints: 1500,
      currentStreak: 7,
      longestStreak: 15,
    },
  });

  const user2 = await db.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
      username: "demouser",
      password: hashedPassword,
      level: 2,
      totalPoints: 800,
      currentStreak: 3,
      longestStreak: 8,
    },
  });

  console.log("✅ Users created");

  // Créer des habitudes de test
  const habits = await Promise.all([
    db.habit.create({
      data: {
        title: "Méditation quotidienne",
        description: "10 minutes de méditation chaque matin",
        icon: "🧘‍♀️",
        color: "#8B5CF6",
        difficulty: 2,
        points: 20,
        frequency: "DAILY",
        timeOfDay: "morning",
        reminderTime: "07:00",
        isPublic: true,
        hashtags: ["méditation", "bien-être", "mindfulness"],
        userId: user1.id,
        currentStreak: 7,
        longestStreak: 15,
        totalCompletions: 45,
        successRate: 85.5,
      },
    }),
    db.habit.create({
      data: {
        title: "Lecture",
        description: "Lire 30 pages par jour",
        icon: "📚",
        color: "#3B82F6",
        difficulty: 3,
        points: 30,
        frequency: "DAILY",
        timeOfDay: "evening",
        reminderTime: "20:00",
        isPublic: true,
        hashtags: ["lecture", "apprentissage", "développement"],
        userId: user1.id,
        currentStreak: 5,
        longestStreak: 12,
        totalCompletions: 28,
        successRate: 70.0,
      },
    }),
    db.habit.create({
      data: {
        title: "Exercice physique",
        description: "30 minutes d'exercice",
        icon: "💪",
        color: "#10B981",
        difficulty: 4,
        points: 40,
        frequency: "DAILY",
        timeOfDay: "afternoon",
        reminderTime: "18:00",
        isPublic: true,
        hashtags: ["sport", "santé", "fitness"],
        userId: user1.id,
        currentStreak: 3,
        longestStreak: 10,
        totalCompletions: 22,
        successRate: 65.0,
      },
    }),
    db.habit.create({
      data: {
        title: "Journaling",
        description: "Écrire dans son journal",
        icon: "📝",
        color: "#F59E0B",
        difficulty: 2,
        points: 20,
        frequency: "DAILY",
        timeOfDay: "evening",
        reminderTime: "21:00",
        isPublic: true,
        hashtags: ["écriture", "réflexion", "développement"],
        userId: user2.id,
        currentStreak: 2,
        longestStreak: 5,
        totalCompletions: 15,
        successRate: 60.0,
      },
    }),
  ]);

  console.log("✅ Habits created");

  // Créer des badges
  const badges = await Promise.all([
    db.badge.create({
      data: {
        name: "Early Bird",
        description: "Complété une habitude avant 7h",
        icon: "🌅",
        rarity: "COMMON",
        category: "TIME",
        points: 50,
        requirement: 1,
      },
    }),
    db.badge.create({
      data: {
        name: "Consistency King",
        description: "Maintenu un streak de 30 jours",
        icon: "👑",
        rarity: "RARE",
        category: "CONSISTENCY",
        points: 200,
        requirement: 30,
      },
    }),
    db.badge.create({
      data: {
        name: "Point Master",
        description: "Atteint 1000 points",
        icon: "⭐",
        rarity: "EPIC",
        category: "POINTS",
        points: 100,
        requirement: 1000,
      },
    }),
    db.badge.create({
      data: {
        name: "Weekend Warrior",
        description: "Complété des habitudes le weekend",
        icon: "💪",
        rarity: "COMMON",
        category: "CONSISTENCY",
        points: 75,
        requirement: 1,
      },
    }),
  ]);

  console.log("✅ Badges created");

  // Attribuer des badges aux utilisateurs
  await db.userBadge.create({
    data: {
      userId: user1.id,
      badgeId: badges[0]!.id,
      isEquipped: true,
    },
  });

  await db.userBadge.create({
    data: {
      userId: user1.id,
      badgeId: badges[3]!.id,
      isEquipped: false,
    },
  });

  console.log("✅ User badges created");

  // Créer des défis quotidiens
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dailyChallenges = await Promise.all([
    db.dailyChallenge.create({
      data: {
        title: "Triple Threat",
        description: "Complétez 3 habitudes avant midi",
        type: "TRIPLE_THREAT",
        points: 100,
        date: today,
      },
    }),
    db.dailyChallenge.create({
      data: {
        title: "Weekend Warrior",
        description: "Maintenez toutes vos habitudes ce weekend",
        type: "WEEKEND_WARRIOR",
        points: 150,
        date: today,
      },
    }),
    db.dailyChallenge.create({
      data: {
        title: "Early Bird Special",
        description: "Complétez une habitude avant 7h",
        type: "EARLY_BIRD",
        points: 75,
        date: today,
      },
    }),
  ]);

  console.log("✅ Daily challenges created");

  // Créer des posts sociaux
  const posts = await Promise.all([
    db.post.create({
      data: {
        content: "🔥 Nouveau streak de 7 jours pour la méditation ! #mindfulness #streak",
        type: "ACHIEVEMENT",
        userId: user1.id,
        habitId: habits[0]!.id,
        isPublic: true,
      },
    }),
    db.post.create({
      data: {
        content: "📚 Terminé un livre cette semaine ! La lecture quotidienne paie 💪",
        type: "MILESTONE",
        userId: user1.id,
        habitId: habits[1]!.id,
        isPublic: true,
      },
    }),
    db.post.create({
      data: {
        content: "💪 Premier jour d'exercice ! Ça commence fort 💯",
        type: "HABIT_COMPLETED",
        userId: user2.id,
        habitId: habits[3]!.id,
        isPublic: true,
      },
    }),
  ]);

  console.log("✅ Posts created");

  // Créer des notifications
  await db.notification.create({
    data: {
      userId: user1.id,
      type: "BADGE_EARNED",
      title: "Nouveau Badge Débloqué !",
      message: "Félicitations ! Vous avez débloqué le badge 'Early Bird'",
      data: {
        badgeId: badges[0]!.id,
        badgeName: "Early Bird",
        badgeIcon: "🌅",
      },
    },
  });

  await db.notification.create({
    data: {
      userId: user1.id,
      type: "STREAK_REMINDER",
      title: "Streak en Danger !",
      message: "Votre streak de 7 jours pour 'Méditation quotidienne' est en danger !",
      data: {
        habitId: habits[0]!.id,
        habitTitle: "Méditation quotidienne",
        currentStreak: 7,
      },
    },
  });

  console.log("✅ Notifications created");

  console.log("🎉 Database seeded successfully!");
}

seed()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
