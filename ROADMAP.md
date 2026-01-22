# Goals App - Feature Roadmap

This document outlines planned features, prioritized by impact and implementation complexity.

---

## Priority 1: Core UX (High Impact, Foundation)

These features significantly improve daily usability and should be implemented first.

### 1.1 Global Search & Command Palette (Cmd+K)

- [ ] Search across projects, tasks, and areas
- [ ] Quick navigation to any page
- [ ] Action shortcuts (new project, new task, etc.)
- [ ] Keyboard-first interface
- **Why:** Instant navigation, modern feel, power user essential

### 1.2 Keyboard Shortcuts

- [ ] Navigation: `g d` (go dashboard), `g b` (go board), `g p` (go projects)
- [ ] Actions: `n p` (new project), `n t` (new task)
- [ ] List navigation: `j/k` to move up/down, `Enter` to open
- [ ] `Escape` to close modals
- [ ] Help modal showing all shortcuts (`?`)
- **Why:** Power users expect this, dramatically speeds up workflow

### 1.3 Recurring Tasks / Habits

- [ ] Daily, weekly, monthly, custom recurrence
- [ ] Auto-generate next occurrence when completed
- [ ] Streak tracking for habits
- [ ] Visual indicator for recurring vs one-time tasks
- **Why:** Most goals involve habits, essential for goal tracking apps

---

## Priority 2: Motivation & Progress (User Retention)

Features that keep users engaged and motivated.

### 2.1 Progress Visualization & Stats

- [ ] Completion rate charts (weekly/monthly)
- [ ] Tasks completed over time graph
- [ ] Current streaks display
- [ ] Project progress bars with percentage
- [ ] "This week" summary card on dashboard
- **Why:** Visual progress is motivating, shows value of using the app

### 2.2 Goal Completion Celebration

- [ ] Confetti animation when project marked done
- [ ] Summary modal: time spent, tasks completed, reviews logged
- [ ] Option to share achievement
- [ ] Archive with completion stats preserved
- **Why:** Positive reinforcement, memorable moments

### 2.3 Weekly Review Flow

- [x] Guided weekly review prompts
- [x] "What went well?" / "What to improve?" / "Focus for next week?"
- [ ] Auto-surface stale projects and overdue items
- [x] Review history saved and browsable
- [ ] Reminder notification for weekly review
- **Why:** Differentiator feature, builds reflection habit

### 2.4 Monthly Review Cycles (NEW)

- [x] Monthly reflection and goal setting
- [x] "Highlights" / "Challenges" / "Goals Achieved" / "Goals for Next Month"
- [x] Lessons learned and gratitude sections
- [x] Rating system (1-5 stars)
- [x] Review history saved and browsable
- **Why:** Longer-term perspective on progress

### 2.5 Daily Journal & Habit Tracker (NEW)

- [x] Daily mood picker (terrible/bad/neutral/good/great)
- [x] Daily writing prompts
- [x] Main journal entry with wins/challenges/gratitude sections
- [x] Habit cards with one-tap completion
- [x] Habit streaks and progress tracking
- [x] Combined "Daily Rhythm" page
- **Why:** Builds daily reflection habit, essential for personal growth tracking

---

## Priority 3: Productivity Tools

Features that help users get more done.

### 3.1 Focus Mode / Pomodoro Timer

- [ ] Built-in timer (25/5 or custom intervals)
- [ ] Link timer session to specific task
- [ ] Session history and stats
- [ ] Optional: block distractions notification
- **Why:** Proven productivity technique, keeps users in-app

### 3.2 Quick Capture

- [ ] Global keyboard shortcut to add task from anywhere
- [ ] "Inbox" area for uncategorized quick captures
- [ ] Process inbox during review
- **Why:** Reduces friction for capturing ideas

### 3.3 Time Tracking (Optional)

- [ ] Start/stop timer on tasks
- [ ] Manual time entry
- [ ] Time spent per project/area reports
- [ ] Toggle on/off in settings
- **Why:** Useful for some users, insight into where time goes

---

## Priority 4: Organization & Flexibility

Features for power users who need more control.

### 4.1 Tags / Labels

- [ ] Create custom tags (cross-cutting categories)
- [ ] Filter by tags on board and project list
- [ ] Color-coded tags
- [ ] Multi-tag support per project/task
- **Why:** Flexible organization beyond areas

### 4.2 Custom Saved Views

- [ ] Save current filter/sort as named view
- [ ] Quick access to saved views in sidebar
- [ ] Share views (for team workspaces)
- **Why:** Power users need personalized workflows

### 4.3 Bulk Operations

