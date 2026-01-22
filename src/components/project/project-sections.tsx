'use client';

import { useState } from 'react';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageGallery } from '@/components/shared/image-gallery';
import { CompactImageGallery } from '@/components/shared/image-gallery';
import { Project, ChecklistItem, Task, ImageAttachment } from '@/types';
import {
  useAddRequirement,
  useToggleRequirement,
  useAddDefinitionOfDone,
  useToggleDefinitionOfDone,
  useCreateTask,
  useUpdateTaskStatus,
  useDeleteTask,
  useUpdateProject,
} from '@/hooks/use-projects';
import { formatDate, cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { useConfigStore } from '@/store/config-store';

interface ProjectSectionsProps {
  project: Project;
}

export function ProjectSections({ project }: ProjectSectionsProps) {
  const { currentWorkspace } = useAuthStore();
  const { getTaskStatusesForWorkspace, getStatusById } = useConfigStore();

  const taskStatuses = currentWorkspace ? getTaskStatusesForWorkspace(currentWorkspace.id) : [];
  const doneTaskStatusIds = taskStatuses.filter(s => s.name === 'Done').map(s => s.id);
  const currentStatus = currentWorkspace ? getStatusById(currentWorkspace.id, project.statusId) : null;
  const isDoneOrFailed = currentStatus?.name === 'Done' || currentStatus?.name === 'Failed';

  const updateProject = useUpdateProject();

  const handleImagesChange = (images: ImageAttachment[]) => {
    updateProject.mutate({
      projectId: project.id,
      updates: { images },
    });
  };

  return (
    <div className="space-y-4">
      {/* Objective */}
      <ObjectiveSection project={project} />

      {/* Collapsible Sections */}
      <Accordion
        type="multiple"
        defaultValue={['definition', 'requirements', 'tasks']}
        className="space-y-4"
      >
        {/* Definition of Done */}
        <AccordionItem value="definition" className="border rounded-2xl bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Definition of Done</span>
              <Badge variant="secondary">
                {project.definitionOfDone.filter((d) => d.completed).length}/
                {project.definitionOfDone.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <ChecklistSection
              projectId={project.id}
              items={project.definitionOfDone}
              type="definitionOfDone"
            />
          </AccordionContent>
        </AccordionItem>

        {/* Requirements */}
        <AccordionItem value="requirements" className="border rounded-2xl bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Requirements</span>
              <Badge variant="secondary">
                {project.requirements.filter((r) => r.completed).length}/
                {project.requirements.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <ChecklistSection
              projectId={project.id}
              items={project.requirements}
              type="requirements"
            />
          </AccordionContent>
        </AccordionItem>

        {/* Tasks */}
        <AccordionItem value="tasks" className="border rounded-2xl bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Tasks</span>
              <Badge variant="secondary">
                {project.tasks.filter((t) => doneTaskStatusIds.includes(t.statusId)).length}/
                {project.tasks.length}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <TasksSection projectId={project.id} tasks={project.tasks} />
          </AccordionContent>
        </AccordionItem>

        {/* Key Decisions */}
        {project.keyDecisions.length > 0 && (
          <AccordionItem value="decisions" className="border rounded-2xl bg-card">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Key Decisions</span>
                <Badge variant="secondary">{project.keyDecisions.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                {project.keyDecisions.map((decision) => (
                  <Card key={decision.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{decision.context}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Chose: <span className="font-medium text-foreground">{decision.chosen}</span>
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(decision.date, 'MMM d')}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {decision.rationale}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Review Notes */}
        {project.reviewNotes.length > 0 && (
          <AccordionItem value="reviews" className="border rounded-2xl bg-card">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Review Notes</span>
                <Badge variant="secondary">{project.reviewNotes.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-4">
                {project.reviewNotes
                  .slice()
                  .reverse()
                  .map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">
                            {formatDate(review.date, 'MMMM d, yyyy')}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Progress:</span>{' '}
                            {review.progress}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Notes:</span>{' '}
                            {review.notes}
                          </div>
                          {review.blockers && (
                            <div>
                              <span className="text-muted-foreground">Blockers:</span>{' '}
                              {review.blockers}
                            </div>
                          )}
                          {review.nextStep && (
                            <div>
                              <span className="text-muted-foreground">Next Step:</span>{' '}
                              {review.nextStep}
                            </div>
                          )}
                          {review.images && review.images.length > 0 && (
                            <div className="pt-2">
                              <CompactImageGallery images={review.images} maxDisplay={4} />
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Metrics */}
        {(project.metrics.primaryMetric ||
          project.metrics.leadingIndicator ||
          project.metrics.riskIndicator) && (
          <AccordionItem value="metrics" className="border rounded-2xl bg-card">
            <AccordionTrigger className="px-4 hover:no-underline">
              <span className="font-semibold">Metrics & Signals</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid gap-4 md:grid-cols-3">
                {project.metrics.primaryMetric && (
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Primary Metric</p>
                    <p className="font-medium mt-1">{project.metrics.primaryMetric}</p>
                  </div>
                )}
                {project.metrics.leadingIndicator && (
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Leading Indicator</p>
                    <p className="font-medium mt-1">{project.metrics.leadingIndicator}</p>
                  </div>
                )}
                {project.metrics.riskIndicator && (
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-xs text-muted-foreground">Risk Indicator</p>
                    <p className="font-medium mt-1">{project.metrics.riskIndicator}</p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Failure Criteria */}
        {project.failureCriteria && (
          <AccordionItem value="failure" className="border rounded-2xl bg-card border-red-200">
            <AccordionTrigger className="px-4 hover:no-underline">
              <span className="font-semibold text-red-600">Failure Criteria</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <p className="text-sm text-muted-foreground">
                {project.failureCriteria}
              </p>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Retrospective (only for Done/Failed) */}
        {isDoneOrFailed && project.retrospective && (
            <AccordionItem value="retro" className="border rounded-2xl bg-card">
              <AccordionTrigger className="px-4 hover:no-underline">
                <span className="font-semibold">Retrospective</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Outcome</p>
                    <p className="font-medium">{project.retrospective.outcome}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">What Worked</p>
                    <p>{project.retrospective.worked}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">What Didn&apos;t</p>
                    <p>{project.retrospective.didnt}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Lessons Learned</p>
                    <p>{project.retrospective.lessons}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

        {/* Images & Attachments */}
        <AccordionItem value="images" className="border rounded-2xl bg-card">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              <span className="font-semibold">Images & Attachments</span>
              {(project.images?.length ?? 0) > 0 && (
                <Badge variant="secondary">{project.images?.length}</Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <ImageGallery
              images={project.images ?? []}
              onImagesChange={handleImagesChange}
              editable
              maxFiles={20}
              emptyMessage="No images attached. Add photos to document your progress."
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

// Objective Section
function ObjectiveSection({ project }: { project: Project }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Objective</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{project.objective}</p>
        {project.successMetric && (
          <div className="mt-4 rounded-lg bg-muted p-3">
            <p className="text-xs text-muted-foreground">Success Metric</p>
            <p className="font-medium mt-1">{project.successMetric}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Checklist Section (for requirements and definition of done)
function ChecklistSection({
  projectId,
  items,
  type,
}: {
  projectId: string;
  items: ChecklistItem[];
  type: 'requirements' | 'definitionOfDone';
}) {
  const [newItem, setNewItem] = useState('');
  const addRequirement = useAddRequirement();
  const toggleRequirement = useToggleRequirement();
  const addDefinitionOfDone = useAddDefinitionOfDone();
  const toggleDefinitionOfDone = useToggleDefinitionOfDone();

  const handleAdd = async () => {
    if (!newItem.trim()) return;

    if (type === 'requirements') {
      await addRequirement.mutateAsync({ projectId, text: newItem });
    } else {
      await addDefinitionOfDone.mutateAsync({ projectId, text: newItem });
    }
    setNewItem('');
  };

  const handleToggle = async (itemId: string) => {
    if (type === 'requirements') {
      await toggleRequirement.mutateAsync({ projectId, itemId });
    } else {
      await toggleDefinitionOfDone.mutateAsync({ projectId, itemId });
    }
  };

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50"
        >
          <Checkbox
            checked={item.completed}
            onCheckedChange={() => handleToggle(item.id)}
            className="h-5 w-5"
          />
          <span
            className={cn(
              'flex-1',
              item.completed && 'line-through text-muted-foreground'
            )}
          >
            {item.text}
          </span>
        </div>
      ))}

      {/* Add New Item */}
      <div className="flex gap-2 pt-2">
        <Input
          placeholder={`Add ${type === 'requirements' ? 'requirement' : 'done criteria'}...`}
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="flex-1"
        />
        <Button
          size="icon"
          variant="outline"
          onClick={handleAdd}
          disabled={!newItem.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Tasks Section
function TasksSection({
  projectId,
  tasks,
}: {
  projectId: string;
  tasks: Task[];
}) {
  const [newTask, setNewTask] = useState('');
  const createTask = useCreateTask();
  const updateTaskStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();
  const { currentWorkspace } = useAuthStore();
  const { getTaskStatusesForWorkspace } = useConfigStore();

  const taskStatuses = currentWorkspace ? getTaskStatusesForWorkspace(currentWorkspace.id) : [];
  const nextActionStatusId = taskStatuses.find(s => s.name === 'Next Action')?.id || 'task-next';
  const doneStatusId = taskStatuses.find(s => s.name === 'Done')?.id || 'task-done';
  const backlogStatusId = taskStatuses.find(s => s.name === 'Backlog')?.id || 'task-backlog';

  const handleAdd = async () => {
    if (!newTask.trim()) return;

    await createTask.mutateAsync({
      projectId,
      title: newTask,
      statusId: nextActionStatusId,
    });
    setNewTask('');
  };

  const handleStatusChange = async (taskId: string, statusId: string) => {
    await updateTaskStatus.mutateAsync({ projectId, taskId, statusId });
  };

  const handleDelete = async (taskId: string) => {
    await deleteTask.mutateAsync({ projectId, taskId });
  };

  const nextActions = tasks.filter((t) => t.statusId === nextActionStatusId);
  const backlog = tasks.filter((t) => t.statusId === backlogStatusId);
  const done = tasks.filter((t) => t.statusId === doneStatusId);

  const TaskItem = ({ task }: { task: Task }) => (
    <div className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/50 group">
      <Checkbox
        checked={task.statusId === doneStatusId}
        onCheckedChange={(checked) =>
          handleStatusChange(task.id, checked ? doneStatusId : nextActionStatusId)
        }
        className="h-5 w-5"
      />
      <span
        className={cn(
          'flex-1',
          task.statusId === doneStatusId && 'line-through text-muted-foreground'
        )}
      >
        {task.title}
      </span>
      {task.dueDate && (
        <span className="text-xs text-muted-foreground">
          {formatDate(task.dueDate, 'MMM d')}
        </span>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        className="opacity-0 group-hover:opacity-100"
        onClick={() => handleDelete(task.id)}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Add New Task */}
      <div className="flex gap-2">
        <Input
          placeholder="Add a task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="flex-1"
        />
        <Button
          size="icon"
          variant="outline"
          onClick={handleAdd}
          disabled={!newTask.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Next Actions */}
      {nextActions.length > 0 && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Next Actions ({nextActions.length})
          </p>
          <div className="space-y-1">
            {nextActions.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Backlog */}
      {backlog.length > 0 && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Backlog ({backlog.length})
          </p>
          <div className="space-y-1">
            {backlog.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}

      {/* Done */}
      {done.length > 0 && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-2">
            Done ({done.length})
          </p>
          <div className="space-y-1">
            {done.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
