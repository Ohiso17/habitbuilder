import { db } from "~/server/db";

export class GamificationService {
  // Calculer et mettre à jour le streak d'une habitude
  static async updateHabitStreak(habitId: string, userId: string) {
    const habit = await db.habit.findFirst({
      where: { id: habitId, userId },
    });

    if (!habit) return null;

    // Récupérer les completions des 365 derniers jours
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    const completions = await db.habitCompletion.findMany({
      where: {
        habitId,
        completedAt: { gte: oneYearAgo },
      },
      orderBy: { completedAt: "desc" },
    });

    // Calculer le streak actuel
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);

      const hasCompletion = completions.some(
        (completion) =>
          completion.completedAt.toDateString() === checkDate.toDateString(),
      );

      if (hasCompletion) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculer le streak le plus long
    let longestStreak = 0;
    let tempStreak = 0;

    for (let i = completions.length - 1; i >= 0; i--) {
      if (i === completions.length - 1) {
        tempStreak = 1;
      } else {
        const currentDate = new Date(completions[i]!.completedAt);
        const previousDate = new Date(completions[i + 1]!.completedAt);
        const daysDiff = Math.floor(
          (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Mettre à jour l'habitude
    const updatedHabit = await db.habit.update({
      where: { id: habitId },
      data: {
        currentStreak,
        longestStreak: Math.max(longestStreak, habit.longestStreak),
      },
    });

    return updatedHabit;
  }

  // Vérifier et attribuer des badges
  static async checkAndAwardBadges(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        habits: true,
        habitCompletions: {
          where: {
            completedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 derniers jours
            },
          },
        },
        badges: {
          include: { badge: true },
        },
      },
    });

    if (!user) return [];

    const awardedBadges = [];

