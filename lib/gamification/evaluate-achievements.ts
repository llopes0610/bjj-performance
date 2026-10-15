import {
  achievementCatalog,
  type AchievementCode,
  type AchievementRule,
} from "@/data/achievements/catalog";

export interface AchievementStats {
  /**
   * Treinos prescritos concluídos:
   * combinações únicas de
   * workout + semana do programa.
   */
  completedWorkouts: number;

  currentStreak: number;

  /**
   * true quando o atleta já concluiu a
   * semana final de algum programa.
   */
  hasCompletedProgram: boolean;
}

function isRuleSatisfied(
  rule: AchievementRule,
  stats: AchievementStats
) {
  switch (rule.type) {
    case "COMPLETED_WORKOUTS":
      return (
        stats.completedWorkouts >=
        rule.threshold
      );

    case "WEEKLY_STREAK":
      return (
        stats.currentStreak >=
        rule.threshold
      );

    case "PROGRAM_COMPLETED":
      return stats.hasCompletedProgram;
  }
}

/**
 * Retorna os códigos das conquistas que o
 * atleta cumpre com base nos fatos atuais.
 *
 * Não sabe quais já foram desbloqueadas:
 * a idempotência fica na camada de banco
 * (AthleteAchievement único por atleta).
 */
export function evaluateAchievements(
  stats: AchievementStats
): AchievementCode[] {
  return achievementCatalog
    .filter((achievement) =>
      isRuleSatisfied(
        achievement.rule,
        stats
      )
    )
    .map(
      (achievement) => achievement.code
    );
}

export interface AchievementProgress {
  current: number;
  target: number;
}

/**
 * Progresso do atleta em direção a uma
 * regra de conquista. Usado apenas para
 * exibição.
 */
export function getAchievementProgress(
  rule: AchievementRule,
  stats: AchievementStats
): AchievementProgress {
  switch (rule.type) {
    case "COMPLETED_WORKOUTS":
      return {
        current: Math.min(
          stats.completedWorkouts,
          rule.threshold
        ),
        target: rule.threshold,
      };

    case "WEEKLY_STREAK":
      return {
        current: Math.min(
          stats.currentStreak,
          rule.threshold
        ),
        target: rule.threshold,
      };

    case "PROGRAM_COMPLETED":
      return {
        current: stats.hasCompletedProgram
          ? 1
          : 0,
        target: 1,
      };
  }
}
