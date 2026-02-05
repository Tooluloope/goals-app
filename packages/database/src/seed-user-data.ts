import { config } from 'dotenv';
import path from 'path';

// Load .env from monorepo root
config({ path: path.resolve(__dirname, '../../../.env') });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to get dates
const today = new Date();
const getDate = (daysAgo: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() - daysAgo);
  return date;
};

const getMonday = (weeksAgo: number) => {
  const date = new Date(today);
  date.setDate(date.getDate() - date.getDay() + 1 - weeksAgo * 7);
  date.setHours(0, 0, 0, 0);
  return date;
};

async function main() {
  console.log('Looking for user tolu@email.com...');

  // Find the user
  const user = await prisma.user.findUnique({
    where: { email: 'tolu@email.com' },
  });

  if (!user) {
    console.error('User tolu@email.com not found!');
    process.exit(1);
  }

  console.log('Found user:', user.name);

  // Get their workspace
  const workspace = await prisma.workspace.findFirst({
    where: { ownerId: user.id },
  });

  if (!workspace) {
    console.error('No workspace found for user!');
    process.exit(1);
  }

  console.log('Found workspace:', workspace.name);

  // ============================================================
  // PROJECTS (GOALS)
  // ============================================================
  console.log('\nCreating projects...');

  const projects = [
    {
      id: 'proj-fitness-2026',
      name: 'Complete 100 Workouts in 2026',
      statusId: 'status-doing',
      areaIds: ['area-health'],
      priorityId: 'priority-high',
      cadenceId: 'cadence-weekly',
      confidenceId: 'confidence-high',
      startDate: new Date('2026-01-01'),
      targetDate: new Date('2026-12-31'),
      objective:
        'Build a consistent workout routine by completing 100 workouts this year. Focus on strength training 3x/week.',
      successMetric: '100 logged workouts with progressive overload',
    },
    {
      id: 'proj-read-books',
      name: 'Read 24 Books',
      statusId: 'status-doing',
      areaIds: ['area-learning', 'area-personal'],
      priorityId: 'priority-medium',
      cadenceId: 'cadence-monthly',
      confidenceId: 'confidence-high',
      startDate: new Date('2026-01-01'),
      targetDate: new Date('2026-12-31'),
      objective: 'Read 2 books per month - mix of fiction and non-fiction to expand knowledge.',
      successMetric: '24 books completed with notes',
    },
    {
      id: 'proj-savings',
      name: 'Build $10K Emergency Fund',
      statusId: 'status-doing',
      areaIds: ['area-finance'],
      priorityId: 'priority-high',
      cadenceId: 'cadence-monthly',
      confidenceId: 'confidence-medium',
      startDate: new Date('2026-01-01'),
      targetDate: new Date('2026-06-30'),
      objective: 'Save $10,000 in emergency fund by mid-year through automatic transfers.',
      successMetric: '$10,000 in savings account',
    },
    {
      id: 'proj-meditation',
      name: 'Daily Meditation Practice',
      statusId: 'status-doing',
      areaIds: ['area-faith', 'area-health'],
      priorityId: 'priority-medium',
      cadenceId: 'cadence-weekly',
      confidenceId: 'confidence-high',
      startDate: new Date('2026-01-01'),
      targetDate: new Date('2026-03-31'),
      objective: 'Establish a daily meditation practice of at least 10 minutes.',
      successMetric: '90% consistency over 3 months',
    },
    {
      id: 'proj-side-project',
      name: 'Launch Side Project MVP',
      statusId: 'status-todo',
      areaIds: ['area-career', 'area-business'],
      priorityId: 'priority-medium',
      cadenceId: 'cadence-biweekly',
      confidenceId: 'confidence-medium',
      startDate: new Date('2026-02-01'),
      targetDate: new Date('2026-05-31'),
      objective: 'Build and launch an MVP for my SaaS idea with basic features.',
      successMetric: '10 beta users signed up',
    },
    {
      id: 'proj-family-time',
      name: 'Weekly Family Activities',
      statusId: 'status-doing',
      areaIds: ['area-family'],
      priorityId: 'priority-high',
      cadenceId: 'cadence-weekly',
      confidenceId: 'confidence-high',
      startDate: new Date('2026-01-01'),
      targetDate: new Date('2026-12-31'),
      objective: 'Plan and execute at least one meaningful family activity every week.',
      successMetric: '48+ family activities logged',
    },
  ];

  for (const proj of projects) {
    await prisma.project.upsert({
      where: { id: proj.id },
      update: proj,
      create: {
        ...proj,
        workspaceId: workspace.id,
        ownerId: user.id,
        lastReviewDate: getDate(3),
      },
    });
  }
  console.log(`Created ${projects.length} projects`);

  // ============================================================
  // TASKS FOR PROJECTS
  // ============================================================
  console.log('\nCreating tasks...');

  const projectTasks = [
    // Fitness project tasks
    {
      projectId: 'proj-fitness-2026',
      title: 'Set up gym membership',
      statusId: 'task-done',
      completedAt: getDate(20),
    },
    {
      projectId: 'proj-fitness-2026',
      title: 'Create workout plan',
      statusId: 'task-done',
      completedAt: getDate(18),
    },
    {
      projectId: 'proj-fitness-2026',
      title: 'Buy resistance bands',
      statusId: 'task-done',
      completedAt: getDate(15),
    },
    {
      projectId: 'proj-fitness-2026',
      title: 'Schedule workouts in calendar',
      statusId: 'task-next',
    },
    {
      projectId: 'proj-fitness-2026',
      title: 'Track progress photos monthly',
      statusId: 'task-backlog',
    },
    // Reading project tasks
    {
      projectId: 'proj-read-books',
      title: 'Create reading list',
      statusId: 'task-done',
      completedAt: getDate(14),
    },
    {
      projectId: 'proj-read-books',
      title: 'Finish "Atomic Habits"',
      statusId: 'task-done',
      completedAt: getDate(7),
    },
    { projectId: 'proj-read-books', title: 'Start "Deep Work"', statusId: 'task-next' },
    {
      projectId: 'proj-read-books',
      title: 'Set up Kindle highlights sync',
      statusId: 'task-backlog',
    },
    // Savings project tasks
    {
      projectId: 'proj-savings',
      title: 'Set up automatic transfer',
      statusId: 'task-done',
      completedAt: getDate(21),
    },
    {
      projectId: 'proj-savings',
      title: 'Review and cut subscriptions',
      statusId: 'task-done',
      completedAt: getDate(14),
    },
    { projectId: 'proj-savings', title: 'Review monthly budget', statusId: 'task-next' },
    // Meditation project tasks
    {
      projectId: 'proj-meditation',
      title: 'Download meditation app',
      statusId: 'task-done',
      completedAt: getDate(22),
    },
    {
      projectId: 'proj-meditation',
      title: 'Complete beginner course',
      statusId: 'task-done',
      completedAt: getDate(10),
    },
    {
      projectId: 'proj-meditation',
      title: 'Set morning reminder',
      statusId: 'task-done',
      completedAt: getDate(20),
    },
    { projectId: 'proj-meditation', title: 'Try 20-min session', statusId: 'task-next' },
    // Side project tasks
    { projectId: 'proj-side-project', title: 'Define MVP features', statusId: 'task-next' },
    {
      projectId: 'proj-side-project',
      title: 'Set up project repository',
      statusId: 'task-backlog',
    },
    { projectId: 'proj-side-project', title: 'Design landing page', statusId: 'task-backlog' },
    // Family project tasks
    {
      projectId: 'proj-family-time',
      title: 'Plan movie night',
      statusId: 'task-done',
      completedAt: getDate(5),
    },
    { projectId: 'proj-family-time', title: 'Book restaurant for dinner', statusId: 'task-next' },
    { projectId: 'proj-family-time', title: 'Plan weekend hike', statusId: 'task-backlog' },
  ];

  for (const task of projectTasks) {
    await prisma.task.create({
      data: {
        projectId: task.projectId,
        title: task.title,
        statusId: task.statusId,
        completedAt: task.completedAt || null,
        assignedToId: user.id,
      },
    });
  }
  console.log(`Created ${projectTasks.length} tasks`);

  // ============================================================
  // HABITS
  // ============================================================
  console.log('\nCreating habits...');

  const habits = [
    { id: 'habit-workout', name: 'Workout', icon: 'Dumbbell', color: 'red', goalArea: 'Health' },
    {
      id: 'habit-read',
      name: 'Read 30 mins',
      icon: 'BookOpen',
      color: 'sky',
      goalArea: 'Learning',
    },
    { id: 'habit-meditate', name: 'Meditate', icon: 'Brain', color: 'violet', goalArea: 'Faith' },
    { id: 'habit-journal', name: 'Journal', icon: 'PenLine', color: 'amber', goalArea: 'Personal' },
    {
      id: 'habit-water',
      name: 'Drink 8 glasses',
      icon: 'Droplets',
      color: 'blue',
      goalArea: 'Health',
    },
    { id: 'habit-sleep', name: 'Sleep by 11pm', icon: 'Moon', color: 'indigo', goalArea: 'Health' },
  ];

  for (let i = 0; i < habits.length; i++) {
    const habit = habits[i];
    await prisma.habit.upsert({
      where: { id: habit.id },
      update: habit,
      create: {
        ...habit,
        workspaceId: workspace.id,
        userId: user.id,
        order: i,
        frequency: 'daily',
      },
    });
  }
  console.log(`Created ${habits.length} habits`);

  // ============================================================
  // HABIT LOGS (Past 30 days with realistic streaks)
  // ============================================================
  console.log('\nCreating habit logs...');

  // Create habit logs for past 30 days with varying completion rates
  const habitCompletion: Record<string, number[]> = {
    'habit-workout': [
      1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1,
    ], // ~50%
    'habit-read': [
      1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    ], // ~90%
    'habit-meditate': [
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    ], // 100% - 30 day streak!
    'habit-journal': [
      1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    ], // ~87%
    'habit-water': [
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    ], // 100%
    'habit-sleep': [
      0, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    ], // ~87%
  };

  let habitLogCount = 0;
  for (const [habitId, completions] of Object.entries(habitCompletion)) {
    for (let daysAgo = 0; daysAgo < completions.length; daysAgo++) {
      if (completions[completions.length - 1 - daysAgo] === 1) {
        const logDate = getDate(daysAgo);
        logDate.setHours(0, 0, 0, 0);

        await prisma.habitLog.upsert({
          where: {
            habitId_date: {
              habitId,
              date: logDate,
            },
          },
          update: {},
          create: {
            habitId,
            date: logDate,
            completed: true,
          },
        });
        habitLogCount++;
      }
    }
  }
  console.log(`Created ${habitLogCount} habit logs`);

  // ============================================================
  // JOURNAL ENTRIES (Past 10 days)
  // ============================================================
  console.log('\nCreating journal entries...');

  const journalEntries = [
    {
      daysAgo: 0,
      mood: 'great',
      emoji: '🔥',
      content:
        'Amazing day! Hit a new personal record at the gym and finished reading another chapter of Deep Work. Feeling motivated and energized.',
      wins: 'PR on deadlifts, completed 3 tasks, had quality time with family',
      challenges: 'Struggled to focus in the afternoon, need better post-lunch routine',
      gratitude: 'Grateful for good health, supportive family, and the opportunity to grow',
    },
    {
      daysAgo: 1,
      mood: 'good',
      emoji: '😊',
      content:
        'Solid productive day. Morning routine went smoothly. Made good progress on the side project planning.',
      wins: 'Completed workout, 30 min meditation, finished project outline',
      challenges: 'Notifications kept interrupting deep work sessions',
      gratitude: 'Beautiful weather today, great coffee, good conversations',
    },
    {
      daysAgo: 2,
      mood: 'good',
      emoji: '💪',
      content:
        'Focused on family time today. Had a lovely dinner together and played board games. Sometimes slowing down is exactly what you need.',
      wins: 'Quality family time, stayed present, no phone during dinner',
      challenges: 'Wanted to work on side project but chose family instead - right choice',
      gratitude: 'My family, weekend time together, home-cooked meals',
    },
    {
      daysAgo: 3,
      mood: 'neutral',
      emoji: '🤔',
      content:
        'Mixed day. Had some wins but also felt scattered. Need to be more intentional with time blocking tomorrow.',
      wins: 'Kept meditation streak going, hit savings goal for the month',
      challenges: 'Too many meetings, felt reactive instead of proactive',
      gratitude: 'Learning opportunities, patient colleagues, progress even when imperfect',
    },
    {
      daysAgo: 4,
      mood: 'great',
      emoji: '🎯',
      content:
        'One of those days where everything clicks. Deep focus work in the morning, great workout, meaningful conversations.',
      wins: 'Finished Atomic Habits book, 4 tasks completed, new workout routine feels good',
      challenges: 'None really - rode the momentum wave',
      gratitude: 'Clarity, energy, momentum, the compound effect of good habits',
    },
    {
      daysAgo: 5,
      mood: 'good',
      emoji: '📚',
      content:
        'Reading day. Spent extra time with books and reflection. Sometimes the best productivity is stepping back.',
      wins: 'Read 100 pages, journaled extensively, early bedtime',
      challenges: 'Felt guilty about not being "productive" - need to reframe rest as essential',
      gratitude: 'Good books, quiet time, the ability to learn and grow',
    },
    {
      daysAgo: 6,
      mood: 'bad',
      emoji: '😔',
      content:
        'Tough day. Woke up tired, skipped workout. But still managed to meditate and keep the streak going. Tomorrow is a new day.',
      wins: 'Maintained meditation streak, was kind to myself, got basics done',
      challenges: 'Low energy, negative self-talk, wanted to give up',
      gratitude: 'Resilience, second chances, the streak keeping me accountable',
    },
    {
      daysAgo: 7,
      mood: 'great',
      emoji: '🚀',
      content:
        'Weekly review day! Reflected on progress, planned ahead. Feeling aligned and purposeful going into the new week.',
      wins: 'Completed weekly review, planned next actions, celebrated small wins',
      challenges: 'Realized I overcommitted - need to be more realistic with planning',
      gratitude: 'Reflection time, clear priorities, the review practice itself',
    },
  ];

  for (const entry of journalEntries) {
    const entryDate = getDate(entry.daysAgo);
    entryDate.setHours(0, 0, 0, 0);

    const journalData = {
      mood: entry.mood as any,
      emoji: entry.emoji,
      content: entry.content,
      wins: entry.wins,
      challenges: entry.challenges,
      gratitude: entry.gratitude,
    };

    await prisma.journalEntry.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: entryDate,
        },
      },
      update: journalData,
      create: {
        userId: user.id,
        date: entryDate,
        ...journalData,
      },
    });
  }
  console.log(`Created ${journalEntries.length} journal entries`);

  // ============================================================
  // WEEKLY REVIEWS (Past 4 weeks)
  // ============================================================
  console.log('\nCreating weekly reviews...');

  const weeklyReviews = [
    {
      weeksAgo: 0,
      wentWell:
        'Meditation streak hit 30 days! Reading habit is solid. Fitness consistency improved.',
      toImprove: 'Need better time blocking for deep work. Reduce context switching.',
      focusNextWeek: 'Complete side project MVP planning. Maintain all streaks.',
      lessonsLearned: 'Small consistent actions beat sporadic bursts of effort.',
      gratitude: 'The compound effect of habits, supportive environment, health',
      rating: 4,
    },
    {
      weeksAgo: 1,
      wentWell: 'Great progress on reading goal. Family time was meaningful. Savings on track.',
      toImprove: 'Workout consistency could be better. Need more sleep.',
      focusNextWeek: 'Focus on fitness, maintain other habits, start side project planning.',
      lessonsLearned: 'Rest is productive. Quality over quantity in workouts.',
      gratitude: 'Family support, good health, learning opportunities',
      rating: 4,
    },
    {
      weeksAgo: 2,
      wentWell:
        'Finished a great book. Meditation practice deepening. Financial goals progressing.',
      toImprove: 'Was too hard on myself when missing habits. Need more self-compassion.',
      focusNextWeek: 'Balance ambition with kindness. Celebrate small wins.',
      lessonsLearned: 'Progress not perfection. The streak is a tool, not a master.',
      gratitude: 'Second chances, growth mindset, supportive community',
      rating: 3,
    },
    {
      weeksAgo: 3,
      wentWell: 'Great start to the year! All systems set up. Habits forming nicely.',
      toImprove: 'Overcommitted in first week enthusiasm. Need realistic expectations.',
      focusNextWeek: 'Sustainable pace. Focus on keystone habits first.',
      lessonsLearned: 'Start slow to go fast. Systems beat goals.',
      gratitude: 'Fresh start, clear vision, the ability to choose my direction',
      rating: 4,
    },
  ];

  for (const review of weeklyReviews) {
    const weekStart = getMonday(review.weeksAgo);

    const reviewData = {
      wentWell: review.wentWell,
      toImprove: review.toImprove,
      focusNextWeek: review.focusNextWeek,
      lessonsLearned: review.lessonsLearned,
      gratitude: review.gratitude,
      rating: review.rating,
    };

    await prisma.weeklyReview.upsert({
      where: {
        userId_weekStart: {
          userId: user.id,
          weekStart,
        },
      },
      update: reviewData,
      create: {
        userId: user.id,
        weekStart,
        ...reviewData,
      },
    });
  }
  console.log(`Created ${weeklyReviews.length} weekly reviews`);

  // ============================================================
  // AI DAILY TEXT
  // ============================================================
  console.log('\nCreating AI daily text...');

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  await prisma.aiDailyText.upsert({
    where: {
      userId_workspaceId_date: {
        userId: user.id,
        workspaceId: workspace.id,
        date: todayDate,
      },
    },
    update: {},
    create: {
      userId: user.id,
      workspaceId: workspace.id,
      date: todayDate,
      content:
        "Your 30-day meditation streak is incredible! Combined with your consistent reading habit, you're building powerful foundations. Today, consider starting that Deep Work book while your focus is sharp. Remember: you've already proven you can show up daily. Now it's about deepening the practice. 🧘‍♂️📚",
    },
  });
  console.log('Created AI daily text');

  // ============================================================
  // AI INSIGHTS
  // ============================================================
  console.log('\nCreating AI insights...');

  const insights = [
    {
      type: 'celebration',
      title: '30-Day Meditation Streak! 🎉',
      content:
        "You've meditated for 30 consecutive days - that's incredible discipline! Research shows it takes about 66 days to form a habit, and you're almost halfway there. Keep going!",
      confidence: 0.95,
    },
    {
      type: 'pattern',
      title: 'Morning Routine Driving Success',
      content:
        "I noticed your best days correlate with completing your morning routine (meditation + reading) early. On days you complete these before 9am, you're 3x more likely to report feeling 'great' in your journal.",
      confidence: 0.87,
    },
    {
      type: 'recommendation',
      title: 'Optimize Workout Timing',
      content:
        'Your workout completion rate is 50% overall, but 80% when scheduled before noon. Consider blocking gym time in the morning when your consistency is highest.',
      confidence: 0.82,
    },
    {
      type: 'milestone',
      title: '3 Books Completed This Year',
      content:
        "You've already finished 3 books and it's only January! At this pace, you'll exceed your 24-book goal. Your current favorite topic seems to be productivity and habits.",
      confidence: 0.9,
    },
  ];

  for (const insight of insights) {
    await prisma.aiInsight.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        type: insight.type as any,
        title: insight.title,
        content: insight.content,
        confidence: insight.confidence,
        actionable: true,
      },
    });
  }
  console.log(`Created ${insights.length} AI insights`);

  console.log('\n✅ Seeding completed successfully!');
  console.log('\nSummary:');
  console.log(`- ${projects.length} projects (goals)`);
  console.log(`- ${projectTasks.length} tasks`);
  console.log(`- ${habits.length} habits`);
  console.log(`- ${habitLogCount} habit logs (30 days of data)`);
  console.log(`- ${journalEntries.length} journal entries`);
  console.log(`- ${weeklyReviews.length} weekly reviews`);
  console.log(`- AI daily text and insights`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
