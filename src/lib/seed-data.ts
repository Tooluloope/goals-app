import { User, Workspace, Project, Notification, Task } from '@/types';
import { generateId } from './utils';

// Users
export const users: User[] = [
  {
    id: 'user-1',
    name: 'Tolulope',
    email: 'tolu@example.com',
    avatar: undefined,
    defaultWorkspaceId: 'ws-personal-1',
    settings: {
      theme: 'light',
      compactMode: false,
      showWelcomeOnLogin: true,
    },
  },
  {
    id: 'user-2',
    name: 'Wife',
    email: 'wife@example.com',
    avatar: undefined,
    defaultWorkspaceId: 'ws-personal-2',
    settings: {
      theme: 'light',
      compactMode: false,
      showWelcomeOnLogin: true,
    },
  },
];

// Workspaces
export const workspaces: Workspace[] = [
  {
    id: 'ws-personal-1',
    name: "Tolulope's Goals",
    type: 'personal',
    memberIds: ['user-1'],
  },
  {
    id: 'ws-personal-2',
    name: "Wife's Goals",
    type: 'personal',
    memberIds: ['user-2'],
  },
  {
    id: 'ws-family',
    name: 'Family Goals',
    type: 'family',
    memberIds: ['user-1', 'user-2'],
  },
];

// Helper to create dates
const today = new Date();
const formatDateString = (date: Date) => date.toISOString().split('T')[0];
const daysAgo = (days: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - days);
  return formatDateString(d);
};

