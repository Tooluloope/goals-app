import confetti from 'canvas-confetti';

/**
 * Triggers a celebration confetti animation
 * Used when a project/goal is marked as completed
 */
export function triggerCelebration() {
  const duration = 3000;
  const animationEnd = Date.now() + duration;

  const defaults = {
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 9999,
  };

  function randomInRange(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);

    // Burst from left side
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#6366f1', '#8b5cf6', '#a855f7', '#22c55e', '#eab308'],
    });

    // Burst from right side
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#6366f1', '#8b5cf6', '#a855f7', '#22c55e', '#eab308'],
    });
  }, 250);
}

/**
 * Triggers a single burst of confetti from the center
 * Used for smaller celebrations
 */
export function triggerSmallCelebration() {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#6366f1', '#8b5cf6', '#a855f7', '#22c55e', '#eab308'],
    zIndex: 9999,
  });
}
