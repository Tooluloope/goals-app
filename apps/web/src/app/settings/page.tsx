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
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
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
  icon,
  title,
  description,
  isExpanded,
  onToggle,
  children,
}: CollapsibleCardProps) {
  return (
    <Card className="mb-4">
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
  | 'email'
  | 'password'
  | 'regional'
  | 'workspaces'
  | 'family'
  | 'notifications'
  | 'about';

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
  } = useAuthStore();
  const { getConfig, initializeConfig, updateNotificationSettings, updateDashboardSettings } =
    useConfigStore();
  const { toast } = useToast();

  // Collapsible sections state - only profile expanded by default
  const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(new Set(['profile']));

  const toggleSection = (section: SectionId) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
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
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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
    if (file.size > 1.5 * 1024 * 1024) {
      toast({
        title: 'Image too large',
        description: 'Please choose an image under 1.5MB',
        variant: 'destructive',
      });
      return;
    }
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result?.toString() || '';
        setAvatarUrl(result);
        setAvatarFileName(file.name);
        resolve();
      };
      reader.onerror = () => {
        toast({
          title: 'Upload failed',
          description: 'Could not read the selected image.',
          variant: 'destructive',
        });
        reject(reader.error);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleProfileSave = async () => {
    if (!profileName.trim()) {
      toast({ title: 'Name is required', variant: 'destructive' });
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
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt="Avatar" /> : null}
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {user?.name ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2 flex-1">
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
                <div className="flex items-center gap-2">
                  <Input
                    type="url"
                    placeholder="Avatar image URL"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                  />
                  <Label
                    htmlFor="avatar-upload"
                    className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
                  >
                    <ImageIcon className="h-4 w-4" />
                    Upload
                  </Label>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleAvatarFileChange(e.target.files?.[0])}
                  />
                </div>
                {avatarFileName && (
                  <p className="text-xs text-muted-foreground">Selected: {avatarFileName}</p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{user?.email}</p>
                <p className="text-sm text-muted-foreground">Email (change below)</p>
              </div>
              <Button onClick={handleProfileSave} disabled={isSavingProfile}>
                {isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save profile
              </Button>
            </div>
          </div>
        </CollapsibleCard>

        {/* Email Change */}
        <CollapsibleCard
          id="email"
          icon={<Mail className="h-5 w-5" />}
          title="Email"
          description="Update your login email. Requires current password."
          isExpanded={expandedSections.has('email')}
          onToggle={() => toggleSection('email')}
        >
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
                <Input
                  id="email-password"
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder="••••••••"
                />
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
        </CollapsibleCard>

        {/* Password Change */}
        <CollapsibleCard
          id="password"
          icon={<Lock className="h-5 w-5" />}
          title="Password"
          description="Set a new password. You will need to sign in again."
          isExpanded={expandedSections.has('password')}
          onToggle={() => toggleSection('password')}
        >
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                />
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
              Update password
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
                {currentWorkspace?.id === workspace.id && (
                  <Badge variant="secondary">Current</Badge>
                )}
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
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {member.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
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
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{invite.email}</p>
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

        {/* App Info */}
        <CollapsibleCard
          id="about"
          icon={<Shield className="h-5 w-5" />}
          title="About"
          isExpanded={expandedSections.has('about')}
          onToggle={() => toggleSection('about')}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Built with</span>
              <span className="font-medium">Next.js + TypeScript</span>
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
