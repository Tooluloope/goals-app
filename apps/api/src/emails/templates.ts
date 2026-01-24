export type BaseEmailData = {
  toName?: string;
  appName?: string;
  actionUrl?: string;
  supportUrl?: string;
  unsubscribeUrl?: string;
  logoUrl?: string;
};

export type SummaryData = BaseEmailData & {
  periodLabel: string; // e.g. "This week", "January", "2026"
  highlights?: string[];
  metrics?: { label: string; value: string }[];
  ctaLabel?: string;
};

export type ReminderData = BaseEmailData & {
  habitName?: string;
  journalDate?: string;
  streak?: number;
};

export type InviteData = BaseEmailData & {
  inviterName?: string;
  workspaceName?: string;
  inviterAvatar?: string;
};

export type SecurityData = BaseEmailData & {
  location?: string;
  device?: string;
  time?: string;
};

export type StreakData = BaseEmailData & {
  habitName?: string;
  streakDays: number;
  milestone?: '7' | '30' | '100' | '365';
};

export type GoalData = BaseEmailData & {
  goalName: string;
  projectName?: string;
  completedTasks?: number;
  totalDays?: number;
};

export type InsightData = BaseEmailData & {
  insightTitle: string;
  insightContent: string;
  insightType?: 'pattern' | 'recommendation' | 'celebration' | 'milestone';
};

export type InactivityData = BaseEmailData & {
  daysSinceActive: number;
  lastActivity?: string;
};

export type StaleProjectData = BaseEmailData & {
  projectName: string;
  daysSinceUpdate: number;
  lastActivity?: string;
  projectStatus?: string;
};

export type ReviewDueData = BaseEmailData & {
  projectName: string;
  reviewType: 'weekly' | 'monthly' | 'cadence';
  daysSinceLastReview: number;
  cadence?: string;
};

export interface EmailTemplate<T extends BaseEmailData = BaseEmailData> {
  subject: (data: T) => string;
  html: (data: T) => string;
  text: (data: T) => string;
}

const defaultApp = 'Goals';
const defaultLogoUrl = 'https://goals-app.com/logo.png'; // Replace with actual logo URL

// SVG Icons as inline data URIs for better email compatibility
const icons = {
  target: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  check: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  flame: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
  mail: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  shield: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  trophy: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`,
  sparkles: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>`,
  brain: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.54"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.54"/></svg>`,
  calendar: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
  heart: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  users: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  book: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`,
  key: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>`,
  alertTriangle: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>`,
};

// Color themes for different email types
const themes = {
  primary: { bg: '#4f46e5', light: '#eef2ff', text: '#312e81' },
  success: { bg: '#10b981', light: '#ecfdf5', text: '#065f46' },
  warning: { bg: '#f59e0b', light: '#fffbeb', text: '#92400e' },
  danger: { bg: '#ef4444', light: '#fef2f2', text: '#991b1b' },
  purple: { bg: '#8b5cf6', light: '#f5f3ff', text: '#5b21b6' },
  blue: { bg: '#3b82f6', light: '#eff6ff', text: '#1e40af' },
};

