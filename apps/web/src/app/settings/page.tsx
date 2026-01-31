'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Users,
  Bell,
  LogOut,
  ChevronRight,
  ChevronDown,
  Mail,
  Shield,
  Settings2,
  Globe,
  Loader2,
  X,
  Clock,
  UserCheck,
  RotateCw,
  Plus,
  Image as ImageIcon,
  Lock,
  KeyRound,
  Trash2,
  AlertTriangle,
  Pencil,
  Eye,
  EyeOff,
  Zap,
  CreditCard,
  Crown,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuthStore, useViewMode } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { isSafeImageUrl, processImageFile } from '@/lib/image-utils';
import { cn } from '@/lib/utils';

// Common IANA timezones grouped by region
const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  // Americas
  { value: 'America/New_York', label: 'New York (Eastern Time)' },
  { value: 'America/Chicago', label: 'Chicago (Central Time)' },
  { value: 'America/Denver', label: 'Denver (Mountain Time)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (Pacific Time)' },
  { value: 'America/Toronto', label: 'Toronto (Eastern Time)' },
  { value: 'America/Vancouver', label: 'Vancouver (Pacific Time)' },
  { value: 'America/Mexico_City', label: 'Mexico City' },
  { value: 'America/Sao_Paulo', label: 'São Paulo' },
  // Europe
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam (CET)' },
  { value: 'Europe/Madrid', label: 'Madrid (CET)' },
  { value: 'Europe/Rome', label: 'Rome (CET)' },
  { value: 'Europe/Moscow', label: 'Moscow' },
  // Asia
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Seoul', label: 'Seoul (KST)' },
  { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
  // Africa
  { value: 'Africa/Lagos', label: 'Lagos (WAT)' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)' },
  { value: 'Africa/Cairo', label: 'Cairo (EET)' },
  // Oceania
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST)' },
  { value: 'Australia/Perth', label: 'Perth (AWST)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST)' },
];

