'use client';

import { useMemo, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Kanban,
  Calendar,
  Bell,
  Settings,
  Target,
  LogOut,
  ChevronDown,
  Users,
  Folder,
  ListChecks,
  Search,
  Keyboard,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  BarChart3,
  Map,
  GitBranch,
  Bot,
  Home,
  Moon,
  Sun,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore, useViewMode } from '@/store/auth-store';
import { useUIStore } from '@/store/ui-store';
import { useUnreadNotificationsCount } from '@/hooks/use-notifications';
import { getModifierKey } from '@/hooks/use-keyboard-shortcuts';
import { projectKeys } from '@/hooks/use-projects';
import { taskKeys } from '@/hooks/use-tasks';
import { useSubscriptionStatus } from '@/hooks/use-subscription';
import { getPlanRequirement, hasPlanAccess } from '@/lib/plan-guard';

// Navigation items for personal workspaces
const personalNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Assistant', href: '/ai', icon: Bot },
  { name: 'Daily Rhythm', href: '/rhythm', icon: BookOpen },
  { name: 'Habit Manager', href: '/habits', icon: BarChart3 },
  { name: 'Projects', href: '/projects', icon: Folder },
  { name: 'Tasks', href: '/tasks', icon: ListChecks },
  { name: 'Board', href: '/board', icon: Kanban },
  { name: 'Roadmap', href: '/roadmap', icon: Map },
  { name: 'Dependencies', href: '/dependencies', icon: GitBranch },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Weekly Review', href: '/reviews/weekly', icon: CalendarCheck },
  { name: 'Monthly Review', href: '/reviews/monthly', icon: CalendarDays },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

// Navigation items for family workspaces
const familyNavigation = [
  { name: 'Family Hub', href: '/family', icon: Home },
  { name: 'AI Assistant', href: '/ai', icon: Bot },
  { name: 'Projects', href: '/projects', icon: Folder },
  { name: 'Tasks', href: '/tasks', icon: ListChecks },
  { name: 'Board', href: '/board', icon: Kanban },
  { name: 'Roadmap', href: '/roadmap', icon: Map },
  { name: 'Dependencies', href: '/dependencies', icon: GitBranch },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

// Focus Mode navigation (simplified) for personal workspaces
const focusNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: Folder },
  { name: 'Board', href: '/board', icon: Kanban },
  { name: 'Habits', href: '/habits', icon: BarChart3 },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

// Focus Mode navigation for family workspaces
const focusFamilyNavigation = [
  { name: 'Family Hub', href: '/family', icon: Home },
  { name: 'Projects', href: '/projects', icon: Folder },
  { name: 'Board', href: '/board', icon: Kanban },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
];

