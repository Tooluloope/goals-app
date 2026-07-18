# Alignia Product Feedback Review — Prioritized Backlog

> **Reviewed by:** Senior PM (AI-assisted)
> **Date:** 2026-02-26
> **Source:** External UX review of app.alignia.xyz
> **Method:** Each reported issue validated against codebase before prioritization

---

## Priority Scale

| Level  | Label    | Definition                                                             |
| ------ | -------- | ---------------------------------------------------------------------- |
| **P0** | Critical | Broken core functionality; directly causes user churn or loss of trust |
| **P1** | High     | Significant UX degradation; blocks key workflows or causes confusion   |
| **P2** | Medium   | Noticeable friction; doesn't block usage but hurts perceived quality   |
| **P3** | Low      | Polish/nice-to-have; improves experience but low urgency               |
| **--** | Invalid  | Claim not substantiated by codebase or based on incorrect assumptions  |

---

## P0 — Critical

### 1. Project Progress Shows 0% Despite Active Habit Tracking

**Reported:** All projects show 0% progress even when habits are being tracked.
**Validated:** TRUE. `calculateProjectProgress()` in `lib/utils.ts` only counts `requirements`, `definitionOfDone`, and `tasks`. Habits are excluded entirely from the progress calculation, even though habits are the primary daily interaction users have with projects.
**Impact:** This is the single most demotivating issue. Users do daily work (check off habits) and the system tells them they've made zero progress. Erodes trust in the app's value proposition.
**Recommendation:** Include weighted habit completion rates in the project progress formula. The `weight` field already exists on habits — use it.

---

### 2. AI Insights Are Display-Only Despite "Actionable" Badge

**Reported:** AI Insight cards show an "Actionable" badge but clicking them does nothing.
**Validated:** TRUE. The `actionable` boolean on `AiInsight` is purely a display flag (`ai-insight-card.tsx`). Users can only dismiss or regenerate insights. There are no action buttons, no navigation to related goals, and no way to convert an insight into a task or habit adjustment.
**Impact:** AI is a headline feature of the app. Showing "Actionable" insights that aren't actionable breaks the promise and trains users to ignore AI recommendations entirely.
**Recommendation:** Add contextual action buttons per insight type (e.g., "Adjust goal" → navigates to goal editor, "Create habit" → opens habit creation pre-filled with suggestion). Link insights to the entities they reference via metadata.

---

## P1 — High

### 3. Navigation Has 14 Top-Level Items (Personal Workspace)

**Reported:** 15+ navigation items, overwhelming for users.
**Validated:** PARTIALLY TRUE. Personal workspace has 14 items; family workspace has 10. Not 15+ but still a high cognitive load.
**Nuance:** The claim that "Tasks and Board show the same data" is FALSE — Tasks shows tasks grouped by due date, Board shows projects in kanban by status. These serve distinct purposes.
**Impact:** New users face choice paralysis. Core daily actions (check habits, review progress, plan) are buried among power-user features (Dependencies, Roadmap).
**Recommendation:**

- Group related items: "Reviews" (weekly + monthly as tabs), "Planning" (Roadmap + Dependencies)
- Consider a progressive disclosure model: show core items by default, advanced features behind "More" or settings toggle
- Keep Tasks and Board as separate items — they serve different needs

### 4. Unclear Terminology Creates Confusion

**Reported:** Mixing of "Projects", "Goals", "Tasks" without clear hierarchy; "Daily Rhythm", "Board" are non-obvious names.
**Validated:** TRUE. The codebase uses "Project" as the entity name throughout, but in the UI projects function as life-area goals. "Daily Rhythm" is confirmed as the habit check-in + journal page — not self-explanatory for new users.
**Impact:** Users can't build a mental model of the app. Without understanding the hierarchy (Areas → Goals → Tasks → Habits), they won't know where to go for what.
**Recommendation:**

- Add a brief subtitle or description to each nav item on first use
- Consider renaming: "Daily Rhythm" → "Today's Habits" or "Daily Check-in"; "Board" → "Goal Board"
- Add a persistent hierarchy breadcrumb when inside a project/goal

