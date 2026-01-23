'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Bot, Loader2, MessageSquare, Plus, Sparkles, Trash2, Wand2 } from 'lucide-react';

import { AppLayout } from '@/components/layout/app-layout';
import { AiChat } from '@/components/ai/ai-chat';
import { AiInsightsPanel } from '@/components/ai/ai-insights-panel';
import {
  useAiConversations,
  useCreateAiConversation,
  useDeleteAiConversation,
} from '@/hooks/use-ai';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

export default function AiPageV2() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: conversations, isLoading } = useAiConversations();
  const createMutation = useCreateAiConversation();
  const deleteMutation = useDeleteAiConversation();

  const handleCreateConversation = async () => {
    const conversation = await createMutation.mutateAsync(undefined);
    setSelectedConversationId(conversation.id);
  };

  const handleDeleteConversation = async () => {
    if (!deleteId) return;
    await deleteMutation.mutateAsync(deleteId);
    if (selectedConversationId === deleteId) {
      setSelectedConversationId(null);
    }
    setDeleteId(null);
  };

  return (
    <AppLayout title="AI Studio">
      <div className="relative overflow-hidden animate-fade-in">
        <div className="pointer-events-none absolute -left-20 -top-10 h-72 w-72 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-24 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />

        <div className="container max-w-7xl px-4 py-6 md:py-8">
          <section className="rounded-3xl border bg-gradient-to-br from-background via-background to-muted/40 p-5 shadow-sm sm:p-6 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  <Wand2 className="h-4 w-4" />
                  AI Studio
                </div>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
                  Your personal insight engine
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                  Ask about your momentum, generate weekly reviews, or surface patterns across goals
                  and habits.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleCreateConversation}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  New insight
                </Button>
                <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs text-muted-foreground">
                  <Bot className="h-4 w-4 text-primary" />
                  AI conversations sync across devices
                </div>
              </div>
            </div>
          </section>

          <div className="mt-6 grid gap-5 lg:grid-cols-[260px_1fr_320px]">
            <Card className="order-2 h-[calc(100vh-260px)] overflow-hidden border-0 bg-transparent shadow-none lg:order-1">
              <CardHeader className="px-0 pb-3">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Conversations
                </CardTitle>
              </CardHeader>
              <div className="rounded-3xl border bg-card/80 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Recent threads</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleCreateConversation}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <ScrollArea className="mt-3 h-[calc(100vh-360px)] pr-2">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : conversations?.length === 0 ? (
                    <div className="rounded-2xl border border-dashed p-6 text-center">
                      <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">No conversations yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={handleCreateConversation}
                        disabled={createMutation.isPending}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Start a thread
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {conversations?.map((conv) => (
                        <button
                          key={conv.id}
                          className={cn(
                            'group flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left text-sm transition-all',
                            selectedConversationId === conv.id
                              ? 'border-primary/60 bg-primary/5'
                              : 'border-transparent bg-muted/50 hover:border-primary/30 hover:bg-muted'
                          )}
                          onClick={() => setSelectedConversationId(conv.id)}
                        >
                          <MessageSquare className="mt-1 h-4 w-4 text-primary" />
                          <div className="flex-1">
                            <p className="font-semibold truncate">
                              {conv.title || 'New conversation'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(conv.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </Card>

            <Card className="order-1 h-[calc(100vh-260px)] overflow-hidden rounded-3xl border bg-card shadow-sm lg:order-2">
              {selectedConversationId ? (
                <AiChat conversationId={selectedConversationId} />
              ) : (
                <CardContent className="flex h-full flex-col items-center justify-center p-8 text-center">
                  <div className="rounded-full bg-primary/10 p-6">
                    <Sparkles className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">Start a focused insight</h3>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Ask for a weekly summary, trend insights, or a reflection prompt tailored to
                    today.
                  </p>
                  <div className="mt-6 grid w-full max-w-md gap-2 sm:grid-cols-2">
                    <Button
                      variant="outline"
                      className="justify-start gap-2"
                      onClick={handleCreateConversation}
                    >
                      <Sparkles className="h-4 w-4" />
                      Weekly recap
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start gap-2"
                      onClick={handleCreateConversation}
                    >
                      <Sparkles className="h-4 w-4" />
                      Mood patterns
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start gap-2"
                      onClick={handleCreateConversation}
                    >
                      <Sparkles className="h-4 w-4" />
                      Habit focus
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start gap-2"
                      onClick={handleCreateConversation}
                    >
                      <Sparkles className="h-4 w-4" />
                      Month review
                    </Button>
                  </div>
                  <Button
                    className="mt-6"
                    onClick={handleCreateConversation}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Start new chat
                      </>
                    )}
                  </Button>
                </CardContent>
              )}
            </Card>

            <Card className="order-3 h-[calc(100vh-260px)] overflow-hidden rounded-3xl border bg-card shadow-sm">
              <ScrollArea className="h-full">
                <div className="p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Insights
                      </p>
                      <h3 className="text-lg font-semibold">Snapshot</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">Auto-updated</span>
                  </div>
                  <AiInsightsPanel className="space-y-4" />
                </div>
              </ScrollArea>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this conversation and all its messages. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConversation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