// Pages that only exist in personal workspaces
const personalOnlyPaths = ['/dashboard', '/rhythm', '/habits', '/reviews'];
// Pages that only exist in family workspaces
const familyOnlyPaths = ['/family'];
// Detail pages that contain workspace-specific data (should redirect on workspace switch)
const workspaceDetailPaths = ['/project/', '/ai/'];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, currentWorkspace, workspaces, setCurrentWorkspace, logout } = useAuthStore();
  const { setCommandPaletteOpen, setShortcutsHelpOpen } = useUIStore();
  const { data: unreadCount } = useUnreadNotificationsCount();
  const modKey = useMemo(() => getModifierKey(), []);
  const { setTheme, theme, resolvedTheme } = useTheme();
  const viewMode = useViewMode();
  const { data: subscription } = useSubscriptionStatus();
  const userPlan = subscription?.plan ?? 'FREE';
  const isFreePlan = userPlan === 'FREE';

  const handleWorkspaceSwitch = useCallback(
    (workspace: typeof currentWorkspace) => {
      if (!workspace || workspace.id === currentWorkspace?.id) return;

      const isCurrentlyPersonal = currentWorkspace?.type === 'personal';
      const isSwitchingToFamily = workspace.type === 'family';
      const isSwitchingToPersonal = workspace.type === 'personal';

      // Update the current workspace
      setCurrentWorkspace(workspace);

      // Invalidate workspace-specific queries to force refetch with new workspace data
      queryClient.invalidateQueries({ queryKey: projectKeys.workspace(workspace.id) });
      queryClient.invalidateQueries({ queryKey: taskKeys.workspace(workspace.id) });
      // Also invalidate all projects/tasks to ensure fresh data
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });

      // Check if on a detail page with workspace-specific data (e.g., /project/[id])
      const isOnDetailPage = workspaceDetailPaths.some((path) => pathname?.startsWith(path));
      if (isOnDetailPage) {
        // Redirect to the list page for the new workspace
        if (pathname?.startsWith('/project/')) {
          router.push('/projects');
        } else if (pathname?.startsWith('/ai/')) {
          router.push('/ai');
        }
        return;
      }

      // Navigate if current page doesn't exist in the new workspace type
      if (isCurrentlyPersonal && isSwitchingToFamily) {
        // Switching from personal to family
        const isOnPersonalOnlyPage = personalOnlyPaths.some(
          (path) => pathname === path || pathname?.startsWith(path + '/')
        );
        if (isOnPersonalOnlyPage) {
          router.push('/family');
        }
      } else if (!isCurrentlyPersonal && isSwitchingToPersonal) {
        // Switching from family to personal
        const isOnFamilyOnlyPage = familyOnlyPaths.some(
          (path) => pathname === path || pathname?.startsWith(path + '/')
        );
        if (isOnFamilyOnlyPage) {
          router.push('/dashboard');
        }
      }
    },
    [currentWorkspace, pathname, router, setCurrentWorkspace, queryClient]
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const navigation = useMemo(() => {
    const baseNavigation =
      viewMode === 'focus'
        ? currentWorkspace?.type === 'family'
          ? focusFamilyNavigation
          : focusNavigation
        : currentWorkspace?.type === 'family'
          ? familyNavigation
          : personalNavigation;

    return baseNavigation.filter((item) => {
      const requirement = getPlanRequirement(item.href);
      if (!requirement) return true;
      return hasPlanAccess(userPlan, requirement.requiredPlan);
    });
  }, [currentWorkspace?.type, userPlan, viewMode]);

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="fixed inset-y-0 left-0 flex w-64 flex-col border-r bg-card">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 px-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <Target className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold">Alignia</span>
        </div>

        {/* Workspace Selector */}
        <div className="px-3 py-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between" size="sm">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  {currentWorkspace?.type === 'family' ? (
                    <Users className="h-4 w-4 shrink-0" />
                  ) : (
                    <Target className="h-4 w-4 shrink-0" />
                  )}
                  <span className="truncate">{currentWorkspace?.name || 'Select workspace'}</span>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Switch Workspace</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace.id}
                  onClick={() => handleWorkspaceSwitch(workspace)}
                  className={cn('min-w-0', currentWorkspace?.id === workspace.id && 'bg-accent')}
                >
                  {workspace.type === 'family' ? (
                    <Users className="mr-2 h-4 w-4 shrink-0" />
                  ) : (
                    <Target className="mr-2 h-4 w-4 shrink-0" />
                  )}
                  <span className="truncate">{workspace.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Separator className="my-2" />

        {/* Search Button */}
        <div className="px-3 pb-2">
          <Button
            variant="outline"
            className="w-full justify-start text-muted-foreground"
            onClick={() => setCommandPaletteOpen(true)}
          >
            <Search className="mr-3 h-4 w-4" />
            Search...
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              {modKey}K
            </kbd>
          </Button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3">
          <nav className="flex flex-col gap-1 py-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn('w-full justify-start', isActive && 'bg-secondary')}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                    {item.name === 'Notifications' && (unreadCount ?? 0) > 0 && (
                      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                        {unreadCount! > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Keyboard Shortcuts Button */}
          <div className="py-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground"
              onClick={() => setShortcutsHelpOpen(true)}
            >
              <Keyboard className="mr-3 h-5 w-5" />
              Keyboard shortcuts
              <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                ?
              </kbd>
            </Button>
          </div>

          {/* Theme Toggle */}
          <div className="pb-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground"
              onClick={() => {
                if (theme === 'system') {
                  setTheme('light');
                } else if (theme === 'light') {
                  setTheme('dark');
                } else {
                  setTheme('system');
                }
              }}
            >
              {resolvedTheme === 'dark' ? (
                <Moon className="mr-3 h-5 w-5" />
              ) : (
                <Sun className="mr-3 h-5 w-5" />
              )}
              {theme === 'system' ? 'System theme' : theme === 'dark' ? 'Dark mode' : 'Light mode'}
            </Button>
          </div>

          {/* Upgrade Prompt - Only for FREE plan */}
          {isFreePlan && (
            <div className="px-2 pb-2">
              <div className="rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="font-medium text-sm">Upgrade to Pro</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  Unlock AI, reviews, calendar, roadmap, and dependency mapping.
                </p>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => router.push('/settings#subscription')}
                >
                  <Sparkles className="mr-2 h-3.5 w-3.5" />
                  Upgrade Now
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* User Menu */}
        <div className="border-t p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 px-2">
                <Avatar className="h-8 w-8">
                  {user?.avatar && <AvatarImage src={user.avatar} alt={user.name || 'User'} />}
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {user?.name ? getInitials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col items-start text-left">
                  <span className="text-sm font-medium">{user?.name}</span>
                  <span className="text-xs text-muted-foreground">{user?.email}</span>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  logout();
                  router.push('/auth/login');
                }}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
