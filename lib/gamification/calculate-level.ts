export interface GamificationLevel {
  level: number;

  /**
   * XP acumulado durante toda a vida do atleta
   * dentro da plataforma.
   */
  totalXp: number;

  /**
   * XP conquistado dentro do nível atual.
   */
  currentLevelXp: number;

  /**
   * Quantidade total de XP necessária para
   * completar o nível atual.
   */
  xpRequiredForLevel: number;

  /**
   * XP restante para chegar ao próximo nível.
   */
  xpToNextLevel: number;

  /**
   * Progresso do nível atual entre 0 e 100.
   */
  progressPercentage: number;

  /**
   * XP total acumulado necessário para entrar
   * no nível atual.
   */
  currentLevelStartXp: number;

  /**
   * XP total acumulado necessário para alcançar
   * o próximo nível.
   */
  nextLevelTotalXp: number;
}

/**
 * Quantidade de XP necessária para avançar
 * do nível informado para o próximo.
 *
 * Curva:
 *
 * Nível 1 -> 2 = 500 XP
 * Nível 2 -> 3 = 600 XP
 * Nível 3 -> 4 = 700 XP
 * Nível 4 -> 5 = 800 XP
 *
 * Cada novo nível exige 100 XP adicionais.
 */
export function getXpRequiredForLevel(
  level: number
) {
  const normalizedLevel = Math.max(
    1,
    Math.floor(level)
  );

  return (
    500 +
    (normalizedLevel - 1) * 100
  );
}

/**
 * Retorna o XP total acumulado necessário
 * para entrar em determinado nível.
 *
 * Exemplos:
 *
 * Nível 1 = 0 XP
 * Nível 2 = 500 XP
 * Nível 3 = 1.100 XP
 * Nível 4 = 1.800 XP
 * Nível 5 = 2.600 XP
 */
export function getTotalXpForLevel(
  level: number
) {
  const normalizedLevel = Math.max(
    1,
    Math.floor(level)
  );

  if (normalizedLevel === 1) {
    return 0;
  }

  const completedLevels =
    normalizedLevel - 1;

  return (
    completedLevels * 500 +
    ((completedLevels - 1) *
      completedLevels *
      100) /
      2
  );
}

/**
 * Calcula todo o estado de nível do atleta
 * utilizando somente o XP total acumulado.
 *
 * O nível não precisa ser persistido no banco.
 * Dessa forma, totalXp permanece como a única
 * fonte de verdade.
 */
export function calculateLevel(
  totalXp: number
): GamificationLevel {
  const normalizedTotalXp = Math.max(
    0,
    Math.floor(totalXp)
  );

  let level = 1;

  while (
    normalizedTotalXp >=
    getTotalXpForLevel(level + 1)
  ) {
    level += 1;
  }

  const currentLevelStartXp =
    getTotalXpForLevel(level);

  const nextLevelTotalXp =
    getTotalXpForLevel(level + 1);

  const currentLevelXp =
    normalizedTotalXp -
    currentLevelStartXp;

  const xpRequiredForLevel =
    nextLevelTotalXp -
    currentLevelStartXp;

  const xpToNextLevel = Math.max(
    0,
    nextLevelTotalXp -
      normalizedTotalXp
  );

  const progressPercentage =
    xpRequiredForLevel > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Math.round(
              (currentLevelXp /
                xpRequiredForLevel) *
                100
            )
          )
        )
      : 100;

  return {
    level,
    totalXp: normalizedTotalXp,
    currentLevelXp,
    xpRequiredForLevel,
    xpToNextLevel,
    progressPercentage,
    currentLevelStartXp,
    nextLevelTotalXp,
  };
}