function renderLayout(
  title: string,
  body: string,
  data: BaseEmailData,
  options: { icon?: string; theme?: keyof typeof themes; headerBg?: boolean } = {}
): string {
  const appName = data.appName || defaultApp;
  // logoUrl available for future use in email templates
  const _logoUrl = data.logoUrl || defaultLogoUrl;
  const theme = themes[options.theme || 'primary'];

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
      <style>
        :root { color-scheme: light; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%); color: #0f172a; line-height: 1.6; }
        .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .card { background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1); }
        .header { background: ${options.headerBg ? `linear-gradient(135deg, ${theme.bg} 0%, ${theme.bg}dd 100%)` : '#ffffff'}; padding: 28px; text-align: center; ${options.headerBg ? 'color: #ffffff;' : ''} }
        .logo { width: 48px; height: 48px; margin-bottom: 12px; }
        .logo-text { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; ${options.headerBg ? 'color: #ffffff;' : `color: ${theme.bg};`} }
        .icon-wrapper { width: 64px; height: 64px; margin: 0 auto 16px; background: ${options.headerBg ? 'rgba(255,255,255,0.15)' : theme.light}; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
        .icon-wrapper svg { color: ${options.headerBg ? '#ffffff' : theme.bg}; width: 32px; height: 32px; }
        .content { padding: 32px 28px; }
        .title { font-size: 24px; font-weight: 700; margin: 0 0 8px; color: #0f172a; letter-spacing: -0.5px; }
        .subtitle { font-size: 16px; color: #64748b; margin: 0 0 24px; }
        .muted { color: #64748b; font-size: 14px; }
        .btn { display: inline-block; background: linear-gradient(135deg, ${theme.bg} 0%, ${theme.bg}cc 100%); color: #ffffff !important; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 15px; box-shadow: 0 4px 14px ${theme.bg}40; transition: all 0.2s; }
        .btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px ${theme.bg}50; }
        .btn-secondary { background: ${theme.light}; color: ${theme.bg} !important; box-shadow: none; }
        .pill { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 999px; background: ${theme.light}; color: ${theme.text}; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .pill svg { width: 14px; height: 14px; }
        .metric-card { background: #f8fafc; border-radius: 12px; padding: 16px; margin: 8px 0; }
        .metric-value { font-size: 28px; font-weight: 700; color: ${theme.bg}; }
        .metric-label { font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
        ul { padding-left: 0; list-style: none; margin: 16px 0; }
        ul li { padding: 10px 0; padding-left: 28px; position: relative; border-bottom: 1px solid #f1f5f9; }
        ul li:last-child { border-bottom: none; }
        ul li::before { content: '✓'; position: absolute; left: 0; color: ${theme.bg}; font-weight: 700; }
        .divider { height: 1px; background: linear-gradient(90deg, transparent, #e2e8f0, transparent); margin: 24px 0; }
        .highlight-box { background: ${theme.light}; border-left: 4px solid ${theme.bg}; border-radius: 0 12px 12px 0; padding: 16px 20px; margin: 20px 0; }
        .highlight-box p { margin: 0; color: ${theme.text}; }
        .footer { padding: 24px 28px; background: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center; }
        .footer-text { color: #94a3b8; font-size: 12px; line-height: 20px; margin: 0; }
        .footer-links { margin-top: 12px; }
        .footer-links a { color: #64748b; text-decoration: none; margin: 0 8px; font-size: 12px; }
        .footer-links a:hover { color: ${theme.bg}; }
        .social-links { margin-top: 16px; }
        .social-links a { display: inline-block; margin: 0 6px; }
        .streak-badge { display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; padding: 12px 20px; border-radius: 999px; font-weight: 700; font-size: 18px; }
        .streak-badge svg { width: 24px; height: 24px; }
        .celebration { text-align: center; padding: 20px; }
        .celebration-emoji { font-size: 48px; margin-bottom: 16px; }
        .progress-bar { background: #e2e8f0; border-radius: 999px; height: 8px; overflow: hidden; margin: 16px 0; }
        .progress-fill { background: linear-gradient(90deg, ${theme.bg}, ${theme.bg}cc); height: 100%; border-radius: 999px; }
        .avatar { width: 48px; height: 48px; border-radius: 50%; background: ${theme.light}; display: flex; align-items: center; justify-content: center; font-weight: 700; color: ${theme.bg}; font-size: 18px; }
        .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
        .info-row:last-child { border-bottom: none; }
        .info-label { color: #64748b; font-size: 14px; }
        .info-value { font-weight: 600; color: #0f172a; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="card">
          <div class="header">
            ${options.icon ? `<div class="icon-wrapper">${options.icon}</div>` : ''}
            <div class="logo-text">${appName}</div>
          </div>
          <div class="content">
            ${body}
          </div>
          <div class="footer">
            <p class="footer-text">
              You're receiving this email because you have an account with ${appName}.
            </p>
            <div class="footer-links">
              <a href="${data.supportUrl || '#'}">Help Center</a>
              <span style="color: #cbd5e1;">•</span>
              <a href="${data.unsubscribeUrl || '#'}">Unsubscribe</a>
            </div>
          </div>
        </div>
      </div>
    </body>
  </html>`;
}

function bulletList(items?: string[]): string {
  if (!items || !items.length) return '';
  return `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
}

function metricsGrid(metrics?: { label: string; value: string }[]): string {
  if (!metrics || !metrics.length) return '';
  return `<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 20px 0;">
    ${metrics
      .map(
        (m) => `<div class="metric-card">
          <div class="metric-value">${m.value}</div>
          <div class="metric-label">${m.label}</div>
        </div>`
      )
      .join('')}
  </div>`;
}

function infoRows(items: { label: string; value: string }[]): string {
  return items
    .map(
      (item) => `<div class="info-row">
        <span class="info-label">${item.label}</span>
        <span class="info-value">${item.value}</span>
      </div>`
    )
    .join('');
}

const actionButton = (data: BaseEmailData, label = 'Open', secondary = false) =>
  data.actionUrl
    ? `<div style="text-align: center; margin-top: 24px;"><a class="btn${secondary ? ' btn-secondary' : ''}" href="${data.actionUrl}">${label}</a></div>`
    : '';

// Progress bar helper for future summary emails
function _progressBar(percent: number): string {
  return `<div class="progress-bar"><div class="progress-fill" style="width: ${Math.min(100, percent)}%;"></div></div>`;
}

export const emailTemplates = {
  // ============================================
  // ONBOARDING & AUTHENTICATION
  // ============================================

  welcome: {
    subject: ({ appName = defaultApp }) => `Welcome to ${appName}! 🎯`,
    html: (data: BaseEmailData) =>
      renderLayout(
        'Welcome',
        `<div class="celebration">
           <div class="celebration-emoji">🎉</div>
         </div>
         <h1 class="title" style="text-align: center;">Welcome aboard${data.toName ? ', ' + data.toName : ''}!</h1>
         <p class="subtitle" style="text-align: center;">You're set to start building better habits and achieving your goals.</p>

         <div class="highlight-box">
           <p><strong>Quick start tips:</strong></p>
           <ul>
             <li>Create your first project or goal</li>
             <li>Set up daily habits to track</li>
             <li>Write your first journal entry</li>
           </ul>
         </div>

         ${actionButton(data, 'Launch App →')}

         <div class="divider"></div>
         <p class="muted" style="text-align: center;">💡 Tip: Set your timezone in settings so streaks reset at the right time.</p>`,
        data,
        { icon: icons.sparkles, theme: 'primary', headerBg: true }
      ),
    text: (data: BaseEmailData) =>
      `Welcome${data.toName ? ' ' + data.toName : ''}!

You're set to start building better habits and achieving your goals.

Quick start tips:
- Create your first project or goal
- Set up daily habits to track
- Write your first journal entry

Get started: ${data.actionUrl || ''}

Tip: Set your timezone in settings so streaks reset at the right time.`,
  } satisfies EmailTemplate,

  verifyEmail: {
    subject: () => 'Verify your email address ✉️',
    html: (data: BaseEmailData) =>
      renderLayout(
        'Verify email',
        `<h1 class="title">Confirm your email</h1>
         <p class="subtitle">One quick step to secure your account and unlock all features.</p>

         ${actionButton(data, 'Verify Email Address')}

         <div class="divider"></div>
         <div class="highlight-box">
           <p>⏱️ This link expires in <strong>30 minutes</strong> for your security.</p>
         </div>
         <p class="muted" style="text-align: center;">If you didn't create an account, you can safely ignore this email.</p>`,
        data,
        { icon: icons.mail, theme: 'blue' }
      ),
    text: (data: BaseEmailData) => `Verify your email address

Click here to verify: ${data.actionUrl || ''}

This link expires in 30 minutes.

If you didn't create an account, you can safely ignore this email.`,
  } satisfies EmailTemplate,

  resetPassword: {
    subject: () => 'Reset your password 🔑',
    html: (data: BaseEmailData) =>
      renderLayout(
        'Reset password',
        `<h1 class="title">Reset your password</h1>
         <p class="subtitle">Click the button below to choose a new secure password.</p>

         ${actionButton(data, 'Reset Password')}

         <div class="divider"></div>
         <div class="highlight-box">
           <p>⏱️ This link expires in <strong>30 minutes</strong> for your security.</p>
         </div>
         <p class="muted" style="text-align: center;">If you didn't request this, you can safely ignore this email. Your password won't be changed.</p>`,
        data,
        { icon: icons.key, theme: 'purple' }
      ),
    text: (data: BaseEmailData) => `Reset your password

Click here to reset: ${data.actionUrl || ''}

This link expires in 30 minutes.

If you didn't request this, you can safely ignore this email.`,
  } satisfies EmailTemplate,

  passwordChanged: {
    subject: () => 'Your password was changed ✅',
    html: (data: BaseEmailData) =>
      renderLayout(
        'Password changed',
        `<h1 class="title">Password successfully updated</h1>
         <p class="subtitle">Your account password has been changed.</p>

         <div class="highlight-box" style="background: #fef2f2; border-color: #ef4444;">
           <p style="color: #991b1b;">⚠️ <strong>Wasn't you?</strong> Secure your account immediately by resetting your password.</p>
         </div>

         ${actionButton(data, 'Secure My Account')}

         <p class="muted" style="text-align: center; margin-top: 24px;">If this was you, no further action is needed.</p>`,
        data,
        { icon: icons.shield, theme: 'success' }
      ),
    text: (data: BaseEmailData) => `Your password was changed

If this was you, no action is needed.

If this wasn't you, secure your account immediately: ${data.actionUrl || ''}`,
  } satisfies EmailTemplate,

  // ============================================
  // COLLABORATION
  // ============================================

  workspaceInvite: {
    subject: ({ workspaceName = 'a workspace' }) => `You're invited to join ${workspaceName} 👋`,
    html: (data: InviteData) =>
      renderLayout(
        'Workspace invite',
        `<h1 class="title">You've been invited!</h1>
         <p class="subtitle">Join <strong>${data.workspaceName || 'the workspace'}</strong> and start collaborating.</p>

         <div style="display: flex; align-items: center; gap: 16px; padding: 20px; background: #f8fafc; border-radius: 12px; margin: 20px 0;">
           <div class="avatar">${(data.inviterName || 'T')[0].toUpperCase()}</div>
           <div>
             <div style="font-weight: 600; color: #0f172a;">${data.inviterName || 'A teammate'}</div>
             <div class="muted">invited you to collaborate</div>
           </div>
         </div>

         ${actionButton(data, 'Accept Invitation')}

         <p class="muted" style="text-align: center; margin-top: 24px;">Invitations expire after a short while—accept to keep the momentum going!</p>`,
        data,
        { icon: icons.users, theme: 'purple' }
      ),
    text: (data: InviteData) => `You're invited to join ${data.workspaceName || 'a workspace'}!

${data.inviterName || 'A teammate'} invited you to collaborate.

Accept the invitation: ${data.actionUrl || ''}`,
  } satisfies EmailTemplate<InviteData>,

  // ============================================
  // HABITS & REMINDERS
  // ============================================

  habitReminder: {
    subject: ({ habitName = 'Your habit' }) => `🔔 Reminder: ${habitName}`,
    html: (data: ReminderData) =>
      renderLayout(
        'Habit reminder',
        `<h1 class="title">Time for your habit${data.toName ? ', ' + data.toName : ''}!</h1>
         <p class="subtitle">${data.habitName || 'Your habit'} is waiting for you today.</p>

         ${
           data.streak
             ? `<div style="text-align: center; margin: 24px 0;">
              <div class="streak-badge">
                ${icons.flame}
                <span>${data.streak} day streak</span>
              </div>
            </div>`
             : ''
         }

         <div class="highlight-box">
           <p>💪 Keep the momentum going! Consistency is the key to building lasting habits.</p>
         </div>

         ${actionButton(data, "Complete Today's Habits")}`,
        data,
        { icon: icons.target, theme: 'success' }
      ),
    text: (data: ReminderData) => `Reminder: ${data.habitName || 'Your habit'} today

${data.streak ? `Current streak: ${data.streak} days!` : ''}

Log your habit: ${data.actionUrl || ''}`,
  } satisfies EmailTemplate<ReminderData>,

  journalNudge: {
    subject: () => '📝 Take a moment to reflect',
    html: (data: ReminderData) =>
      renderLayout(
        'Journal nudge',
        `<h1 class="title">A moment for reflection</h1>
         <p class="subtitle">Take 2 minutes to capture your thoughts for ${data.journalDate || 'today'}.</p>

         <div class="highlight-box">
           <p>✨ <strong>Why journal?</strong> Regular reflection helps you:</p>
           <ul>
             <li>Track your emotional patterns</li>
             <li>Celebrate small wins</li>
             <li>Gain clarity on your goals</li>
           </ul>
         </div>

         ${actionButton(data, 'Open Journal')}`,
        data,
        { icon: icons.book, theme: 'purple' }
      ),
    text: (data: ReminderData) => `Take a moment to reflect

Capture your thoughts for ${data.journalDate || 'today'}.

Open your journal: ${data.actionUrl || ''}`,
  } satisfies EmailTemplate<ReminderData>,

  // ============================================
  // SUMMARIES & REVIEWS
  // ============================================

  weeklySummary: {
    subject: () => '📊 Your weekly progress summary',
    html: (data: SummaryData) =>
      renderLayout(
        'Weekly summary',
        `<h1 class="title">${data.periodLabel || 'This Week'} at a Glance</h1>
         <p class="subtitle">Here's how you did this week. Keep up the great work!</p>

         ${metricsGrid(data.metrics)}

         ${
           data.highlights && data.highlights.length > 0
             ? `<div style="margin-top: 24px;">
              <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 12px;">Highlights</h3>
              ${bulletList(data.highlights)}
            </div>`
             : ''
         }

         ${actionButton(data, data.ctaLabel || 'View Full Dashboard')}`,
        data,
        { icon: icons.calendar, theme: 'blue' }
      ),
    text: (data: SummaryData) => `${data.periodLabel || 'This week'} Summary

${(data.metrics || []).map((m) => `${m.label}: ${m.value}`).join('\n')}

${data.highlights ? 'Highlights:\n' + data.highlights.join('\n') : ''}

View dashboard: ${data.actionUrl || ''}`,
  } satisfies EmailTemplate<SummaryData>,

  monthlySummary: {
    subject: ({ periodLabel = 'This month' }) => `📅 ${periodLabel} in Review`,
    html: (data: SummaryData) =>
      renderLayout(
        'Monthly summary',
        `<h1 class="title">${data.periodLabel || 'This Month'} in Review</h1>
         <p class="subtitle">A look back at your progress and achievements.</p>

         ${metricsGrid(data.metrics)}

         ${
           data.highlights && data.highlights.length > 0
             ? `<div style="margin-top: 24px;">
              <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 12px;">Key Achievements</h3>
              ${bulletList(data.highlights)}
            </div>`
             : ''
         }

         ${actionButton(data, data.ctaLabel || 'See Detailed Report')}`,
        data,
        { icon: icons.calendar, theme: 'purple' }
      ),
    text: (data: SummaryData) => `${data.periodLabel || 'This month'} Review

${(data.metrics || []).map((m) => `${m.label}: ${m.value}`).join('\n')}

${data.highlights ? 'Key Achievements:\n' + data.highlights.join('\n') : ''}

View report: ${data.actionUrl || ''}`,
  } satisfies EmailTemplate<SummaryData>,

  yearlyReview: {
    subject: ({ periodLabel = 'Your year' }) => `🎊 ${periodLabel} in Review`,
    html: (data: SummaryData) =>
      renderLayout(
        'Year in review',
        `<div class="celebration">
           <div class="celebration-emoji">🎊</div>
         </div>
         <h1 class="title" style="text-align: center;">${data.periodLabel || 'Your Year'} in Review</h1>
         <p class="subtitle" style="text-align: center;">What an incredible journey! Here's your year at a glance.</p>

         ${metricsGrid(data.metrics)}

         ${
           data.highlights && data.highlights.length > 0
             ? `<div style="margin-top: 24px;">
              <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 12px;">Year Highlights</h3>
              ${bulletList(data.highlights)}
            </div>`
             : ''
         }

         ${actionButton(data, data.ctaLabel || 'Explore Full Review')}`,
        data,
        { icon: icons.trophy, theme: 'primary', headerBg: true }
      ),
    text: (data: SummaryData) => `${data.periodLabel || 'Your year'} in Review

What an incredible journey!

${(data.metrics || []).map((m) => `${m.label}: ${m.value}`).join('\n')}

${data.highlights ? 'Year Highlights:\n' + data.highlights.join('\n') : ''}

Explore full review: ${data.actionUrl || ''}`,
  } satisfies EmailTemplate<SummaryData>,

  // ============================================
  // SECURITY
  // ============================================

  securityAlert: {
    subject: () => '🔐 New sign-in to your account',
    html: (data: SecurityData) =>
      renderLayout(
        'Security alert',
        `<h1 class="title">New sign-in detected</h1>
         <p class="subtitle">We noticed a new sign-in to your account.</p>

         <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0;">
           ${infoRows([
             { label: 'Location', value: data.location || 'Unknown' },
             { label: 'Device', value: data.device || 'Unknown' },
             { label: 'Time', value: data.time || 'Just now' },
           ])}
         </div>

         <div class="highlight-box" style="background: #fef2f2; border-color: #ef4444;">
           <p style="color: #991b1b;">⚠️ <strong>Wasn't you?</strong> Reset your password immediately to secure your account.</p>
         </div>

         ${actionButton(data, 'Review Account Activity')}`,
        data,
        { icon: icons.shield, theme: 'warning' }
      ),
    text: (data: SecurityData) => `New sign-in detected

Location: ${data.location || 'Unknown'}
Device: ${data.device || 'Unknown'}
Time: ${data.time || 'Just now'}

If this wasn't you, secure your account: ${data.actionUrl || ''}`,
  } satisfies EmailTemplate<SecurityData>,

  // ============================================
  // ACHIEVEMENTS & MILESTONES
  // ============================================

  streakMilestone: {
    subject: ({ streakDays, habitName = 'your habit' }: StreakData) =>
      `🔥 Amazing! ${streakDays} day streak on ${habitName}!`,
    html: (data: StreakData) => {
      const milestoneEmoji =
        data.streakDays >= 365
          ? '🏆'
          : data.streakDays >= 100
            ? '⭐'
            : data.streakDays >= 30
              ? '🌟'
              : '🔥';
      const milestoneMessage =
        data.streakDays >= 365
          ? "A full year! You're a habit master!"
          : data.streakDays >= 100
            ? 'Triple digits! Incredible dedication!'
            : data.streakDays >= 30
              ? "A whole month! You're building real momentum!"
              : "One week down! You're on your way!";

      return renderLayout(
        'Streak milestone',
        `<div class="celebration">
           <div class="celebration-emoji">${milestoneEmoji}</div>
         </div>
         <h1 class="title" style="text-align: center;">Incredible streak!</h1>
         <p class="subtitle" style="text-align: center;">${milestoneMessage}</p>

         <div style="text-align: center; margin: 24px 0;">
           <div class="streak-badge">
             ${icons.flame}
             <span>${data.streakDays} days</span>
           </div>
         </div>

         <div class="highlight-box">
           <p style="text-align: center;"><strong>${data.habitName || 'Your habit'}</strong> is becoming second nature. Keep it up!</p>
         </div>

         ${actionButton(data, 'View Your Progress')}`,
        data,
        { icon: icons.trophy, theme: 'success', headerBg: true }
      );
    },
    text: (data: StreakData) =>
      `🔥 ${data.streakDays} day streak on ${data.habitName || 'your habit'}!

Amazing dedication! Keep the momentum going.

View your progress: ${data.actionUrl || ''}`,
  } satisfies EmailTemplate<StreakData>,

  goalCompleted: {
    subject: ({ goalName }: GoalData) => `🎯 Goal achieved: ${goalName}!`,
    html: (data: GoalData) =>
      renderLayout(
        'Goal completed',
        `<div class="celebration">
           <div class="celebration-emoji">🎯</div>
         </div>
         <h1 class="title" style="text-align: center;">Goal Achieved!</h1>
         <p class="subtitle" style="text-align: center;">Congratulations${data.toName ? ', ' + data.toName : ''}! You did it!</p>

         <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
           <div style="font-size: 20px; font-weight: 700; color: #065f46; margin-bottom: 8px;">${data.goalName}</div>
           ${data.projectName ? `<div class="muted">in ${data.projectName}</div>` : ''}
         </div>

         ${
           data.completedTasks || data.totalDays
             ? `<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 20px 0;">
              ${data.completedTasks ? `<div class="metric-card"><div class="metric-value">${data.completedTasks}</div><div class="metric-label">Tasks Completed</div></div>` : ''}
              ${data.totalDays ? `<div class="metric-card"><div class="metric-value">${data.totalDays}</div><div class="metric-label">Days to Complete</div></div>` : ''}
            </div>`
             : ''
         }

         <div class="highlight-box">
           <p style="text-align: center;">🚀 Ready for your next challenge? Set a new goal and keep the momentum going!</p>
         </div>

         ${actionButton(data, 'Set New Goal')}`,
        data,
        { icon: icons.trophy, theme: 'success', headerBg: true }
      ),
    text: (data: GoalData) =>
      `🎯 Goal Achieved: ${data.goalName}!

Congratulations${data.toName ? ', ' + data.toName : ''}! You did it!

${data.projectName ? `Project: ${data.projectName}` : ''}
${data.completedTasks ? `Tasks completed: ${data.completedTasks}` : ''}
${data.totalDays ? `Days to complete: ${data.totalDays}` : ''}

Set a new goal: ${data.actionUrl || ''}`,
  } satisfies EmailTemplate<GoalData>,

  // ============================================
  // AI INSIGHTS
  // ============================================

  aiInsight: {
    subject: ({ insightTitle }: InsightData) => `💡 New insight: ${insightTitle}`,
    html: (data: InsightData) => {
      const insightIcon =
        data.insightType === 'celebration'
          ? icons.trophy
          : data.insightType === 'recommendation'
            ? icons.sparkles
            : data.insightType === 'milestone'
              ? icons.target
              : icons.brain;
      const insightTheme: keyof typeof themes =
        data.insightType === 'celebration'
          ? 'success'
          : data.insightType === 'recommendation'
            ? 'purple'
            : data.insightType === 'milestone'
              ? 'blue'
              : 'primary';

      return renderLayout(
        'AI Insight',
        `<h1 class="title">${data.insightTitle}</h1>
         <p class="subtitle">Our AI noticed something interesting about your progress.</p>

         <div class="highlight-box">
           <p>${data.insightContent}</p>
         </div>

         ${actionButton(data, 'View All Insights')}`,
        data,
        { icon: insightIcon, theme: insightTheme }
      );
    },
    text: (data: InsightData) =>
      `💡 ${data.insightTitle}

${data.insightContent}

View all insights: ${data.actionUrl || ''}`,
  } satisfies EmailTemplate<InsightData>,

  // ============================================
  // RE-ENGAGEMENT
  // ============================================

  inactivityReminder: {
    subject: ({ toName }: InactivityData) => `We miss you${toName ? ', ' + toName : ''}! 💙`,
    html: (data: InactivityData) =>
      renderLayout(
        'We miss you',
        `<h1 class="title">We miss you${data.toName ? ', ' + data.toName : ''}!</h1>
         <p class="subtitle">It's been ${data.daysSinceActive} days since your last visit.</p>

         <div class="highlight-box">
           <p>🌱 <strong>Remember:</strong> Small, consistent steps lead to big results. Even a quick check-in counts!</p>
         </div>

         ${
           data.lastActivity
             ? `<p class="muted" style="text-align: center;">Last activity: ${data.lastActivity}</p>`
             : ''
         }

         ${actionButton(data, 'Jump Back In')}

         <div class="divider"></div>
         <p class="muted" style="text-align: center;">Not ready to come back? That's okay too. We'll be here when you are.</p>`,
        data,
        { icon: icons.heart, theme: 'purple' }
      ),
    text: (data: InactivityData) =>
      `We miss you${data.toName ? ', ' + data.toName : ''}!

It's been ${data.daysSinceActive} days since your last visit.

${data.lastActivity ? `Last activity: ${data.lastActivity}` : ''}

Jump back in: ${data.actionUrl || ''}`,
  } satisfies EmailTemplate<InactivityData>,

  // ============================================
  // TASK REMINDERS
  // ============================================

  taskDueReminder: {
    subject: ({ goalName }: GoalData) => `⏰ Task due soon: ${goalName}`,
    html: (data: GoalData) =>
      renderLayout(
        'Task due reminder',
        `<h1 class="title">Task Due Soon</h1>
         <p class="subtitle">Don't forget about this task on your list.</p>

         <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 12px; padding: 20px; margin: 20px 0;">
           <div style="font-weight: 600; color: #92400e; font-size: 18px;">${data.goalName}</div>
           ${data.projectName ? `<div class="muted" style="margin-top: 4px;">in ${data.projectName}</div>` : ''}
         </div>

         ${actionButton(data, 'View Task')}`,
        data,
        { icon: icons.alertTriangle, theme: 'warning' }
      ),
    text: (data: GoalData) =>
      `⏰ Task Due Soon: ${data.goalName}

${data.projectName ? `Project: ${data.projectName}` : ''}

View task: ${data.actionUrl || ''}`,
  } satisfies EmailTemplate<GoalData>,

  // ============================================
  // STALE PROJECT & REVIEW DUE
  // ============================================

  staleProject: {
    subject: ({ projectName }: StaleProjectData) => `📋 ${projectName} needs attention`,
    html: (data: StaleProjectData) =>
      renderLayout(
        'Stale project',
        `<h1 class="title">Project Needs Attention</h1>
         <p class="subtitle">It's been a while since you updated this project.</p>

         <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 20px 0;">
           <div style="font-weight: 600; color: #92400e; font-size: 18px;">${data.projectName}</div>
           <div class="muted" style="margin-top: 8px;">
             ${data.daysSinceUpdate} days since last activity
           </div>
           ${data.projectStatus ? `<div class="muted" style="margin-top: 4px;">Status: ${data.projectStatus}</div>` : ''}
         </div>

         <div class="highlight-box">
           <p>💡 <strong>Quick wins:</strong> Even a small update helps keep momentum. Log a review, update a task, or adjust the timeline.</p>
         </div>

         ${actionButton(data, 'Review Project')}`,
        data,
        { icon: icons.alertTriangle, theme: 'warning' }
      ),
    text: (data: StaleProjectData) =>
      `📋 ${data.projectName} needs attention

It's been ${data.daysSinceUpdate} days since you last updated this project.
${data.projectStatus ? `Status: ${data.projectStatus}` : ''}

Review project: ${data.actionUrl || ''}`,
  } satisfies EmailTemplate<StaleProjectData>,

  reviewDue: {
    subject: ({ projectName, reviewType }: ReviewDueData) =>
      `📝 ${reviewType === 'weekly' ? 'Weekly' : reviewType === 'monthly' ? 'Monthly' : 'Scheduled'} review due: ${projectName}`,
    html: (data: ReviewDueData) => {
      const reviewTypeLabel =
        data.reviewType === 'weekly'
          ? 'weekly'
          : data.reviewType === 'monthly'
            ? 'monthly'
            : data.cadence || 'scheduled';

      return renderLayout(
        'Review due',
        `<h1 class="title">Review Due</h1>
         <p class="subtitle">Time for your ${reviewTypeLabel} project review.</p>

         <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 12px; padding: 20px; margin: 20px 0;">
           <div style="font-weight: 600; color: #1e40af; font-size: 18px;">${data.projectName}</div>
           <div class="muted" style="margin-top: 8px;">
             ${data.daysSinceLastReview} days since last review
           </div>
         </div>

         <div class="highlight-box">
           <p>📊 <strong>Review checklist:</strong></p>
           <ul>
             <li>Check task progress</li>
             <li>Update blockers</li>
             <li>Adjust timeline if needed</li>
             <li>Log any key decisions</li>
           </ul>
         </div>

         ${actionButton(data, 'Start Review')}`,
        data,
        { icon: icons.calendar, theme: 'blue' }
      );
    },
    text: (data: ReviewDueData) =>
      `📝 Review due: ${data.projectName}

Time for your ${data.reviewType === 'weekly' ? 'weekly' : data.reviewType === 'monthly' ? 'monthly' : data.cadence || 'scheduled'} review.

It's been ${data.daysSinceLastReview} days since your last review.

Start review: ${data.actionUrl || ''}`,
  } satisfies EmailTemplate<ReviewDueData>,
};

export type EmailTemplateKey = keyof typeof emailTemplates;