// Collapsible Card Component
interface CollapsibleCardProps {
  id: string;
  icon: ReactNode;
  title: string;
  description?: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

function CollapsibleCard({
  id,
  icon,
  title,
  description,
  isExpanded,
  onToggle,
  children,
}: CollapsibleCardProps) {
  return (
    <Card id={`section-${id}`} className="mb-4 scroll-mt-20">
      <CardHeader className="cursor-pointer select-none" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <ChevronDown
            className={cn(
              'h-5 w-5 text-muted-foreground transition-transform duration-200',
              isExpanded && 'rotate-180'
            )}
          />
        </div>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <CardContent>{children}</CardContent>
      </div>
    </Card>
  );
}

type SectionId =
  | 'profile'
  | 'subscription'
  | 'email'
  | 'password'
  | 'regional'
  | 'viewMode'
  | 'workspaces'
  | 'family'
  | 'notifications'
  | 'emailPrefs'
  | 'danger';

// Map URL hash values to section IDs
const HASH_TO_SECTION: Record<string, SectionId> = {
  profile: 'profile',
  subscription: 'subscription',
  billing: 'subscription', // Alias for subscription section
  email: 'email',
  password: 'password',
  security: 'password', // Alias for password section
  regional: 'regional',
  timezone: 'regional', // Alias for regional section
  viewMode: 'viewMode',
  mode: 'viewMode', // Alias for view mode section
  workspaces: 'workspaces',
  family: 'family',
  notifications: 'notifications',
  'email-preferences': 'emailPrefs',
  emailPrefs: 'emailPrefs',
  danger: 'danger',
};

export default function SettingsPage() {
  const router = useRouter();
  const {
    user,
    currentWorkspace,
    workspaces,
    logout,
    updateSettings,
    loadWorkspaces,
    updateProfile,
    changeEmail,
    changePassword,
    setPassword,
    deleteAccount,
  } = useAuthStore();
  const { getConfig, initializeConfig, updateNotificationSettings, updateDashboardSettings } =
    useConfigStore();
  const { toast } = useToast();
  const viewMode = useViewMode();

  // Collapsible sections state - only profile expanded by default
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(
    new Set<SectionId>(['profile'])
  );

  // Handle URL hash to scroll to and expand specific section
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove the # symbol
      if (hash && HASH_TO_SECTION[hash]) {
        const sectionId = HASH_TO_SECTION[hash];
        // Expand the section
        setExpandedSections((prev) => new Set([...Array.from(prev), sectionId]));
        // Scroll to the section after a brief delay to allow expansion
        setTimeout(() => {
          const element = document.getElementById(`section-${sectionId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      }
    };

    // Handle initial hash on mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const toggleSection = (section: SectionId) => {
    setExpandedSections((prev) => {
      const next = new Set<SectionId>(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<
    { id: string; email: string; createdAt: Date; expiresAt: Date }[]
  >([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<
    { id: string; name: string; email: string; role: string; avatar?: string | null }[]
  >([]);
  const [cancellingInviteId, setCancellingInviteId] = useState<string | null>(null);
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null);
  const [isCreatingFamilyWorkspace, setIsCreatingFamilyWorkspace] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [avatarFileName, setAvatarFileName] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [emailPassword, setEmailPassword] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  // Workspace rename state
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [workspaceToRename, setWorkspaceToRename] = useState<{ id: string; name: string } | null>(
    null
  );
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isRenamingWorkspace, setIsRenamingWorkspace] = useState(false);

  // Subscription state
  const [subscription, setSubscription] = useState<{
    plan: 'FREE' | 'PRO' | 'FAMILY';
    status: string;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
  } | null>(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(true);
  const [isOpeningBillingPortal, setIsOpeningBillingPortal] = useState(false);

  // Get family workspace
  const familyWorkspace = workspaces.find((w) => w.type === 'family');

  // Fetch members and pending invites for family workspace
  useEffect(() => {
    if (!familyWorkspace) return;

    const fetchWorkspaceData = async () => {
      try {
        const [workspace, invites] = await Promise.all([
          apiClient.getWorkspaceWithMembers(familyWorkspace.id),
          apiClient.getPendingInvites(familyWorkspace.id),
        ]);

        if (workspace.members) {
          setWorkspaceMembers(
            workspace.members.map((m) => ({
              id: m.id,
              name: m.user?.name || 'Unknown',
              email: m.user?.email || '',
              role: m.role,
              avatar: m.user?.avatar,
            }))
          );
        }

        setPendingInvites(
          invites.map((i) => ({
            id: i.id,
            email: i.email,
            createdAt: new Date(i.createdAt),
            expiresAt: new Date(i.expiresAt),
          }))
        );
      } catch (error) {
        console.error('Failed to fetch workspace data:', error);
      }
    };

    fetchWorkspaceData();
  }, [familyWorkspace]);

  // Initialize config when workspace changes
  useEffect(() => {
    if (currentWorkspace) {
      initializeConfig(currentWorkspace.id);
    }
  }, [currentWorkspace, initializeConfig]);

  useEffect(() => {
    setProfileName(user?.name || '');
    setAvatarUrl(user?.avatar || '');
    setNewEmail(user?.email || '');
  }, [user]);

  // Fetch subscription status
  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        setIsLoadingSubscription(true);
        const data = await apiClient.getSubscriptionStatus();
        setSubscription(data);
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    fetchSubscription();
  }, []);

  const config = currentWorkspace ? getConfig(currentWorkspace.id) : null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAvatarFileChange = async (file?: File) => {
    if (!file) return;
    const { image, error } = await processImageFile(file, {
      maxSizeMB: 1.5,
      maxDimension: 320,
      maxPixels: 3_000_000,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      outputType: 'image/jpeg',
      quality: 0.86,
      cropSquare: true,
    });

    if (error || !image) {
      toast({
        title: 'Upload failed',
        description: error || 'Could not process the selected image.',
        variant: 'destructive',
      });
      return;
    }

    setAvatarUrl(image.data);
    setAvatarFileName(image.name);
  };

  const handleProfileSave = async () => {
    if (!profileName.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    if (avatarUrl && !isSafeImageUrl(avatarUrl)) {
      toast({
        title: 'Invalid avatar URL',
        description: 'Please use a secure https image URL (JPG, PNG, or WebP).',
        variant: 'destructive',
      });
      return;
    }
    setIsSavingProfile(true);
    try {
      await updateProfile({ name: profileName.trim(), avatar: avatarUrl || undefined });
      toast({ title: 'Profile updated', variant: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail || !emailPassword) {
      toast({ title: 'Email and password are required', variant: 'destructive' });
      return;
    }
    setIsChangingEmail(true);
    try {
      await changeEmail(newEmail, emailPassword);
      toast({
        title: 'Email updated',
        description: 'Please log in again with your new email.',
        variant: 'success',
      });
      router.push('/auth/login');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to change email';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handlePasswordChange = async () => {
    // For users who haven't set a password (magic link signup), only require new password
    if (!user?.hasSetPassword) {
      if (!newPassword) {
        toast({ title: 'Password is required', variant: 'destructive' });
        return;
      }
      if (newPassword.length < 8) {
        toast({ title: 'Password must be at least 8 characters', variant: 'destructive' });
        return;
      }
      setIsChangingPassword(true);
      try {
        await setPassword(newPassword);
        toast({
          title: 'Password set successfully',
          description: 'Log in again with your new password.',
          variant: 'success',
        });
        router.push('/auth/login');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to set password';
        toast({ title: 'Error', description: message, variant: 'destructive' });
      } finally {
        setIsChangingPassword(false);
      }
      return;
    }

    // For users who have a password, require both current and new password
    if (!currentPassword || !newPassword) {
      toast({ title: 'Both password fields are required', variant: 'destructive' });
      return;
    }
    setIsChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast({
        title: 'Password updated',
        description: 'Log in again with your new password.',
        variant: 'success',
      });
      router.push('/auth/login');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to change password';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDueSoonChange = (value: string) => {
    if (!currentWorkspace) return;
    updateDashboardSettings(currentWorkspace.id, { dueSoonDays: parseInt(value) });
    toast({
      title: 'Settings updated',
      variant: 'success',
    });
  };

  const handleReviewRemindersChange = (checked: boolean) => {
    if (!currentWorkspace) return;
    updateNotificationSettings(currentWorkspace.id, { reviewReminders: checked });
    toast({
      title: 'Settings updated',
      variant: 'success',
    });
  };

  const openRenameDialog = (workspace: { id: string; name: string }) => {
    setWorkspaceToRename(workspace);
    setNewWorkspaceName(workspace.name);
    setIsRenameDialogOpen(true);
  };

  const handleRenameWorkspace = async () => {
    if (!workspaceToRename || !newWorkspaceName.trim()) {
      toast({ title: 'Workspace name is required', variant: 'destructive' });
      return;
    }

    setIsRenamingWorkspace(true);
    try {
      await apiClient.updateWorkspace(workspaceToRename.id, { name: newWorkspaceName.trim() });
      await loadWorkspaces();
      toast({
        title: 'Workspace renamed',
        description: `Workspace renamed to "${newWorkspaceName.trim()}"`,
        variant: 'success',
      });
      setIsRenameDialogOpen(false);
      setWorkspaceToRename(null);
      setNewWorkspaceName('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to rename workspace';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsRenamingWorkspace(false);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    setCancellingInviteId(inviteId);
    try {
      await apiClient.cancelInvite(inviteId);
      setPendingInvites((prev) => prev.filter((i) => i.id !== inviteId));
      toast({
        title: 'Invite cancelled',
        variant: 'success',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel invite';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setCancellingInviteId(null);
    }
  };

  const handleResendInvite = async (inviteId: string) => {
    setResendingInviteId(inviteId);
    try {
      await apiClient.resendInvite(inviteId);
      // Refresh pending invites to get updated expiration
      if (familyWorkspace) {
        const invites = await apiClient.getPendingInvites(familyWorkspace.id);
        setPendingInvites(
          invites.map((i) => ({
            id: i.id,
            email: i.email,
            createdAt: new Date(i.createdAt),
            expiresAt: new Date(i.expiresAt),
          }))
        );
      }
      toast({
        title: 'Invite resent',
        description: 'A new invitation email has been sent',
        variant: 'success',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resend invite';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setResendingInviteId(null);
    }
  };

  const handleInvite = async () => {
    if (!currentWorkspace || !inviteEmail) return;

    // Find family workspace to invite to
    const familyWorkspace = workspaces.find((w) => w.type === 'family');
    const targetWorkspace = familyWorkspace || currentWorkspace;

    setIsInviting(true);
    try {
      await apiClient.inviteToWorkspace(targetWorkspace.id, inviteEmail);
      // Refresh pending invites
      const invites = await apiClient.getPendingInvites(targetWorkspace.id);
      setPendingInvites(
        invites.map((i) => ({
          id: i.id,
          email: i.email,
          createdAt: new Date(i.createdAt),
          expiresAt: new Date(i.expiresAt),
        }))
      );
      toast({
        title: 'Invitation sent',
        description: `An invitation has been sent to ${inviteEmail}`,
        variant: 'success',
      });
      setInviteEmail('');
      setIsInviteDialogOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send invitation';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;

    setIsDeletingAccount(true);
    try {
      await deleteAccount(deletePassword);
      toast({
        title: 'Account deleted',
        description: 'Your account has been permanently deleted.',
        variant: 'default',
      });
      router.push('/auth/login');
    } catch (error) {
      toast({
        title: 'Failed to delete account',
        description:
          error instanceof Error ? error.message : 'Please check your password and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeletingAccount(false);
      setDeletePassword('');
      setDeleteConfirmText('');
      setIsDeleteDialogOpen(false);
    }
  };

  const handleTimezoneChange = async (timezone: string) => {
    try {
      await updateSettings({ timezone });
      toast({
        title: 'Timezone updated',
        description: `Your timezone has been set to ${timezone}`,
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update timezone',
        variant: 'destructive',
      });
    }
  };

  const handleViewModeChange = async (mode: 'focus' | 'power') => {
    try {
      await updateSettings({ viewMode: mode });
      toast({
        title: 'Experience mode updated',
        description:
          mode === 'focus'
            ? 'Switched to Focus Mode - simplified interface'
            : 'Switched to Power Mode - full features unlocked',
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update experience mode',
        variant: 'destructive',
      });
    }
  };

  const handleEmailPreferenceChange = async (key: string, value: boolean) => {
    try {
      const currentPrefs = user?.settings?.emailPreferences || {};
      // Backend handles partial updates and merges with existing preferences
      await updateSettings({
        emailPreferences: {
          ...currentPrefs,
          [key]: value,
        } as any,
      });
      toast({
        title: 'Email preferences updated',
        description: value
          ? 'You will receive these emails'
          : 'You will no longer receive these emails',
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update email preferences',
        variant: 'destructive',
      });
    }
  };

  const handleCreateFamilyWorkspace = async () => {
    setIsCreatingFamilyWorkspace(true);
    try {
      await apiClient.createWorkspace({
        name: `${user?.name?.split(' ')[0] || 'My'}'s Family`,
        type: 'family',
      });
      await loadWorkspaces();
      toast({
        title: 'Family workspace created',
        description: 'You can now invite family members to collaborate',
        variant: 'success',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create family workspace';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsCreatingFamilyWorkspace(false);
    }
  };

  const handleManageBilling = async () => {
    setIsOpeningBillingPortal(true);
    try {
      const { url } = await apiClient.createBillingPortalSession();
      window.location.href = url;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to open billing portal';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      setIsOpeningBillingPortal(false);
    }
  };

  const handleUpgrade = async (plan: 'PRO' | 'FAMILY') => {
    try {
      const appUrl = window.location.origin;
      const { url } = await apiClient.createCheckoutSession(
        plan,
        `${appUrl}/settings#subscription`,
        `${appUrl}/settings#subscription`
      );
      window.location.href = url;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start checkout';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  return (
    <AppLayout title="Settings">
      <div className="container max-w-2xl px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        {/* Profile Section */}
        <CollapsibleCard
          id="profile"
          icon={<User className="h-5 w-5" />}
          title="Profile"
          isExpanded={expandedSections.has('profile')}
          onToggle={() => toggleSection('profile')}
        >
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Avatar className="h-16 w-16">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt="Avatar" /> : null}
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {user?.name ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div>
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Your name"
                    className="mt-1"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    type="url"
                    placeholder="Avatar image URL"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full"
                  />
                  <Label
                    htmlFor="avatar-upload"
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted sm:w-auto"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Upload
                  </Label>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleAvatarFileChange(e.target.files?.[0])}
                  />
                </div>
                {avatarFileName && (
                  <p className="text-xs text-muted-foreground">Selected: {avatarFileName}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate" title={user?.email}>
                  {user?.email}
                </p>
                <p className="text-sm text-muted-foreground">Email (change below)</p>
              </div>
              <Button
                onClick={handleProfileSave}
                disabled={isSavingProfile}
                className="w-full sm:w-auto"
              >
                {isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save profile
              </Button>
            </div>
          </div>
        </CollapsibleCard>

        {/* Subscription / Billing */}
        <CollapsibleCard
          id="subscription"
          icon={<CreditCard className="h-5 w-5" />}
          title="Subscription & Billing"
          description="Manage your subscription plan and billing"
          isExpanded={expandedSections.has('subscription')}
          onToggle={() => toggleSection('subscription')}
        >
          {isLoadingSubscription ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Current Plan */}
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {subscription?.plan === 'FREE' ? (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <User className="h-6 w-6" />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
                        <Crown className="h-6 w-6" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">
                          {subscription?.plan || 'FREE'} Plan
                        </h3>
                        {subscription?.plan !== 'FREE' && (
                          <Badge variant="secondary" className="uppercase">
                            {subscription?.status || 'Active'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {subscription?.plan === 'FREE'
                          ? 'Limited goals and habits'
                          : subscription?.plan === 'PRO'
                            ? 'Unlimited goals and habits'
                            : 'Unlimited goals, habits, and family sharing'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional subscription info */}
                {subscription?.plan !== 'FREE' && (
                  <div className="mt-4 space-y-2 border-t pt-4">
                    {subscription?.currentPeriodEnd && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {subscription?.cancelAtPeriodEnd ? 'Ends on' : 'Renews on'}
                        </span>
                        <span className="font-medium">
                          {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                    {subscription?.trialEndsAt && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Trial ends</span>
                        <span className="font-medium">
                          {new Date(subscription.trialEndsAt).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                    {subscription?.cancelAtPeriodEnd && (
                      <div className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
                        Your subscription will be cancelled at the end of the billing period.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="space-y-3">
                {subscription?.plan === 'FREE' ? (
                  <>
                    <Button onClick={() => handleUpgrade('PRO')} className="w-full" size="lg">
                      <Crown className="mr-2 h-4 w-4" />
                      Upgrade to PRO
                    </Button>
                    <Button
                      onClick={() => handleUpgrade('FAMILY')}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Upgrade to FAMILY
                    </Button>
                  </>
                ) : (
                  <>
                    {subscription?.plan === 'PRO' && (
                      <Button onClick={() => handleUpgrade('FAMILY')} className="w-full" size="lg">
                        <Users className="mr-2 h-4 w-4" />
                        Upgrade to FAMILY
                      </Button>
                    )}
                    <Button
                      onClick={handleManageBilling}
                      variant={subscription?.plan === 'PRO' ? 'outline' : 'default'}
                      className="w-full"
                      disabled={isOpeningBillingPortal}
                    >
                      {isOpeningBillingPortal ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Opening...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          {subscription?.plan === 'FAMILY' ? 'Manage Plan' : 'Manage Billing'}
                        </>
                      )}
                    </Button>
                  </>
                )}
              </div>
              {subscription?.plan !== 'FREE' && (
                <p className="text-xs text-muted-foreground">
                  Use “Manage Plan” to downgrade, update payment method, or cancel.
                </p>
              )}

              {/* Plan comparison */}
              {subscription?.plan === 'FREE' && (
                <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-purple-50 p-4">
                  <h4 className="mb-3 font-semibold">Upgrade Benefits</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <div className="mt-0.5 rounded-full bg-green-500 p-0.5">
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <span>Unlimited goals and habits</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-0.5 rounded-full bg-green-500 p-0.5">
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <span>AI-powered insights and summaries</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-0.5 rounded-full bg-green-500 p-0.5">
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <span>Advanced analytics and reviews</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="mt-0.5 rounded-full bg-green-500 p-0.5">
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <span>Priority support</span>
                    </li>
                    {subscription?.plan === 'FREE' && (
                      <li className="flex items-start gap-2">
                        <div className="mt-0.5 rounded-full bg-purple-500 p-0.5">
                          <svg
                            className="h-3 w-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <span>
                          <strong>FAMILY plan:</strong> Share with family members
                        </span>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CollapsibleCard>

        {/* Email Change */}
        <CollapsibleCard
          id="email"
          icon={<Mail className="h-5 w-5" />}
          title="Email"
          description={
            user?.hasSetPassword
              ? 'Update your login email. Requires current password.'
              : 'Set a password first to change your email.'
          }
          isExpanded={expandedSections.has('email')}
          onToggle={() => toggleSection('email')}
        >
          {user?.hasSetPassword ? (
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-email">New email</Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-password">Current password</Label>
                  <div className="relative">
                    <Input
                      id="email-password"
                      type={showEmailPassword ? 'text' : 'password'}
                      value={emailPassword}
                      onChange={(e) => setEmailPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmailPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      aria-label={showEmailPassword ? 'Hide password' : 'Show password'}
                    >
                      {showEmailPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleEmailChange}
                disabled={isChangingEmail}
                className="w-full sm:w-auto"
              >
                {isChangingEmail ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="mr-2 h-4 w-4" />
                )}
                Update email
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              You signed up with a magic link and don&apos;t have a password set yet. Please set a
              password in the Password section below before you can change your email.
            </p>
          )}
        </CollapsibleCard>

        {/* Password Change */}
        <CollapsibleCard
          id="password"
          icon={<Lock className="h-5 w-5" />}
          title={user?.hasSetPassword ? 'Change Password' : 'Set Password'}
          description={
            user?.hasSetPassword
              ? 'Change your password. You will need to sign in again.'
              : 'You signed up with a magic link. Set a password to enable password login.'
          }
          isExpanded={expandedSections.has('password')}
          onToggle={() => toggleSection('password')}
        >
          <div className="space-y-4">
            <div className={`grid gap-4 ${user?.hasSetPassword ? 'sm:grid-cols-2' : ''}`}>
              {user?.hasSetPassword && (
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current password</Label>
                  <div className="relative">
                    <Input
                      id="current-password"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                      aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="new-password">
                  {user?.hasSetPassword ? 'New password' : 'Password'}
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            <Button
              onClick={handlePasswordChange}
              disabled={isChangingPassword}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              {isChangingPassword ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Shield className="mr-2 h-4 w-4" />
              )}
              {user?.hasSetPassword ? 'Update password' : 'Set password'}
            </Button>
          </div>
        </CollapsibleCard>

        {/* Regional Settings */}
        <CollapsibleCard
          id="regional"
          icon={<Globe className="h-5 w-5" />}
          title="Regional Settings"
          description="Configure your timezone for accurate habit tracking and daily resets"
          isExpanded={expandedSections.has('regional')}
          onToggle={() => toggleSection('regional')}
        >
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <p className="text-sm text-muted-foreground">
                Your habits and journal entries use this timezone
              </p>
            </div>
            <Select value={user?.timezone || 'UTC'} onValueChange={handleTimezoneChange}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CollapsibleCard>

        {/* Experience Mode */}
        <CollapsibleCard
          id="viewMode"
          icon={<Zap className="h-5 w-5" />}
          title="Experience Mode"
          description="Choose between simplified or full-featured interface"
          isExpanded={expandedSections.has('viewMode')}
          onToggle={() => toggleSection('viewMode')}
        >
          <RadioGroup value={viewMode} onValueChange={handleViewModeChange}>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="focus" id="focus" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="focus" className="font-medium cursor-pointer">
                    Focus Mode
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Simplified interface with essential goal tracking. Perfect for getting started
                    or staying distraction-free. Shows Dashboard, Projects, Board, Habits, and basic
                    settings.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="power" id="power" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="power" className="font-medium cursor-pointer">
                    Power Mode
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Full-featured with AI insights, reviews, calendar, dependencies, and advanced
                    analytics. For power users who want complete control and all available features.
                  </p>
                </div>
              </div>
            </div>
          </RadioGroup>
        </CollapsibleCard>

        {/* Workspaces Section */}
        <CollapsibleCard
          id="workspaces"
          icon={<Users className="h-5 w-5" />}
          title="Workspaces"
          description="Manage your personal and shared workspaces"
          isExpanded={expandedSections.has('workspaces')}
          onToggle={() => toggleSection('workspaces')}
        >
          <div className="space-y-4">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      workspace.type === 'family'
                        ? 'bg-pink-100 text-pink-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {workspace.type === 'family' ? (
                      <Users className="h-5 w-5" />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{workspace.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {workspace.type} workspace
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openRenameDialog(workspace)}
                    title="Rename workspace"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {currentWorkspace?.id === workspace.id && (
                    <Badge variant="secondary">Current</Badge>
                  )}
                </div>
              </div>
            ))}

            {/* Configure Workspace */}
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => router.push('/settings/configure')}
            >
              <span className="flex items-center">
                <Settings2 className="mr-2 h-4 w-4" />
                Configure Workspace
              </span>
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* Create or Invite to Family Workspace */}
            {!familyWorkspace ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleCreateFamilyWorkspace}
                disabled={isCreatingFamilyWorkspace}
              >
                {isCreatingFamilyWorkspace ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Family Workspace
                  </>
                )}
              </Button>
            ) : (
              <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Mail className="mr-2 h-4 w-4" />
                    Invite to Family Workspace
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Family Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation to join your family workspace
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="invite-email">Email address</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="spouse@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleInvite} disabled={!inviteEmail || isInviting}>
                      {isInviting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Invitation'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CollapsibleCard>

        {/* Rename Workspace Dialog */}
        <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Workspace</DialogTitle>
              <DialogDescription>Enter a new name for your workspace</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="workspace-name">Workspace name</Label>
              <Input
                id="workspace-name"
                placeholder="My Workspace"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                className="mt-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameWorkspace();
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleRenameWorkspace}
                disabled={!newWorkspaceName.trim() || isRenamingWorkspace}
              >
                {isRenamingWorkspace ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Renaming...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Family Members & Invites */}
        {familyWorkspace && (
          <CollapsibleCard
            id="family"
            icon={<UserCheck className="h-5 w-5" />}
            title="Family Members & Invites"
            description="Members of your family workspace and pending invitations"
            isExpanded={expandedSections.has('family')}
            onToggle={() => toggleSection('family')}
          >
            <div className="space-y-4">
              {/* Current Members */}
              {workspaceMembers.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Members</Label>
                  {workspaceMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {member.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{member.name}</p>
                          <p
                            className="text-xs text-muted-foreground truncate"
                            title={member.email}
                          >
                            {member.email}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {member.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}

              {/* Pending Invites */}
              {pendingInvites.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Pending Invites</Label>
                  {pendingInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between rounded-lg border border-dashed p-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate" title={invite.email}>
                            {invite.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Expires {invite.expiresAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResendInvite(invite.id)}
                          disabled={
                            resendingInviteId === invite.id || cancellingInviteId === invite.id
                          }
                          title="Resend invite"
                        >
                          {resendingInviteId === invite.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCw className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelInvite(invite.id)}
                          disabled={
                            cancellingInviteId === invite.id || resendingInviteId === invite.id
                          }
                          title="Cancel invite"
                        >
                          {cancellingInviteId === invite.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {workspaceMembers.length === 0 && pendingInvites.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No members or pending invites yet. Use the invite button above to add family
                  members.
                </p>
              )}
            </div>
          </CollapsibleCard>
        )}

        {/* Notification Preferences */}
        <CollapsibleCard
          id="notifications"
          icon={<Bell className="h-5 w-5" />}
          title="Notifications"
          description="Configure how you receive notifications"
          isExpanded={expandedSections.has('notifications')}
          onToggle={() => toggleSection('notifications')}
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dueSoon">Due soon window</Label>
                <p className="text-sm text-muted-foreground">
                  How many days before a task is due to notify you
                </p>
              </div>
              <Select
                value={config?.dashboard.dueSoonDays?.toString() || '14'}
                onValueChange={handleDueSoonChange}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="reviewReminders">Review reminders</Label>
                <p className="text-sm text-muted-foreground">Get notified when reviews are due</p>
              </div>
              <Switch
                id="reviewReminders"
                checked={config?.notifications.reviewReminders ?? true}
                onCheckedChange={handleReviewRemindersChange}
              />
            </div>
          </div>
        </CollapsibleCard>

        {/* Email Preferences */}
        <CollapsibleCard
          id="emailPrefs"
          icon={<Mail className="h-5 w-5" />}
          title="Email Preferences"
          description="Choose which emails you want to receive"
          isExpanded={expandedSections.has('emailPrefs')}
          onToggle={() => toggleSection('emailPrefs')}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Habit reminders</Label>
                <p className="text-sm text-muted-foreground">Daily reminders for your habits</p>
              </div>
              <Switch
                checked={user?.settings?.emailPreferences?.habitReminders ?? true}
                onCheckedChange={(v) => handleEmailPreferenceChange('habitReminders', v)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Task due reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications when tasks are due soon
                </p>
              </div>
              <Switch
                checked={user?.settings?.emailPreferences?.taskDueReminders ?? true}
                onCheckedChange={(v) => handleEmailPreferenceChange('taskDueReminders', v)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Weekly summary</Label>
                <p className="text-sm text-muted-foreground">Weekly digest of your progress</p>
              </div>
              <Switch
                checked={user?.settings?.emailPreferences?.weeklySummary ?? true}
                onCheckedChange={(v) => handleEmailPreferenceChange('weeklySummary', v)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Monthly summary</Label>
                <p className="text-sm text-muted-foreground">Monthly review of your achievements</p>
              </div>
              <Switch
                checked={user?.settings?.emailPreferences?.monthlySummary ?? true}
                onCheckedChange={(v) => handleEmailPreferenceChange('monthlySummary', v)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Stale project alerts</Label>
                <p className="text-sm text-muted-foreground">Alerts when projects need attention</p>
              </div>
              <Switch
                checked={user?.settings?.emailPreferences?.staleProjectAlerts ?? true}
                onCheckedChange={(v) => handleEmailPreferenceChange('staleProjectAlerts', v)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Review due reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Reminders when project reviews are due
                </p>
              </div>
              <Switch
                checked={user?.settings?.emailPreferences?.reviewDueReminders ?? true}
                onCheckedChange={(v) => handleEmailPreferenceChange('reviewDueReminders', v)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Streak milestones</Label>
                <p className="text-sm text-muted-foreground">
                  Celebrations for habit streaks (7, 30, 100 days)
                </p>
              </div>
              <Switch
                checked={user?.settings?.emailPreferences?.streakMilestones ?? true}
                onCheckedChange={(v) => handleEmailPreferenceChange('streakMilestones', v)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>AI insights</Label>
                <p className="text-sm text-muted-foreground">
                  Personalized insights about your progress
                </p>
              </div>
              <Switch
                checked={user?.settings?.emailPreferences?.aiInsights ?? true}
                onCheckedChange={(v) => handleEmailPreferenceChange('aiInsights', v)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Inactivity reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Gentle reminders if you haven&apos;t logged in
                </p>
              </div>
              <Switch
                checked={user?.settings?.emailPreferences?.inactivityReminders ?? false}
                onCheckedChange={(v) => handleEmailPreferenceChange('inactivityReminders', v)}
              />
            </div>
          </div>
        </CollapsibleCard>

        {/* Danger Zone */}
        <CollapsibleCard
          id="danger"
          icon={<AlertTriangle className="h-5 w-5 text-destructive" />}
          title="Danger Zone"
          description="Irreversible actions"
          isExpanded={expandedSections.has('danger')}
          onToggle={() => toggleSection('danger')}
        >
          <div className="space-y-4">
            <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
              <h4 className="font-medium text-destructive">Delete Account</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                Permanently delete your account and all associated data. This action cannot be
                undone.
              </p>
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="mt-4">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Delete Account
                    </DialogTitle>
                    <DialogDescription>
                      This action is permanent and cannot be undone. All your data including
                      projects, tasks, habits, journal entries, and reviews will be permanently
                      deleted.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="delete-password">Enter your password to confirm</Label>
                      <div className="relative">
                        <Input
                          id="delete-password"
                          type={showDeletePassword ? 'text' : 'password'}
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          placeholder="Your password"
                          className="pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowDeletePassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                          aria-label={showDeletePassword ? 'Hide password' : 'Show password'}
                        >
                          {showDeletePassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="delete-confirm">
                        Type <span className="font-mono font-bold">DELETE</span> to confirm
                      </Label>
                      <Input
                        id="delete-confirm"
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="DELETE"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDeleteDialogOpen(false);
                        setDeletePassword('');
                        setDeleteConfirmText('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={
                        isDeletingAccount || !deletePassword || deleteConfirmText !== 'DELETE'
                      }
                    >
                      {isDeletingAccount ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Account
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CollapsibleCard>

        {/* Logout */}
        <Button variant="destructive" className="w-full" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </AppLayout>
  );
}