- [ ] Multi-select projects/tasks (checkbox or shift+click)
- [ ] Bulk move to status
- [ ] Bulk archive/delete
- [ ] Bulk assign to area
- **Why:** Essential for managing large numbers of items

### 4.4 Project Templates

- [ ] Pre-built templates (fitness goal, learning goal, side project)
- [ ] Create template from existing project
- [ ] Quick-start from template
- **Why:** Reduces friction for common goal types

---

## Priority 5: Technical & Platform

Infrastructure improvements and platform features.

### 5.1 Offline Support (PWA)

- [ ] Service worker for offline access
- [ ] Local storage sync queue
- [ ] Conflict resolution on reconnect
- [ ] Install prompt for mobile
- **Why:** Works anywhere, feels native

### 5.2 Push Notifications

- [ ] Deadline reminders
- [ ] Review due notifications
- [ ] Weekly review prompt
- [ ] Configurable notification preferences
- **Why:** Keeps users engaged even when not in app

### 5.3 Calendar Integration

- [ ] Sync deadlines to Google/Apple Calendar
- [ ] Two-way sync option
- [ ] iCal feed export
- **Why:** Goals live alongside other commitments

### 5.4 Data Export & Backup

- [ ] Export all data as JSON
- [ ] Export as CSV (for spreadsheets)
- [ ] Scheduled automatic backups
- **Why:** Data ownership, user trust

---

## Priority 6: Advanced Features

Nice-to-haves for later.

### 6.1 Project Dependencies

- [ ] "Blocked by" relationships
- [ ] Visual dependency graph
- [ ] Auto-surface when blocker is resolved
- **Why:** Complex project management

### 6.2 Activity Timeline

- [ ] Chronological log of all actions
- [ ] Filter by project/area
- [ ] "What did I do yesterday?" view
- **Why:** Accountability and memory aid

### 6.3 Archive & History

- [ ] Dedicated archive view
- [ ] Search archived projects
- [ ] Restore from archive
- [ ] Permanent delete option
- **Why:** Clean active view while preserving history

### 6.4 AI-Powered Suggestions

- [ ] Suggest next actions based on patterns
- [ ] Smart deadline recommendations
- [ ] "You usually work on X on Mondays" insights
- **Why:** Differentiator, but complex to implement well

---

## Implementation Notes

### Getting Started

1. Pick a feature from Priority 1
2. Create a branch: `feature/command-palette`
3. Implement with tests
4. PR and merge to main

### Checklist for Each Feature

- [ ] Design/UX mockup (if UI-heavy)
- [ ] API changes needed?
- [ ] Database schema changes?
- [ ] Mobile responsive?
- [ ] Keyboard accessible?
- [ ] Loading/error states?
- [ ] Tests written?

---

## Progress Tracker

| Feature                | Priority | Status      | Notes                                              |
| ---------------------- | -------- | ----------- | -------------------------------------------------- |
| Global Search (Cmd+K)  | P1       | Done        | Command palette with search, navigation, actions   |
| Keyboard Shortcuts     | P1       | Done        | D/B/P/C/N/S/R/W/M nav, Shift+N new project, ? help |
| Recurring Tasks        | P1       | Done        | Daily/weekly/monthly/yearly + streaks              |
| Progress Charts        | P2       | Not Started |                                                    |
| Completion Celebration | P2       | Not Started |                                                    |
| Weekly Review Flow     | P2       | Done        | Guided prompts, rating, history, stats             |
| Monthly Review Cycles  | P2       | Done        | Full monthly reflection and goal setting           |
| Daily Journal          | P2       | Done        | Mood picker, prompts, wins/challenges/gratitude    |
| Habit Tracker          | P2       | Done        | Habit cards, streaks, one-tap completion           |
| Focus Mode / Pomodoro  | P3       | Not Started |                                                    |
| Quick Capture          | P3       | Not Started |                                                    |
| Time Tracking          | P3       | Not Started |                                                    |
| Tags / Labels          | P4       | Not Started |                                                    |
| Saved Views            | P4       | Not Started |                                                    |
| Bulk Operations        | P4       | Not Started |                                                    |
| Project Templates      | P4       | Not Started |                                                    |
| Offline PWA            | P5       | Not Started |                                                    |
| Push Notifications     | P5       | Not Started |                                                    |
| Calendar Integration   | P5       | Not Started |                                                    |
| Data Export            | P5       | Not Started |                                                    |
| Project Dependencies   | P6       | Not Started |                                                    |
| Activity Timeline      | P6       | Not Started |                                                    |
| Archive View           | P6       | Not Started |                                                    |
| AI Suggestions         | P6       | Not Started |                                                    |
