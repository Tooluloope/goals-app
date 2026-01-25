'use client';

import { useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Plus, MessageSquare, Trash2, Loader2, Sparkles, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

export default function AiPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('chat');

  const { data: conversations, isLoading } = useAiConversations();
  const createMutation = useCreateAiConversation();
  const deleteMutation = useDeleteAiConversation();

  const handleCreateConversation = async () => {
    const conversation = await createMutation.mutateAsync(undefined);
    setSelectedConversationId(conversation.id);
    setActiveTab('chat');
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
    <AppLayout title="AI Assistant">
      <div className="container max-w-7xl px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold md:text-3xl flex items-center gap-2">
            <Bot className="h-7 w-7 text-primary" />
            AI Assistant
          </h1>
          <p className="mt-1 text-muted-foreground">
            Get insights about your goals, habits, and progress
          </p>
        </div>

        {/* Mobile Layout with Tabs */}
        <div className="lg:hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="conversations">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chats
              </TabsTrigger>
              <TabsTrigger value="chat">
                <Bot className="h-4 w-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="insights">
                <Sparkles className="h-4 w-4 mr-2" />
                Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="conversations" className="mt-0">
              <Card className="min-h-[60vh]">
                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 border-b">
                  <CardTitle className="text-sm font-medium">Conversations</CardTitle>
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
                </CardHeader>
                <div className="p-2">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : conversations?.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No conversations yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4"
                        onClick={handleCreateConversation}
                        disabled={createMutation.isPending}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        New Chat
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {conversations?.map((conv) => (
                        <div
                          key={conv.id}
                          className={cn(
                            'group flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors',
                            selectedConversationId === conv.id
                              ? 'bg-accent text-accent-foreground'
                              : 'hover:bg-muted'
                          )}
                          onClick={() => {
                            setSelectedConversationId(conv.id);
                            setActiveTab('chat');
                          }}
                        >
                          <MessageSquare className="h-4 w-4 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {conv.title || 'New conversation'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(conv.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="chat" className="mt-0">
              <Card className="h-[60vh] flex flex-col">
                {selectedConversationId ? (
                  <AiChat conversationId={selectedConversationId} />
                ) : (
                  <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-6">
                    <div className="rounded-full bg-primary/10 p-4 mb-3">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">Welcome to AI Assistant</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      I can help you understand your progress and identify patterns.
                    </p>
                    <Button
                      size="sm"
                      onClick={handleCreateConversation}
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="mr-2 h-4 w-4" />
                      )}
                      Start Chat
                    </Button>
                  </CardContent>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="mt-0">
              <Card className="min-h-[60vh]">
                <AiInsightsPanel className="p-4" />
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop Layout with 3 Columns */}
        <div className="hidden lg:grid gap-6 grid-cols-[280px_1fr_320px]">
          {/* Conversations Sidebar */}
          <Card className="h-[calc(100vh-220px)] flex flex-col">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 border-b">
              <CardTitle className="text-sm font-medium">Conversations</CardTitle>
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
            </CardHeader>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : conversations?.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No conversations yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={handleCreateConversation}
                      disabled={createMutation.isPending}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      New Chat
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversations?.map((conv) => (
                      <div
                        key={conv.id}
                        className={cn(
                          'group flex items-center gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer transition-colors',
                          selectedConversationId === conv.id
                            ? 'bg-accent text-accent-foreground'
                            : 'hover:bg-muted'
                        )}
                        onClick={() => setSelectedConversationId(conv.id)}
                      >
                        <MessageSquare className="h-4 w-4 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{conv.title || 'New conversation'}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(conv.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>

          {/* Main Chat Area */}
          <Card className="h-[calc(100vh-220px)] flex flex-col">
            {selectedConversationId ? (
              <AiChat conversationId={selectedConversationId} />
            ) : (
              <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="rounded-full bg-primary/10 p-6 mb-4">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Welcome to AI Assistant</h3>
                <p className="text-muted-foreground max-w-sm mb-6">
                  I can help you understand your progress, identify patterns in your habits, and
                  provide personalized insights about your goals.
                </p>
                <Button onClick={handleCreateConversation} disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Start a Conversation
                    </>
                  )}
                </Button>
              </CardContent>
            )}
          </Card>

          {/* Insights Sidebar - wider column */}
          <Card className="h-[calc(100vh-220px)] flex flex-col">
            <ScrollArea className="flex-1">
              <AiInsightsPanel className="p-4" />
            </ScrollArea>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
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
