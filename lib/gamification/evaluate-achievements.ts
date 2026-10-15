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