    // Badge "Early Bird" - Compléter une habitude avant 7h
    const earlyBirdCompletions = await db.habitCompletion.findMany({
      where: {
        userId,
        completedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 derniers jours
        },
      },
    });

    const hasEarlyBird = earlyBirdCompletions.some(
      (completion) => completion.completedAt.getHours() < 7,
    );

    if (hasEarlyBird) {
      const earlyBirdBadge = await this.awardBadge(
        userId,
        "EARLY_BIRD",
        "Early Bird",
        "Complété une habitude avant 7h",
        "🌅",
        "TIME",
      );
      if (earlyBirdBadge) awardedBadges.push(earlyBirdBadge);
    }

    // Badge "Consistency King" - Streak de 30 jours
    const has30DayStreak = user.habits.some((habit) => habit.currentStreak >= 30);
    if (has30DayStreak) {
      const consistencyBadge = await this.awardBadge(
        userId,
        "CONSISTENCY_KING",
        "Consistency King",
        "Maintenu un streak de 30 jours",
        "👑",
        "CONSISTENCY",
      );
      if (consistencyBadge) awardedBadges.push(consistencyBadge);
    }

    // Badge "Point Master" - 1000 points
    if (user.totalPoints >= 1000) {
      const pointMasterBadge = await this.awardBadge(
        userId,
        "POINT_MASTER",
        "Point Master",
        "Atteint 1000 points",
        "⭐",
        "POINTS",
      );
      if (pointMasterBadge) awardedBadges.push(pointMasterBadge);
    }

    // Badge "Weekend Warrior" - Compléter des habitudes le weekend
    const weekendCompletions = await db.habitCompletion.findMany({
      where: {
        userId,
        completedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const hasWeekendCompletions = weekendCompletions.some(
      (completion) => {
        const day = completion.completedAt.getDay();
        return day === 0 || day === 6; // Dimanche ou Samedi
      },
    );

    if (hasWeekendCompletions) {
      const weekendBadge = await this.awardBadge(
        userId,
        "WEEKEND_WARRIOR",
        "Weekend Warrior",
        "Complété des habitudes le weekend",
        "💪",
        "CONSISTENCY",
      );
      if (weekendBadge) awardedBadges.push(weekendBadge);
    }

    return awardedBadges;
  }

  // Attribuer un badge à un utilisateur
  private static async awardBadge(
    userId: string,
    badgeKey: string,
    name: string,
    description: string,
    icon: string,
    category: string,
  ) {
    // Vérifier si l'utilisateur a déjà ce badge
    const existingBadge = await db.userBadge.findFirst({
      where: {
        userId,
        badge: { name },
      },
    });

    if (existingBadge) return null;

    // Trouver ou créer le badge
    let badge = await db.badge.findFirst({
      where: { name },
    });

    if (!badge) {
      badge = await db.badge.create({
        data: {
          name,
          description,
          icon,
          category: category as any,
          rarity: "COMMON",
          points: 50,
        },
      });
    }

    // Attribuer le badge à l'utilisateur
    const userBadge = await db.userBadge.create({
      data: {
        userId,
        badgeId: badge.id,
      },
    });

    // Donner des points bonus
    await db.user.update({
      where: { id: userId },
      data: {
        totalPoints: { increment: badge.points },
      },
    });

    // Créer une notification
    await db.notification.create({
      data: {
        userId,
        type: "BADGE_EARNED",
        title: "Nouveau Badge Débloqué !",
        message: `Félicitations ! Vous avez débloqué le badge "${name}"`,
        data: {
          badgeId: badge.id,
          badgeName: name,
          badgeIcon: icon,
        },
      },
    });

    return userBadge;
  }

  // Calculer le niveau de l'utilisateur basé sur ses points
  static async updateUserLevel(userId: string) {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { totalPoints: true, level: true },
    });

    if (!user) return null;

    // Calculer le nouveau niveau (1000 points par niveau)
    const newLevel = Math.floor(user.totalPoints / 1000) + 1;

    if (newLevel > user.level) {
      const updatedUser = await db.user.update({
        where: { id: userId },
        data: { level: newLevel },
      });

      // Créer une notification de niveau
      await db.notification.create({
        data: {
          userId,
          type: "ACHIEVEMENT",
          title: "Niveau Atteint !",
          message: `Félicitations ! Vous êtes maintenant niveau ${newLevel}`,
          data: {
            newLevel,
            oldLevel: user.level,
          },
        },
      });

      return updatedUser;
    }

    return null;
  }

  // Générer des défis quotidiens
  static async generateDailyChallenges() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Vérifier si les défis du jour existent déjà
    const existingChallenges = await db.dailyChallenge.findMany({
      where: {
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (existingChallenges.length > 0) return existingChallenges;

    const challenges = [
      {
        title: "Triple Threat",
        description: "Complétez 3 habitudes avant midi",
        type: "TRIPLE_THREAT" as const,
        points: 100,
      },
      {
        title: "Weekend Warrior",
        description: "Maintenez toutes vos habitudes ce weekend",
        type: "WEEKEND_WARRIOR" as const,
        points: 150,
      },
      {
        title: "Early Bird Special",
        description: "Complétez une habitude avant 7h",
        type: "EARLY_BIRD" as const,
        points: 75,
      },
      {
        title: "Social Butterfly",
        description: "Complétez une habitude avec un ami",
        type: "SOCIAL_BUTTERFLY" as const,
        points: 125,
      },
    ];

    const createdChallenges = await Promise.all(
      challenges.map((challenge) =>
        db.dailyChallenge.create({
          data: {
            ...challenge,
            date: today,
          },
        }),
      ),
    );

    return createdChallenges;
  }

  // Vérifier les streaks en danger
  static async checkStreaksInDanger() {
    const users = await db.user.findMany({
      include: {
        habits: {
          where: { isActive: true },
        },
      },
    });

    const notifications = [];

    for (const user of users) {
      for (const habit of user.habits) {
        // Vérifier si l'habitude n'a pas été complétée aujourd'hui
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayCompletion = await db.habitCompletion.findFirst({
          where: {
            habitId: habit.id,
            completedAt: {
              gte: today,
              lt: tomorrow,
            },
          },
        });

        if (!todayCompletion && habit.currentStreak > 0) {
          // Vérifier si c'est le soir (après 20h)
          const now = new Date();
          if (now.getHours() >= 20) {
            const notification = await db.notification.create({
              data: {
                userId: user.id,
                type: "STREAK_REMINDER",
                title: "Streak en Danger !",
                message: `Votre streak de ${habit.currentStreak} jours pour "${habit.title}" est en danger !`,
                data: {
                  habitId: habit.id,
                  habitTitle: habit.title,
                  currentStreak: habit.currentStreak,
                },
              },
            });
            notifications.push(notification);
          }
        }
      }
    }

    return notifications;
  }
}
