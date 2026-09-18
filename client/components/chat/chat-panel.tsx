"use client";

import { useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useChat } from "@ai-sdk/react";
import { format } from "date-fns";
import {
  RiAddLine,
  RiChat3Line,
  RiDeleteBinLine,
  RiErrorWarningLine,
  RiGlobalLine,
  RiSendPlaneLine,
} from "@remixicon/react";

import type { ChatMessage, Citation } from "@/lib/api";
import {
  conversationKeys,
  useConversationMessages,
  useConversations,
  useDeleteConversation,
} from "@/hooks/use-conversations";
import { selectModel, useChatStore } from "@/store/use-chat-store";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const MODEL_OPTIONS = [
  { value: "gpt-4o-mini", label: "GPT-4o mini" },
  { value: "gpt-4o", label: "GPT-4o" },
] as const;

type ChatUIMessage = UIMessage<{ citations?: Citation[] }>;

function toUIMessage(message: ChatMessage): ChatUIMessage {
  return {
    id: message.id,
    role: message.role === "USER" ? "user" : "assistant",
    parts: [{ type: "text", text: message.content }],
    metadata: { citations: message.citations ?? undefined },
  };
}

function CitationList({ citations }: { citations: Citation[] }) {
  if (citations.length === 0) return null;

  return (
    <ul className="flex max-w-[85%] flex-wrap gap-1.5">
      {citations.map((citation, index) => {
        const label = citation.sourceTitle ?? citation.url ?? "Source";
        const className =
          "inline-flex max-w-48 items-center truncate rounded-full border bg-card px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground";
        return (
          <li key={index}>
            {citation.url ? (
              <a
                href={citation.url}
                target="_blank"
                rel="noreferrer"
                title={citation.excerpt ?? label}
                className={className}
              >
                {citation.sourceType === "WEB" ? (
                  <RiGlobalLine className="mr-1 size-3 shrink-0" />
                ) : null}
                <span className="truncate">{label}</span>
              </a>
            ) : (
              <span title={citation.excerpt ?? label} className={className}>
                <span className="truncate">{label}</span>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function MessageBubble({ message }: { message: ChatUIMessage }) {
  const isUser = message.role === "user";
  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("")
    .trim();
  const usedWebSearch = message.parts.some(
    (part) => part.type === "tool-web_search",
  );
  const citations = message.metadata?.citations;

  if (!text && !usedWebSearch) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        isUser ? "items-end" : "items-start",
      )}
    >
      {usedWebSearch && !isUser ? (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <RiGlobalLine className="size-3" />
          Searched the web
        </span>
      ) : null}
      {text ? (
        <div
          className={cn(
            "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground",
          )}
        >
          {text}
        </div>
      ) : null}
      {!isUser && citations?.length ? (
        <CitationList citations={citations} />
      ) : null}
    </div>
  );
}

function ConversationList({
  workspaceId,
  activeId,
  disabled,
  onSelect,
  onNew,
  onDeletedActive,
}: {
  workspaceId: string;
  activeId: string | null;
  disabled: boolean;
  onSelect: (conversationId: string) => void;
  onNew: () => void;
  onDeletedActive: () => void;
}) {
  const conversationsQuery = useConversations(workspaceId);
  const deleteConversation = useDeleteConversation(workspaceId);

  return (
    <div className="flex min-h-0 flex-col gap-2 rounded-xl border bg-card p-3">
      <Button
        variant="outline"
        size="sm"
        onClick={onNew}
        disabled={disabled}
        className="w-full"
      >
        <RiAddLine />
        New chat
      </Button>
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
        {conversationsQuery.isPending ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full rounded-lg" />
          ))
        ) : conversationsQuery.data?.length ? (
          conversationsQuery.data.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                "group flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm transition-colors",
                conversation.id === activeId
                  ? "bg-muted font-medium"
                  : "hover:bg-muted/60",
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(conversation.id)}
                disabled={disabled}
                className="flex min-w-0 flex-1 flex-col items-start text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="w-full truncate">
                  {conversation.title ?? "Untitled chat"}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {format(new Date(conversation.updatedAt), "MMM d")}
                </span>
              </button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Delete conversation"
                disabled={disabled || deleteConversation.isPending}
                onClick={() =>
                  deleteConversation.mutate(conversation.id, {
                    onSuccess: () => {
                      if (conversation.id === activeId) onDeletedActive();
                    },
                  })
                }
                className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
              >
                <RiDeleteBinLine className="text-muted-foreground" />
              </Button>
            </div>
          ))
        ) : (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">
            No conversations yet
          </p>
        )}
      </div>
    </div>
  );
}