### 5. Login Page Doesn't Detect Active Sessions

**Reported:** Clicking "Sign Up" while logged in redirects to dashboard instead of signup page. No /auth/register redirect.
**Validated:** TRUE. `login-form.tsx` and `signup-form.tsx` do not check for existing sessions on mount. `AuthGuard` protects app routes but doesn't redirect authenticated users away from auth pages. No `/auth/register` route exists.
**Impact:** Confusing for returning users and bad for any external links or bookmarks pointing to /auth/register.
**Recommendation:**

- Add session check in auth pages: if authenticated, show "You're already logged in" with link to dashboard
- Add `/auth/register` → `/auth/signup` redirect in Next.js middleware

### 6. Search (Cmd+K) Only Finds Projects

**Reported:** Global search doesn't surface tasks, habits, or journal entries.
**Validated:** TRUE. `command-palette.tsx` only searches project names/areas and provides navigation shortcuts. No task, habit, or journal search.
**Impact:** As data grows, users lose the ability to quickly find things. This becomes more painful over time.
**Recommendation:** Expand search to include tasks (by name), habits (by name), and goals (by objective). Journal search can be a later phase.

---

## P2 — Medium

### 7. Weekly/Monthly Review Submission Time-Locked

**Reported:** Weekly review only submittable on Saturday/Sunday; monthly only in last 3 days.
**Validated:** TRUE. `isEndOfWeek` checks for `isSaturday || isSunday`, `isEndOfMonth` checks `currentDay >= daysInMonth - 2`. Drafts are saved but submit button is hidden outside these windows.
**Impact:** Users who want to reflect on Friday evening or mid-week can't submit. The restriction feels arbitrary for a personal productivity tool.
**Recommendation:** Allow submission anytime but show a soft nudge ("Reviews are typically completed on weekends — submit now anyway?"). Keep the draft system.

### 8. Create Goal Modal — Default Area Not Contextual

**Reported:** "Areas" defaults to "Faith" regardless of context.
**Validated:** PARTIALLY TRUE. It defaults to the first area in workspace config (which is often "Faith" since it's alphabetically or configuration-first). It does NOT auto-detect context (e.g., opening from within the "Health" project doesn't pre-select Health).
**Impact:** Minor friction — users always have to change the dropdown when creating goals from within a specific area.
**Recommendation:** Pass the current area context to the modal when opened from within a project. Default to empty/unselected when opened from global actions.

### 9. Habit Names Truncated on Mobile

**Reported:** Habit names get cut off with ellipsis.
**Validated:** PARTIALLY TRUE. Desktop cards use `break-words` (text wraps). However, the mobile habit sheet explicitly uses `truncate` class on habit names (`p className="truncate text-sm font-semibold"`). Cards also have `overflow-hidden`.
**Impact:** Users can't read what habit they're checking off on mobile — the primary device for daily habit tracking.
**Recommendation:** Remove `truncate` on mobile sheet header. Allow 2-line wrapping for habit names. Consider a tooltip or expand-on-tap for very long names.

### 10. Profile Settings Shows Raw URL Input for Avatar

**Reported:** Users see a raw URL text field alongside an upload button.
**Validated:** TRUE. `settings/page.tsx` renders both an `<Input type="url">` for pasting URLs and a file upload button side-by-side.
**Impact:** The URL field looks like a developer tool and confuses non-technical users. Most users expect file upload only.
**Recommendation:** Hide the URL input by default. Show only the upload button and a preview of the current avatar. Add "Use URL instead" as an advanced option.

### 11. Empty States Lack Guidance

**Reported:** Dependencies and Notifications pages show minimal empty states with no explanation.
**Validated:** PARTIALLY TRUE. Both pages DO have empty state messages ("No active blockers", "All caught up!"), but neither explains what the feature does, how to create dependencies, or what kinds of notifications the app generates.
**Impact:** New users discover features but have no way to learn what they do or how to use them.
**Recommendation:** Add a brief 1-2 sentence explanation + a CTA in empty states. E.g., for Dependencies: "Dependencies help you track which goals block others. Add a dependency from any goal's detail page."

