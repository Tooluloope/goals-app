'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Pencil,
  Check,
  X,
  Settings2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConfigStore } from '@/store/config-store';
import { useAuthStore } from '@/store/auth-store';
import { useToast } from '@/hooks/use-toast';
import {
  COLOR_PRESETS,
  getColorClasses,
  StatusConfig,
  AreaConfig,
  PriorityConfig,
  CadenceConfig,
  TaskStatusConfig,
} from '@/types/config';
import { cn } from '@/lib/utils';

type ConfigItemType = 'status' | 'area' | 'priority' | 'cadence' | 'taskStatus';

interface EditingItem {
  type: ConfigItemType;
  item: StatusConfig | AreaConfig | PriorityConfig | CadenceConfig | TaskStatusConfig | null;
  isNew: boolean;
}

export default function ConfigurePage() {
  const router = useRouter();
  const { currentWorkspace } = useAuthStore();
  const { toast } = useToast();
  const configStore = useConfigStore();

  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: 'slate',
    description: '',
    days: 7,
    level: 1,
    type: 'active' as 'active' | 'completed' | 'cancelled' | 'pending',
    showInBoard: true,
    countAsProgress: false,
  });

  if (!currentWorkspace) {
    return (
      <AppLayout title="Configure">
        <div className="p-4">Please select a workspace first.</div>
      </AppLayout>
    );
  }

  const config = configStore.getConfig(currentWorkspace.id);

  const handleEdit = (type: ConfigItemType, item: EditingItem['item']) => {
    setEditingItem({ type, item, isNew: false });
    if (item) {
      setFormData({
        name: item.name,
        color: item.color,
        description: 'description' in item ? item.description || '' : '',
        days: 'days' in item ? item.days : 7,
        level: 'level' in item ? item.level : 1,
        type: 'type' in item ? item.type : 'active',
        showInBoard: 'showInBoard' in item ? item.showInBoard : true,
        countAsProgress: 'countAsProgress' in item ? item.countAsProgress : false,
      });
    }
  };

  const handleAdd = (type: ConfigItemType) => {
    setEditingItem({ type, item: null, isNew: true });
    setFormData({
      name: '',
      color: 'slate',
      description: '',
      days: 7,
      level: 1,
      type: 'active',
      showInBoard: true,
      countAsProgress: false,
    });
  };

  const handleSave = () => {
    if (!editingItem || !formData.name.trim()) return;

    const workspaceId = currentWorkspace.id;

    switch (editingItem.type) {
      case 'status':
        if (editingItem.isNew) {
          configStore.addStatus(workspaceId, {
            name: formData.name,
            color: formData.color,
            type: formData.type as 'active' | 'completed' | 'cancelled',
            showInBoard: formData.showInBoard,
            countAsProgress: formData.countAsProgress,
          });
        } else if (editingItem.item) {
          configStore.updateStatus(workspaceId, editingItem.item.id, {
            name: formData.name,
            color: formData.color,
            type: formData.type as 'active' | 'completed' | 'cancelled',
            showInBoard: formData.showInBoard,
            countAsProgress: formData.countAsProgress,
          });
        }
        break;

      case 'area':
        if (editingItem.isNew) {
          configStore.addArea(workspaceId, {
            name: formData.name,
            color: formData.color,
            description: formData.description,
          });
        } else if (editingItem.item) {
          configStore.updateArea(workspaceId, editingItem.item.id, {
            name: formData.name,
            color: formData.color,
            description: formData.description,
          });
        }
        break;

      case 'priority':
        if (editingItem.isNew) {
          configStore.addPriority(workspaceId, {
            name: formData.name,
            color: formData.color,
            level: formData.level,
          });
        } else if (editingItem.item) {
          configStore.updatePriority(workspaceId, editingItem.item.id, {
            name: formData.name,
            color: formData.color,
            level: formData.level,
          });
        }
        break;

      case 'cadence':
        if (editingItem.isNew) {
          configStore.addCadence(workspaceId, {
            name: formData.name,
            color: formData.color,
            days: formData.days,
          });
        } else if (editingItem.item) {
          configStore.updateCadence(workspaceId, editingItem.item.id, {
            name: formData.name,
            color: formData.color,
            days: formData.days,
          });
        }
        break;

      case 'taskStatus':
        if (editingItem.isNew) {
          configStore.addTaskStatus(workspaceId, {
            name: formData.name,
            color: formData.color,
            type: formData.type as 'pending' | 'active' | 'completed',
            countAsProgress: formData.countAsProgress,
          });
        } else if (editingItem.item) {
          configStore.updateTaskStatus(workspaceId, editingItem.item.id, {
            name: formData.name,
            color: formData.color,
            type: formData.type as 'pending' | 'active' | 'completed',
            countAsProgress: formData.countAsProgress,
          });
        }
        break;
    }

    toast({
      title: editingItem.isNew ? 'Item added' : 'Item updated',
      variant: 'success',
    });
    setEditingItem(null);
  };

  const handleDelete = (type: ConfigItemType, id: string) => {
    const workspaceId = currentWorkspace.id;

    switch (type) {
      case 'status':
        configStore.deleteStatus(workspaceId, id);
        break;
      case 'area':
        configStore.deleteArea(workspaceId, id);
        break;
      case 'priority':
        configStore.deletePriority(workspaceId, id);
        break;
      case 'cadence':
        configStore.deleteCadence(workspaceId, id);
        break;
      case 'taskStatus':
        configStore.deleteTaskStatus(workspaceId, id);
        break;
    }

    toast({
      title: 'Item deleted',
      variant: 'success',
    });
  };

  const ColorSelector = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="grid grid-cols-10 gap-1">
      {COLOR_PRESETS.map((preset) => {
        const classes = getColorClasses(preset.value);
        return (
          <button
            key={preset.value}
            type="button"
            onClick={() => onChange(preset.value)}
            className={cn(
              'w-6 h-6 rounded-full border-2 transition-all',
              classes.bg,
              value === preset.value ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'
            )}
            title={preset.name}
          />
        );
      })}
    </div>
  );

  const ConfigItemCard = ({
    item,
    type,
    extra,
  }: {
    item: StatusConfig | AreaConfig | PriorityConfig | CadenceConfig | TaskStatusConfig;
    type: ConfigItemType;
    extra?: React.ReactNode;
  }) => {
    const colors = getColorClasses(item.color);
    return (
      <div className="flex items-center justify-between rounded-lg border p-3 bg-card">
        <div className="flex items-center gap-3">
          <div className={cn('w-4 h-4 rounded-full', colors.bg, colors.border, 'border')} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium">{item.name}</span>
              {item.isDefault && (
                <Badge variant="outline" className="text-xs">
                  Default
                </Badge>
              )}
            </div>
            {extra}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(type, item)}>
            <Pencil className="h-4 w-4" />
          </Button>
          {!item.isDefault && (
            <Button variant="ghost" size="icon" onClick={() => handleDelete(type, item.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <AppLayout title="Configure">
      <div className="container max-w-3xl px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Configuration</h1>
            <p className="text-muted-foreground">
              Customize statuses, areas, and other options for {currentWorkspace.name}
            </p>
          </div>
        </div>

        <Tabs defaultValue="statuses" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="statuses">Statuses</TabsTrigger>
            <TabsTrigger value="areas">Areas</TabsTrigger>
            <TabsTrigger value="priorities">Priorities</TabsTrigger>
            <TabsTrigger value="cadences">Cadences</TabsTrigger>
            <TabsTrigger value="taskStatuses">Tasks</TabsTrigger>
          </TabsList>

          {/* Statuses Tab */}
          <TabsContent value="statuses">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Project Statuses</CardTitle>
                    <CardDescription>
                      Configure the columns shown on your board
                    </CardDescription>
                  </div>
                  <Button onClick={() => handleAdd('status')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Status
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {config.statuses.sort((a, b) => a.order - b.order).map((status) => (
                  <ConfigItemCard
                    key={status.id}
                    item={status}
                    type="status"
                    extra={
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {status.type}
                        </Badge>
                        {status.showInBoard && (
                          <Badge variant="outline" className="text-xs">
                            On Board
                          </Badge>
                        )}
                        {status.countAsProgress && (
                          <Badge variant="outline" className="text-xs">
                            Counts as Progress
                          </Badge>
                        )}
                      </div>
                    }
                  />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Areas Tab */}
          <TabsContent value="areas">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Goal Areas</CardTitle>
                    <CardDescription>
                      Categories for organizing your goals
                    </CardDescription>
                  </div>
                  <Button onClick={() => handleAdd('area')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Area
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {config.areas.sort((a, b) => a.order - b.order).map((area) => (
                  <ConfigItemCard
                    key={area.id}
                    item={area}
                    type="area"
                    extra={
                      area.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {area.description}
                        </p>
                      )
                    }
                  />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Priorities Tab */}
          <TabsContent value="priorities">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Priority Levels</CardTitle>
                    <CardDescription>
                      Define priority levels for your goals
                    </CardDescription>
                  </div>
                  <Button onClick={() => handleAdd('priority')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Priority
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {config.priorities.sort((a, b) => a.level - b.level).map((priority) => (
                  <ConfigItemCard
                    key={priority.id}
                    item={priority}
                    type="priority"
                    extra={
                      <Badge variant="secondary" className="text-xs mt-1">
                        Level {priority.level}
                      </Badge>
                    }
                  />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cadences Tab */}
          <TabsContent value="cadences">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Review Cadences</CardTitle>
                    <CardDescription>
                      Define how often goals should be reviewed
                    </CardDescription>
                  </div>
                  <Button onClick={() => handleAdd('cadence')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Cadence
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {config.cadences.sort((a, b) => a.days - b.days).map((cadence) => (
                  <ConfigItemCard
                    key={cadence.id}
                    item={cadence}
                    type="cadence"
                    extra={
                      <Badge variant="secondary" className="text-xs mt-1">
                        Every {cadence.days} days
                      </Badge>
                    }
                  />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Task Statuses Tab */}
          <TabsContent value="taskStatuses">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Task Statuses</CardTitle>
                    <CardDescription>
                      Configure statuses for tasks within goals
                    </CardDescription>
                  </div>
                  <Button onClick={() => handleAdd('taskStatus')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Status
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {config.taskStatuses.sort((a, b) => a.order - b.order).map((status) => (
                  <ConfigItemCard
                    key={status.id}
                    item={status}
                    type="taskStatus"
                    extra={
                      <div className="flex gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {status.type}
                        </Badge>
                        {status.countAsProgress && (
                          <Badge variant="outline" className="text-xs">
                            Counts as Progress
                          </Badge>
                        )}
                      </div>
                    }
                  />
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit/Add Dialog */}
        <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingItem?.isNew ? 'Add' : 'Edit'}{' '}
                {editingItem?.type === 'status'
                  ? 'Status'
                  : editingItem?.type === 'area'
                  ? 'Area'
                  : editingItem?.type === 'priority'
                  ? 'Priority'
                  : editingItem?.type === 'cadence'
                  ? 'Cadence'
                  : 'Task Status'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter name"
                />
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label>Color</Label>
                <ColorSelector
                  value={formData.color}
                  onChange={(color) => setFormData({ ...formData, color })}
                />
              </div>

              {/* Description (for areas) */}
              {editingItem?.type === 'area' && (
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description"
                  />
                </div>
              )}

              {/* Days (for cadences) */}
              {editingItem?.type === 'cadence' && (
                <div className="space-y-2">
                  <Label htmlFor="days">Review interval (days)</Label>
                  <Input
                    id="days"
                    type="number"
                    min={1}
                    value={formData.days}
                    onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) || 1 })}
                  />
                </div>
              )}

              {/* Level (for priorities) */}
              {editingItem?.type === 'priority' && (
                <div className="space-y-2">
                  <Label htmlFor="level">Priority level (1 = highest)</Label>
                  <Input
                    id="level"
                    type="number"
                    min={1}
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })}
                  />
                </div>
              )}

              {/* Status Type (for statuses) */}
              {editingItem?.type === 'status' && (
                <>
                  <div className="space-y-2">
                    <Label>Status Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(v) => setFormData({ ...formData, type: v as typeof formData.type })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active (in progress)</SelectItem>
                        <SelectItem value="completed">Completed (success)</SelectItem>
                        <SelectItem value="cancelled">Cancelled (stopped/failed)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="showInBoard">Show on board</Label>
                    <Switch
                      id="showInBoard"
                      checked={formData.showInBoard}
                      onCheckedChange={(checked) => setFormData({ ...formData, showInBoard: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="countAsProgress">Count as progress</Label>
                    <Switch
                      id="countAsProgress"
                      checked={formData.countAsProgress}
                      onCheckedChange={(checked) => setFormData({ ...formData, countAsProgress: checked })}
                    />
                  </div>
                </>
              )}

              {/* Task Status Type */}
              {editingItem?.type === 'taskStatus' && (
                <>
                  <div className="space-y-2">
                    <Label>Status Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(v) => setFormData({ ...formData, type: v as typeof formData.type })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending (backlog)</SelectItem>
                        <SelectItem value="active">Active (in progress)</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="taskCountAsProgress">Count as progress</Label>
                    <Switch
                      id="taskCountAsProgress"
                      checked={formData.countAsProgress}
                      onCheckedChange={(checked) => setFormData({ ...formData, countAsProgress: checked })}
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!formData.name.trim()}>
                {editingItem?.isNew ? 'Add' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