export function ChatPanel({
  workspaceId,
  defaultModel,
}: {
  workspaceId: string;
  defaultModel?: string;
}) {
  const queryClient = useQueryClient();

  // Client/UI state lives in the chat store; server data stays in React Query.
  const conversationId = useChatStore((s) => s.conversationId);
  const setConversationId = useChatStore((s) => s.setConversationId);
  const webSearch = useChatStore((s) => s.webSearch);
  const setWebSearch = useChatStore((s) => s.setWebSearch);
  const input = useChatStore((s) => s.input);
  const setInput = useChatStore((s) => s.setInput);
  const storeSetModel = useChatStore((s) => s.setModel);
  const modelOverride = useChatStore((s) => s.modelOverride);
  const scrollRef = useRef<HTMLDivElement>(null);

  // The model selection is a per-workspace override: until the user picks a
  // model the workspace default is used, and switching workspaces falls back
  // to the new default without an effect resetting state.
  const model = selectModel({ modelOverride }, workspaceId, defaultModel);
  const setModel = (value: string) => storeSetModel(workspaceId, value);

  const historyQuery = useConversationMessages(workspaceId, conversationId);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<ChatUIMessage>({
        api: `/api/workspaces/${workspaceId}/chat`,
        credentials: "include",
        body: {
          conversationId: conversationId ?? undefined,
          model,
          webSearch,
        },
        // The server creates the conversation on the first message and
        // returns its id as a response header. `useChat` no longer exposes
        // an `onResponse` hook, so the response is intercepted here to
        // adopt that id — follow-up messages then stay in the same chat.
        fetch: async (input, init) => {
          const response = await fetch(input, init);
          const newId = response.headers.get("X-Conversation-Id");
          if (newId && newId !== conversationId) {
            setConversationId(newId);
            queryClient.invalidateQueries({
              queryKey: conversationKeys.lists(workspaceId),
            });
          }
          return response;
        },
      }),
    [workspaceId, conversationId, model, webSearch, queryClient, setConversationId],
  );

  const { messages, setMessages, sendMessage, status, error } =
    useChat<ChatUIMessage>({ transport });

  const isBusy = status === "submitted" || status === "streaming";

  // Clear the shared composer draft + selection when switching workspaces so
  // one workspace's unsent text doesn't leak into another.
  useEffect(() => {
    setInput("");
    setConversationId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  // Load persisted history when a conversation is selected (not mid-stream).
  useEffect(() => {
    if (historyQuery.data && !isBusy) {
      setMessages(historyQuery.data.map(toUIMessage));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyQuery.data]);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages]);

  const handleSelect = (id: string) => {
    if (id === conversationId || isBusy) return;
    setConversationId(id);
  };

  const handleNew = () => {
    if (isBusy) return;
    setConversationId(null);
    setMessages([]);
  };

  const showEmpty = !conversationId && messages.length === 0;

  const submitMessage = () => {
    const text = input.trim();
    if (!text || isBusy) return;
    setInput("");
    void sendMessage({ text });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
      <ConversationList
        workspaceId={workspaceId}
        activeId={conversationId}
        disabled={isBusy}
        onSelect={handleSelect}
        onNew={handleNew}
        onDeletedActive={() => {
          setConversationId(null);
          setMessages([]);
        }}
      />

      <div className="flex min-h-0 flex-col gap-3">
        <div
          ref={scrollRef}
          className="flex h-[420px] flex-col gap-4 overflow-y-auto rounded-xl border bg-card p-4"
        >
          {showEmpty ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-muted">
                <RiChat3Line className="size-6 text-muted-foreground" />
              </span>
              <p className="text-sm font-medium">Ask your sources anything</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Answers are grounded in this workspace&apos;s sources and come
                with citations. Start a new chat below.
              </p>
            </div>
          ) : conversationId && historyQuery.isPending ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className={cn(
                    "h-12 rounded-2xl",
                    index % 2 === 0 ? "w-2/3 self-start" : "w-1/2 self-end",
                  )}
                />
              ))}
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {isBusy ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Spinner />
                  Thinking…
                </div>
              ) : null}
            </>
          )}
        </div>

        {error ? (
          <Alert variant="destructive">
            <RiErrorWarningLine />
            <AlertTitle>Chat error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        ) : null}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            submitMessage();
          }}
          className="flex flex-col gap-2"
        >
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submitMessage();
              }
            }}
            placeholder="Ask a question… (Enter to send, Shift+Enter for a new line)"
            aria-label="Message"
            rows={2}
            className="max-h-32 resize-none overflow-y-auto"
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <Select
                value={model}
                onValueChange={(value) => {
                  if (value) setModel(value);
                }}
              >
                <SelectTrigger className="h-8 w-36 text-xs" aria-label="Model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Switch
                  checked={webSearch}
                  onCheckedChange={setWebSearch}
                  aria-label="Web search"
                />
                Web search
              </label>
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={isBusy || !input.trim()}
            >
              {isBusy ? <Spinner /> : <RiSendPlaneLine />}
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