### 12. Create Goal Modal — Confidence Field Unexplained

**Reported:** "Confidence" field labeled "Medium" is unclear — confidence in what?
**Validated:** TRUE. The field exists with a dropdown (Low/Medium/High) but no tooltip or helper text explaining what it measures.
**Impact:** Users either ignore it or guess, reducing the quality of goal data.
**Recommendation:** Add helper text: "How confident are you that you'll achieve this goal by the target date?" Consider linking it to progress tracking.

---

## P3 — Low

### 13. Mobile Has Two Competing Navigation Systems

**Reported:** Hamburger menu + bottom nav bar create confusion.
**Validated:** PARTIALLY TRUE. Bottom nav shows 5 core items (Today, AI, Rhythm, Board, Settings). Full sidebar is accessible via hamburger. These are NOT duplicates — bottom nav is a curated subset.
**Impact:** Low. This is actually a common mobile pattern (Instagram, YouTube, etc.). The issue is more about which items appear in the bottom bar vs. requiring the hamburger.
**Recommendation:** No immediate action needed. Consider if the 5 bottom items are the right ones based on usage analytics. "AI" and "Board" might not be the most-used daily actions.

### 14. Dashboard Empty Cards Take Up Space

**Reported:** "No upcoming deadlines" shows a large empty card.
**Validated:** TRUE. The dashboard grid renders widget cards regardless of whether they have content.
**Impact:** Wasted space on an otherwise well-spaced dashboard (max-w-4xl, space-y-6).
**Recommendation:** Collapse or minimize empty cards. Show them as a single-line "No upcoming deadlines" instead of a full card.

### 15. Goal Name vs. Objective Field Feels Redundant

**Reported:** Both "Goal name" and "Objective" are required and feel similar.
**Validated:** TRUE but intentional. "Goal name" is a short label; "Objective" is a rich-text field for describing what you want to achieve.
**Impact:** Low — once users understand the difference, it's useful. But the initial confusion is real.
**Recommendation:** Add placeholder text that makes the distinction clear. E.g., Goal name: "Run a marathon", Objective: "Complete a full marathon by December to improve cardiovascular health and prove I can commit to a long-term fitness goal."

---

## Invalid / Not Substantiated

### Admin Link Visible to Regular Users

**Reported:** "Admin" link in sidebar would confuse regular users.
**Finding:** FALSE. The Admin link is conditionally rendered only for users with `ADMIN` or `SUPER_ADMIN` roles. Regular users never see it.

### No Onboarding Exists

**Reported:** No onboarding tutorial or walkthrough for new users.
**Finding:** PARTIALLY FALSE. An onboarding flow exists at `/onboarding/vision` and `/onboarding/invite` with focus area selection, progress indicators, and workspace config syncing. It triggers automatically after signup. However, it doesn't cover the full app hierarchy (Projects → Goals → Tasks), so the concern about lacking a conceptual walkthrough is partially valid — captured under Issue #4 (Terminology) and Issue #11 (Empty States) instead.

### Calendar Shows Sparse Information

**Reported:** Events only on 2 days, looks empty.
**Finding:** NOT A BUG. Calendar populates from project deadlines, start dates, review-due dates, and task due dates. The sparse appearance is a function of the user's data, not a system issue. The "+9 more" expand functionality exists.

---

## Execution Roadmap (Suggested)

| Phase       | Issues               | Theme                                                  | Est. Effort |
| ----------- | -------------------- | ------------------------------------------------------ | ----------- |
| **Phase 1** | #1, #2               | Fix broken core signals (progress + AI)                | Medium      |
| **Phase 2** | #4, #5, #11          | Clarity & onboarding (terminology, auth, empty states) | Medium      |
| **Phase 3** | #3, #6               | Navigation & search improvements                       | Large       |
| **Phase 4** | #7, #8, #9, #10, #12 | UX polish (reviews, modals, mobile, settings)          | Medium      |
| **Phase 5** | #13, #14, #15        | Low-priority refinements                               | Small       |