// Projects (Goals) - Using ID-based references
export const projects: Project[] = [
  // 1) Generosity & Gifting
  {
    id: 'proj-1',
    workspaceId: 'ws-personal-1',
    name: 'Generosity & Gifting',
    statusId: 'status-doing',
    areaId: 'area-family',
    startDate: '2026-01-01',
    targetDate: '2026-12-31',
    cadenceId: 'cadence-monthly',
    priorityId: 'priority-high',
    successMetric: 'Complete 12 planned giving activities and increase giving by 15%',
    lastReviewDate: daysAgo(25),
    confidenceId: 'confidence-high',
    objective: 'Build a consistent practice of generosity and thoughtful gifting throughout the year',
    requirements: [
      { id: 'req-1-1', text: 'Create annual giving budget and plan', completed: true },
      { id: 'req-1-2', text: 'Set up automated monthly donations', completed: true },
      { id: 'req-1-3', text: 'Research and select charitable organizations', completed: false },
      { id: 'req-1-4', text: 'Plan birthday and holiday gifts in advance', completed: false },
    ],
    definitionOfDone: [
      { id: 'dod-1-1', text: 'All planned donations completed for the year', completed: false },
      { id: 'dod-1-2', text: 'Gift tracking spreadsheet maintained', completed: false },
      { id: 'dod-1-3', text: 'Year-end reflection on giving impact', completed: false },
    ],
    keyDecisions: [
      {
        id: 'kd-1-1',
        date: '2026-01-15',
        context: 'Deciding on primary charitable focus areas',
        options: ['Education', 'Healthcare', 'Local community', 'International aid'],
        chosen: 'Local community + Education',
        rationale: 'Want to see direct impact locally while supporting future generations',
      },
    ],
    tasks: [
      { id: 'task-1-1', projectId: 'proj-1', title: 'Review Q1 giving and adjust Q2 plan', statusId: 'task-next', createdAt: daysAgo(5), updatedAt: daysAgo(5) },
      { id: 'task-1-2', projectId: 'proj-1', title: 'Research local food bank volunteer opportunities', statusId: 'task-backlog', createdAt: daysAgo(10), updatedAt: daysAgo(10) },
      { id: 'task-1-3', projectId: 'proj-1', title: 'Set up giving tracker spreadsheet', statusId: 'task-done', createdAt: daysAgo(30), updatedAt: daysAgo(20) },
    ],
    metrics: {
      primaryMetric: 'Total amount donated this year',
      leadingIndicator: 'Monthly giving consistency',
      riskIndicator: 'Months without any giving activity',
    },
    reviewNotes: [
      {
        id: 'rn-1-1',
        date: daysAgo(25),
        notes: 'Good start to the year. Automated donations are working well.',
        progress: 'On track - 2 months of consistent giving completed',
        blockers: 'Need to finalize charity research',
        changes: 'None needed',
        nextStep: 'Complete charity vetting by end of month',
      },
    ],
    failureCriteria: 'Miss more than 3 consecutive months of planned giving or exceed budget by 50%',
    createdAt: '2026-01-01',
    updatedAt: daysAgo(5),
  },

  // 2) Bible Reading & Spiritual Growth
  {
    id: 'proj-2',
    workspaceId: 'ws-personal-1',
    name: 'Bible Reading & Spiritual Growth',
    statusId: 'status-doing',
    areaId: 'area-faith',
    startDate: '2026-01-01',
    targetDate: '2026-12-31',
    cadenceId: 'cadence-weekly',
    priorityId: 'priority-high',
    successMetric: 'Complete full Bible reading plan and maintain daily devotional practice',
    lastReviewDate: daysAgo(5),
    confidenceId: 'confidence-high',
    objective: 'Deepen spiritual foundation through consistent scripture reading and reflection',
    requirements: [
      { id: 'req-2-1', text: 'Select and commit to a Bible reading plan', completed: true },
      { id: 'req-2-2', text: 'Set up daily reading reminder', completed: true },
      { id: 'req-2-3', text: 'Create journaling practice for reflections', completed: true },
      { id: 'req-2-4', text: 'Join or form accountability group', completed: false },
    ],
    definitionOfDone: [
      { id: 'dod-2-1', text: 'Read entire Bible (or selected plan) by year end', completed: false },
      { id: 'dod-2-2', text: '300+ days of recorded devotional time', completed: false },
      { id: 'dod-2-3', text: 'Journal with at least 50 meaningful reflections', completed: false },
    ],
    keyDecisions: [
      {
        id: 'kd-2-1',
        date: '2026-01-02',
        context: 'Choosing Bible reading plan format',
        options: ['Chronological', 'Book by book', 'Thematic', 'One Year Bible'],
        chosen: 'Chronological',
        rationale: 'Want to understand the historical context and flow of scripture',
      },
    ],
    tasks: [
      { id: 'task-2-1', projectId: 'proj-2', title: 'Complete this week\'s reading chapters', statusId: 'task-next', dueDate: formatDateString(new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)), createdAt: daysAgo(1), updatedAt: daysAgo(1) },
      { id: 'task-2-2', projectId: 'proj-2', title: 'Write reflection on Genesis themes', statusId: 'task-next', createdAt: daysAgo(3), updatedAt: daysAgo(3) },
      { id: 'task-2-3', projectId: 'proj-2', title: 'Research local Bible study groups', statusId: 'task-backlog', createdAt: daysAgo(10), updatedAt: daysAgo(10) },
    ],
    metrics: {
      primaryMetric: 'Days with completed reading',
      leadingIndicator: 'Weekly reading streak maintained',
      riskIndicator: 'Days missed in current week',
    },
    reviewNotes: [
      {
        id: 'rn-2-1',
        date: daysAgo(5),
        notes: 'Consistency improving. Morning routine is the key.',
        progress: '95% adherence this week',
        blockers: 'Travel days are challenging',
        changes: 'Downloaded audio Bible for travel',
        nextStep: 'Test audio option during next trip',
      },
    ],
    failureCriteria: 'Miss more than 2 consecutive weeks or fall more than 30 days behind plan',
    createdAt: '2026-01-01',
    updatedAt: daysAgo(1),
  },

  // 3) Family Time & Presence
  {
    id: 'proj-3',
    workspaceId: 'ws-family',
    name: 'Family Time & Presence',
    statusId: 'status-doing',
    areaId: 'area-family',
    startDate: '2026-01-01',
    targetDate: '2026-12-31',
    cadenceId: 'cadence-weekly',
    priorityId: 'priority-high',
    successMetric: 'Weekly family activities and improved quality time metrics',
    lastReviewDate: daysAgo(4),
    confidenceId: 'confidence-high',
    objective: 'Prioritize meaningful family connection through intentional presence and activities',
    requirements: [
      { id: 'req-3-1', text: 'Establish weekly family activity tradition', completed: true },
      { id: 'req-3-2', text: 'Create device-free zones/times', completed: true },
      { id: 'req-3-3', text: 'Plan monthly special outings', completed: false },
      { id: 'req-3-4', text: 'Set up family conversation starters', completed: true },
    ],
    definitionOfDone: [
      { id: 'dod-3-1', text: '48+ weeks with intentional family time', completed: false },
      { id: 'dod-3-2', text: '12 monthly special outings completed', completed: false },
      { id: 'dod-3-3', text: 'Family members report improved connection', completed: false },
    ],
    keyDecisions: [],
    tasks: [
      { id: 'task-3-1', projectId: 'proj-3', title: 'Plan this weekend\'s family activity', statusId: 'task-next', dueDate: formatDateString(new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000)), createdAt: daysAgo(2), updatedAt: daysAgo(2) },
      { id: 'task-3-2', projectId: 'proj-3', title: 'Research February outing ideas', statusId: 'task-backlog', createdAt: daysAgo(7), updatedAt: daysAgo(7) },
    ],
    metrics: {
      primaryMetric: 'Hours of quality family time per week',
      leadingIndicator: 'Planned activities on calendar',
      riskIndicator: 'Weeks without intentional family activity',
    },
    reviewNotes: [
      {
        id: 'rn-3-1',
        date: daysAgo(4),
        notes: 'Game night was a hit! Kids loved it.',
        progress: 'Strong week - 3 quality activities',
        blockers: 'Work schedule conflicts',
        changes: 'Moving family time to Sunday afternoons',
        nextStep: 'Try new board game this week',
      },
    ],
    failureCriteria: 'Miss more than 4 consecutive weeks of intentional family time',
    createdAt: '2026-01-01',
    updatedAt: daysAgo(2),
  },

  // 4) Reading & Learning
  {
    id: 'proj-4',
    workspaceId: 'ws-personal-1',
    name: 'Reading & Learning',
    statusId: 'status-doing',
    areaId: 'area-learning',
    startDate: '2026-01-01',
    targetDate: '2026-12-31',
    cadenceId: 'cadence-weekly',
    priorityId: 'priority-high',
    successMetric: 'Read 24 books and complete 2 online courses',
    lastReviewDate: daysAgo(6),
    confidenceId: 'confidence-medium',
    objective: 'Expand knowledge through consistent reading and structured learning',
    requirements: [
      { id: 'req-4-1', text: 'Create reading list with diverse topics', completed: true },
      { id: 'req-4-2', text: 'Set up daily reading habit (30 min)', completed: true },
      { id: 'req-4-3', text: 'Select 2 courses to complete', completed: true },
      { id: 'req-4-4', text: 'Create book notes system', completed: false },
    ],
    definitionOfDone: [
      { id: 'dod-4-1', text: '24 books read and logged', completed: false },
      { id: 'dod-4-2', text: '2 courses completed with certificates', completed: false },
      { id: 'dod-4-3', text: 'Notes captured for each book', completed: false },
    ],
    keyDecisions: [
      {
        id: 'kd-4-1',
        date: '2026-01-10',
        context: 'Choosing first online course',
        options: ['AWS certification', 'Leadership course', 'Finance fundamentals', 'AI/ML basics'],
        chosen: 'Leadership course',
        rationale: 'Aligns with career advancement goals and immediate needs',
      },
    ],
    tasks: [
      { id: 'task-4-1', projectId: 'proj-4', title: 'Finish current book (Atomic Habits)', statusId: 'task-next', createdAt: daysAgo(3), updatedAt: daysAgo(3) },
      { id: 'task-4-2', projectId: 'proj-4', title: 'Complete Module 3 of leadership course', statusId: 'task-next', dueDate: formatDateString(new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000)), createdAt: daysAgo(1), updatedAt: daysAgo(1) },
      { id: 'task-4-3', projectId: 'proj-4', title: 'Set up Notion for book notes', statusId: 'task-backlog', createdAt: daysAgo(15), updatedAt: daysAgo(15) },
    ],
    metrics: {
      primaryMetric: 'Books completed',
      leadingIndicator: 'Daily reading time logged',
      riskIndicator: 'Days without reading',
    },
    reviewNotes: [
      {
        id: 'rn-4-1',
        date: daysAgo(6),
        notes: 'Falling slightly behind on reading pace. Course is going well.',
        progress: '2 books done, on Module 2 of course',
        blockers: 'Finding time to read on busy days',
        changes: 'Switching to audiobooks for commute time',
        nextStep: 'Download 3 audiobooks',
      },
    ],
    failureCriteria: 'Read fewer than 12 books or complete 0 courses',
    createdAt: '2026-01-01',
    updatedAt: daysAgo(1),
  },

  // 5) Family Travel
  {
    id: 'proj-5',
    workspaceId: 'ws-family',
    name: 'Family Travel',
    statusId: 'status-todo',
    areaId: 'area-family',
    startDate: '2026-01-01',
    targetDate: '2026-12-31',
    cadenceId: 'cadence-quarterly',
    priorityId: 'priority-medium',
    successMetric: 'Complete 2 family trips with memorable experiences',
    lastReviewDate: undefined,
    confidenceId: 'confidence-medium',
    objective: 'Create lasting family memories through travel and exploration',
    requirements: [
      { id: 'req-5-1', text: 'Determine travel budget for year', completed: false },
      { id: 'req-5-2', text: 'Research and shortlist destinations', completed: false },
      { id: 'req-5-3', text: 'Check passport/document validity', completed: false },
      { id: 'req-5-4', text: 'Set up travel savings fund', completed: false },
    ],
    definitionOfDone: [
      { id: 'dod-5-1', text: 'Complete summer family trip', completed: false },
      { id: 'dod-5-2', text: 'Complete winter family trip', completed: false },
      { id: 'dod-5-3', text: 'Photo albums created for each trip', completed: false },
    ],
    keyDecisions: [],
    tasks: [
      { id: 'task-5-1', projectId: 'proj-5', title: 'Create travel budget spreadsheet', statusId: 'task-backlog', createdAt: daysAgo(10), updatedAt: daysAgo(10) },
      { id: 'task-5-2', projectId: 'proj-5', title: 'Brainstorm destination ideas with family', statusId: 'task-backlog', createdAt: daysAgo(10), updatedAt: daysAgo(10) },
    ],
    metrics: {
      primaryMetric: 'Trips completed',
      leadingIndicator: 'Savings progress toward trip budget',
      riskIndicator: 'Months without trip planning progress',
    },
    reviewNotes: [],
    failureCriteria: 'Complete 0 family trips during the year',
    createdAt: '2026-01-01',
    updatedAt: daysAgo(10),
  },

  // 6) Career Advancement
  {
    id: 'proj-6',
    workspaceId: 'ws-personal-1',
    name: 'Career Advancement',
    statusId: 'status-doing',
    areaId: 'area-career',
    startDate: '2026-01-01',
    targetDate: '2026-12-31',
    cadenceId: 'cadence-quarterly',
    priorityId: 'priority-high',
    successMetric: 'Achieve promotion or significant role expansion with 15% compensation increase',
    lastReviewDate: daysAgo(45),
    confidenceId: 'confidence-medium',
    objective: 'Advance career through skill development, visibility, and strategic positioning',
    requirements: [
      { id: 'req-6-1', text: 'Define target role and requirements', completed: true },
      { id: 'req-6-2', text: 'Identify skill gaps and create development plan', completed: true },
      { id: 'req-6-3', text: 'Build relationships with key stakeholders', completed: false },
      { id: 'req-6-4', text: 'Document achievements and impact', completed: false },
    ],
    definitionOfDone: [
      { id: 'dod-6-1', text: 'Promotion achieved or new role secured', completed: false },
      { id: 'dod-6-2', text: 'Compensation increased by target amount', completed: false },
      { id: 'dod-6-3', text: 'Skills gap addressed through training/projects', completed: false },
    ],
    keyDecisions: [
      {
        id: 'kd-6-1',
        date: '2026-01-20',
        context: 'Deciding whether to pursue internal promotion vs external opportunities',
        options: ['Focus on internal promotion', 'Actively explore external', 'Both simultaneously'],
        chosen: 'Focus on internal promotion',
        rationale: 'Strong team and good trajectory internally; external as backup',
      },
    ],
    tasks: [
      { id: 'task-6-1', projectId: 'proj-6', title: 'Schedule 1:1 with skip-level manager', statusId: 'task-next', createdAt: daysAgo(7), updatedAt: daysAgo(7) },
      { id: 'task-6-2', projectId: 'proj-6', title: 'Update LinkedIn profile and portfolio', statusId: 'task-backlog', createdAt: daysAgo(20), updatedAt: daysAgo(20) },
      { id: 'task-6-3', projectId: 'proj-6', title: 'Complete Q1 achievement documentation', statusId: 'task-next', dueDate: formatDateString(new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)), createdAt: daysAgo(5), updatedAt: daysAgo(5) },
    ],
    metrics: {
      primaryMetric: 'Progress toward promotion criteria',
      leadingIndicator: 'Key projects delivered successfully',
      riskIndicator: 'Negative feedback or missed opportunities',
    },
    reviewNotes: [
      {
        id: 'rn-6-1',
        date: daysAgo(45),
        notes: 'Good Q4 performance review. Manager supportive of growth.',
        progress: 'On track for mid-year promotion discussion',
        blockers: 'Need more visibility on cross-functional projects',
        changes: 'Volunteered for Q2 initiative to increase visibility',
        nextStep: 'Deliver excellent results on new initiative',
      },
    ],
    failureCriteria: 'No promotion or role change by year end with no clear path forward',
    createdAt: '2026-01-01',
    updatedAt: daysAgo(5),
  },

  // 7) Investment Advancement
  {
    id: 'proj-7',
    workspaceId: 'ws-personal-1',
    name: 'Investment Advancement',
    statusId: 'status-doing',
    areaId: 'area-finance',
    startDate: '2026-01-01',
    targetDate: '2026-12-31',
    cadenceId: 'cadence-monthly',
    priorityId: 'priority-high',
    successMetric: 'Grow investment portfolio by 20% through strategic allocation and consistent contributions',
    lastReviewDate: daysAgo(20),
    confidenceId: 'confidence-medium',
    objective: 'Build long-term wealth through disciplined investing and portfolio optimization',
    requirements: [
      { id: 'req-7-1', text: 'Review and update investment strategy', completed: true },
      { id: 'req-7-2', text: 'Set up automatic investment contributions', completed: true },
      { id: 'req-7-3', text: 'Diversify across asset classes', completed: false },
      { id: 'req-7-4', text: 'Research tax-advantaged opportunities', completed: false },
    ],
    definitionOfDone: [
      { id: 'dod-7-1', text: 'Meet annual contribution targets', completed: false },
      { id: 'dod-7-2', text: 'Portfolio rebalanced quarterly', completed: false },
      { id: 'dod-7-3', text: 'Tax-loss harvesting executed where beneficial', completed: false },
    ],
    keyDecisions: [
      {
        id: 'kd-7-1',
        date: '2026-01-25',
        context: 'Deciding on allocation strategy',
        options: ['Aggressive growth', 'Balanced', 'Conservative', 'Target date funds'],
        chosen: 'Balanced',
        rationale: 'Match risk tolerance while maintaining growth potential',
      },
    ],
    tasks: [
      { id: 'task-7-1', projectId: 'proj-7', title: 'Review February portfolio performance', statusId: 'task-next', createdAt: daysAgo(3), updatedAt: daysAgo(3) },
      { id: 'task-7-2', projectId: 'proj-7', title: 'Research REIT options for diversification', statusId: 'task-backlog', createdAt: daysAgo(15), updatedAt: daysAgo(15) },
      { id: 'task-7-3', projectId: 'proj-7', title: 'Max out IRA contribution', statusId: 'task-backlog', dueDate: '2026-04-15', createdAt: daysAgo(10), updatedAt: daysAgo(10) },
    ],
    metrics: {
      primaryMetric: 'Portfolio value growth',
      leadingIndicator: 'Monthly contribution consistency',
      riskIndicator: 'Months with missed contributions',
    },
    reviewNotes: [
      {
        id: 'rn-7-1',
        date: daysAgo(20),
        notes: 'Market volatility but staying the course. Contributions on track.',
        progress: 'YTD contributions at 15% of target',
        blockers: 'None',
        changes: 'Increased allocation to international equities',
        nextStep: 'Complete Q1 rebalancing',
      },
    ],
    failureCriteria: 'Miss more than 4 monthly contributions or take unplanned withdrawals',
    createdAt: '2026-01-01',
    updatedAt: daysAgo(3),
  },

  // 8) Health & Exercise
  {
    id: 'proj-8',
    workspaceId: 'ws-personal-1',
    name: 'Health & Exercise',
    statusId: 'status-doing',
    areaId: 'area-health',
    startDate: '2026-01-01',
    targetDate: '2026-12-31',
    cadenceId: 'cadence-weekly',
    priorityId: 'priority-high',
    successMetric: 'Exercise 4x/week consistently and achieve target weight/fitness metrics',
    lastReviewDate: daysAgo(3),
    confidenceId: 'confidence-medium',
    objective: 'Build sustainable health habits through consistent exercise and nutrition',
    requirements: [
      { id: 'req-8-1', text: 'Define specific fitness goals', completed: true },
      { id: 'req-8-2', text: 'Create workout schedule', completed: true },
      { id: 'req-8-3', text: 'Set up nutrition tracking', completed: false },
      { id: 'req-8-4', text: 'Schedule annual physical', completed: true },
    ],
    definitionOfDone: [
      { id: 'dod-8-1', text: 'Average 4+ workouts per week for year', completed: false },
      { id: 'dod-8-2', text: 'Reach target weight/body composition', completed: false },
      { id: 'dod-8-3', text: 'Complete annual physical with good results', completed: false },
    ],
    keyDecisions: [
      {
        id: 'kd-8-1',
        date: '2026-01-05',
        context: 'Choosing primary workout approach',
        options: ['Gym membership', 'Home workouts', 'Running/cardio focus', 'Mixed approach'],
        chosen: 'Mixed approach',
        rationale: 'Variety keeps motivation high and targets different fitness aspects',
      },
    ],
    tasks: [
      { id: 'task-8-1', projectId: 'proj-8', title: 'Complete 3 workouts this week', statusId: 'task-next', dueDate: formatDateString(new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000)), createdAt: daysAgo(1), updatedAt: daysAgo(1) },
      { id: 'task-8-2', projectId: 'proj-8', title: 'Try new HIIT workout class', statusId: 'task-backlog', createdAt: daysAgo(5), updatedAt: daysAgo(5) },
      { id: 'task-8-3', projectId: 'proj-8', title: 'Prep healthy meals for next week', statusId: 'task-next', createdAt: daysAgo(2), updatedAt: daysAgo(2) },
    ],
    metrics: {
      primaryMetric: 'Weekly workout count',
      leadingIndicator: 'Workouts logged in current week',
      riskIndicator: 'Consecutive days without exercise',
    },
    reviewNotes: [
      {
        id: 'rn-8-1',
        date: daysAgo(3),
        notes: 'Good week! Hit 4 workouts despite busy schedule.',
        progress: '4 workouts completed',
        blockers: 'Early morning workouts are hard in winter',
        changes: 'Shifting some workouts to lunch break',
        nextStep: 'Test lunch workout this week',
      },
    ],
    failureCriteria: 'Average fewer than 2 workouts per week for 2+ consecutive months',
    createdAt: '2026-01-01',
    updatedAt: daysAgo(1),
  },

  // 9) Clothing & Body Care
  {
    id: 'proj-9',
    workspaceId: 'ws-personal-1',
    name: 'Clothing & Body Care',
    statusId: 'status-todo',
    areaId: 'area-personal',
    startDate: '2026-01-01',
    targetDate: '2026-06-30',
    cadenceId: 'cadence-monthly',
    priorityId: 'priority-medium',
    successMetric: 'Refresh wardrobe and establish consistent grooming routine',
    lastReviewDate: undefined,
    confidenceId: 'confidence-high',
    objective: 'Improve personal presentation through thoughtful wardrobe curation and self-care',
    requirements: [
      { id: 'req-9-1', text: 'Audit current wardrobe', completed: false },
      { id: 'req-9-2', text: 'Define personal style goals', completed: false },
      { id: 'req-9-3', text: 'Set budget for wardrobe updates', completed: false },
      { id: 'req-9-4', text: 'Research skincare routine', completed: false },
    ],
    definitionOfDone: [
      { id: 'dod-9-1', text: 'Wardrobe organized and curated', completed: false },
      { id: 'dod-9-2', text: '5+ new quality pieces acquired', completed: false },
      { id: 'dod-9-3', text: 'Daily skincare routine established', completed: false },
    ],
    keyDecisions: [],
    tasks: [
      { id: 'task-9-1', projectId: 'proj-9', title: 'Schedule closet clean-out day', statusId: 'task-backlog', createdAt: daysAgo(5), updatedAt: daysAgo(5) },
    ],
    metrics: {
      primaryMetric: 'Wardrobe items curated',
      leadingIndicator: 'Days of consistent grooming routine',
      riskIndicator: 'Months without progress on wardrobe goals',
    },
    reviewNotes: [],
    failureCriteria: 'No progress on wardrobe or grooming by Q2 end',
    createdAt: '2026-01-01',
    updatedAt: daysAgo(5),
  },

  // 10) Family Business Exploration
  {
    id: 'proj-10',
    workspaceId: 'ws-family',
    name: 'Family Business Exploration',
    statusId: 'status-todo',
    areaId: 'area-business',
    startDate: '2026-01-01',
    targetDate: '2026-09-30',
    cadenceId: 'cadence-monthly',
    priorityId: 'priority-medium',
    successMetric: 'Validate 1-2 business ideas and make go/no-go decision',
    lastReviewDate: undefined,
    confidenceId: 'confidence-low',
    objective: 'Explore potential family business opportunities for additional income and fulfillment',
    requirements: [
      { id: 'req-10-1', text: 'Brainstorm business ideas together', completed: false },
      { id: 'req-10-2', text: 'Research market opportunities', completed: false },
      { id: 'req-10-3', text: 'Assess skills and resources available', completed: false },
      { id: 'req-10-4', text: 'Define time and capital constraints', completed: false },
    ],
    definitionOfDone: [
      { id: 'dod-10-1', text: 'At least 3 ideas evaluated', completed: false },
      { id: 'dod-10-2', text: 'One idea validated with customer research', completed: false },
      { id: 'dod-10-3', text: 'Clear decision made on next steps', completed: false },
    ],
    keyDecisions: [],
    tasks: [
      { id: 'task-10-1', projectId: 'proj-10', title: 'Schedule family brainstorm session', statusId: 'task-backlog', createdAt: daysAgo(15), updatedAt: daysAgo(15) },
    ],
    metrics: {
      primaryMetric: 'Ideas evaluated',
      leadingIndicator: 'Research activities completed',
      riskIndicator: 'Months without exploration activity',
    },
    reviewNotes: [],
    failureCriteria: 'No business ideas explored by Q3 end',
    createdAt: '2026-01-01',
    updatedAt: daysAgo(15),
  },

  // 11) Finance Tracking (Monarch)
  {
    id: 'proj-11',
    workspaceId: 'ws-personal-1',
    name: 'Finance Tracking (Monarch)',
    statusId: 'status-doing',
    areaId: 'area-finance',
    startDate: '2026-01-01',
    targetDate: '2026-12-31',
    cadenceId: 'cadence-monthly',
    priorityId: 'priority-high',
    successMetric: 'Maintain complete financial visibility and stay within budget all year',
    lastReviewDate: daysAgo(15),
    confidenceId: 'confidence-high',
    objective: 'Achieve financial clarity through consistent tracking and budgeting',
    requirements: [
      { id: 'req-11-1', text: 'Connect all accounts to Monarch', completed: true },
      { id: 'req-11-2', text: 'Set up budget categories', completed: true },
      { id: 'req-11-3', text: 'Create monthly review routine', completed: true },
      { id: 'req-11-4', text: 'Set financial goals in app', completed: false },
    ],
    definitionOfDone: [
      { id: 'dod-11-1', text: '12 monthly reviews completed', completed: false },
      { id: 'dod-11-2', text: 'Budget adherence at 90%+ annually', completed: false },
      { id: 'dod-11-3', text: 'Net worth tracked monthly', completed: false },
    ],
    keyDecisions: [
      {
        id: 'kd-11-1',
        date: '2026-01-10',
        context: 'Choosing budget app',
        options: ['Monarch', 'YNAB', 'Mint', 'Manual spreadsheet'],
        chosen: 'Monarch',
        rationale: 'Best combination of automation and goal tracking features',
      },
    ],
    tasks: [
      { id: 'task-11-1', projectId: 'proj-11', title: 'Review and categorize January transactions', statusId: 'task-next', createdAt: daysAgo(2), updatedAt: daysAgo(2) },
      { id: 'task-11-2', projectId: 'proj-11', title: 'Set Q2 savings goal', statusId: 'task-backlog', createdAt: daysAgo(10), updatedAt: daysAgo(10) },
    ],
    metrics: {
      primaryMetric: 'Budget variance percentage',
      leadingIndicator: 'Transactions categorized weekly',
      riskIndicator: 'Days with uncategorized transactions',
    },
    reviewNotes: [
      {
        id: 'rn-11-1',
        date: daysAgo(15),
        notes: 'January tracking complete. Slightly over on dining budget.',
        progress: 'All accounts connected, categories refined',
        blockers: 'Some transactions hard to auto-categorize',
        changes: 'Created custom rules for recurring charges',
        nextStep: 'Adjust dining budget or reduce eating out',
      },
    ],
    failureCriteria: 'Miss more than 3 monthly reviews or budget variance exceeds 30%',
    createdAt: '2026-01-01',
    updatedAt: daysAgo(2),
  },

  // 12) Annual & Quarterly Goal Reviews
  {
    id: 'proj-12',
    workspaceId: 'ws-personal-1',
    name: 'Annual & Quarterly Goal Reviews',
    statusId: 'status-doing',
    areaId: 'area-personal',
    startDate: '2026-01-01',
    targetDate: '2026-12-31',
    cadenceId: 'cadence-quarterly',
    priorityId: 'priority-high',
    successMetric: 'Complete all 4 quarterly reviews and annual retrospective',
    lastReviewDate: daysAgo(10),
    confidenceId: 'confidence-high',
    objective: 'Maintain strategic alignment and continuous improvement through structured reflection',
    requirements: [
      { id: 'req-12-1', text: 'Create quarterly review template', completed: true },
      { id: 'req-12-2', text: 'Schedule review dates in calendar', completed: true },
      { id: 'req-12-3', text: 'Define key questions for each review', completed: true },
      { id: 'req-12-4', text: 'Set up this goals tracking app', completed: true },
    ],
    definitionOfDone: [
      { id: 'dod-12-1', text: 'Q1 review completed', completed: false },
      { id: 'dod-12-2', text: 'Q2 review completed', completed: false },
      { id: 'dod-12-3', text: 'Q3 review completed', completed: false },
      { id: 'dod-12-4', text: 'Q4 review completed', completed: false },
      { id: 'dod-12-5', text: 'Annual retrospective completed', completed: false },
    ],
    keyDecisions: [
      {
        id: 'kd-12-1',
        date: '2026-01-05',
        context: 'Choosing goals tracking approach',
        options: ['Notion', 'Spreadsheet', 'Custom app', 'Paper journal'],
        chosen: 'Custom app',
        rationale: 'Tailored to exact workflow needed; built with Claude Code!',
      },
    ],
    tasks: [
      { id: 'task-12-1', projectId: 'proj-12', title: 'Schedule Q1 review day (late March)', statusId: 'task-next', dueDate: '2026-03-25', createdAt: daysAgo(5), updatedAt: daysAgo(5) },
      { id: 'task-12-2', projectId: 'proj-12', title: 'Prepare Q1 review agenda', statusId: 'task-backlog', createdAt: daysAgo(5), updatedAt: daysAgo(5) },
    ],
    metrics: {
      primaryMetric: 'Reviews completed',
      leadingIndicator: 'Review dates scheduled',
      riskIndicator: 'Days past scheduled review without completion',
    },
    reviewNotes: [
      {
        id: 'rn-12-1',
        date: daysAgo(10),
        notes: 'Goals app is live and working well for daily tracking.',
        progress: 'All goals captured and being tracked',
        blockers: 'None',
        changes: 'Added confidence field to track uncertainty',
        nextStep: 'Continue daily use through Q1',
      },
    ],
    failureCriteria: 'Miss more than 1 quarterly review',
    createdAt: '2026-01-01',
    updatedAt: daysAgo(5),
  },
];

// Notifications
export const notifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'user-1',
    type: 'ReviewDue',
    title: 'Review Due: Career Advancement',
    body: 'Your quarterly review for Career Advancement is overdue. Last reviewed 45 days ago.',
    projectId: 'proj-6',
    createdAt: daysAgo(1),
  },
  {
    id: 'notif-2',
    userId: 'user-1',
    type: 'DueSoon',
    title: 'Task Due Soon',
    body: 'Complete this week\'s reading chapters is due in 2 days.',
    projectId: 'proj-2',
    taskId: 'task-2-1',
    createdAt: daysAgo(0),
  },
  {
    id: 'notif-3',
    userId: 'user-1',
    type: 'DailyFocus',
    title: 'Your Daily Focus',
    body: 'You have 5 next actions ready across your active goals. Start with your highest priority items.',
    createdAt: daysAgo(0),
  },
  {
    id: 'notif-4',
    userId: 'user-1',
    type: 'StaleProject',
    title: 'Project Needs Attention',
    body: 'Family Travel has been in Todo status without updates. Consider starting or reviewing this goal.',
    projectId: 'proj-5',
    createdAt: daysAgo(2),
  },
];

// Export combined data
export const seedData = {
  users,
  workspaces,
  projects,
  notifications,
};
