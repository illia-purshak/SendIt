import { useEffect, useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  useCreateSupportTicketMutation,
  useMarkSupportTicketReadMutation,
  usePostSupportMessageMutation,
  useSupportTicketQuery,
  useSupportTicketsQuery,
} from "@/api/support";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/AlertDialog";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Loader/Spinner";
import { toastStore } from "@/store/toastStore";
import type { SupportTicketCategory, SupportTicketListItem, SupportTicketTab } from "@/types/support";
import {
  formatRelativeTime,
  formatSupportTimestamp,
  getAdminDisplayName,
  getAvatarInitials,
  getSupportCategoryClass,
  getSupportCategoryLabel,
  getSupportStatusClass,
  getSupportStatusLabel,
  getTicketLastMessageTime,
  getTicketPreview,
  getTicketUnreadCount,
  isAdminSupportMessage,
  isSystemSupportMessage,
  isSupportTicketActive,
} from "@/views/support/support-meta";

const CATEGORY_OPTIONS: SupportTicketCategory[] = [
  "QUESTION",
  "TECHNICAL",
  "BILLING",
  "SUGGESTION",
  "OTHER",
];

function sortMostRecentFirst(a: SupportTicketListItem, b: SupportTicketListItem) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

export default function SupportPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<SupportTicketTab>("active");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<SupportTicketCategory>("QUESTION");
  const [draftMessage, setDraftMessage] = useState("");
  const lastMarkedRead = useRef<string | null>(null);

  const { data, isLoading, error } = useSupportTicketsQuery({
    page: 1,
    limit: 100,
  });
  const createTicket = useCreateSupportTicketMutation();
  const postMessage = usePostSupportMessageMutation();
  const markRead = useMarkSupportTicketReadMutation();

  const tickets = useMemo(() => {
    const source = [...(data?.items ?? [])].sort(sortMostRecentFirst);
    if (tab === "all") return source;
    if (tab === "closed") return source.filter((ticket) => ticket.status === "CLOSED");
    return source.filter((ticket) => isSupportTicketActive(ticket.status));
  }, [data?.items, tab]);

  const activeOpenTickets = useMemo(
    () =>
      data?.openCount ??
      (data?.items ?? []).filter((ticket) => isSupportTicketActive(ticket.status)).length,
    [data?.items, data?.openCount],
  );

  const activeId = useMemo(() => {
    if (tickets.length === 0) return null;
    if (selectedId !== null && tickets.some((t) => t.id === selectedId)) return selectedId;
    return tickets[0]?.id ?? null;
  }, [selectedId, tickets]);

  const { data: ticketDetail, isLoading: detailLoading } = useSupportTicketQuery(activeId ?? 0);

  useEffect(() => {
    if (!ticketDetail || !activeId) return;
    const unreadKey = `${activeId}:${ticketDetail.unreadCount ?? 0}`;
    if ((ticketDetail.unreadCount ?? 0) <= 0) return;
    if (lastMarkedRead.current === unreadKey) return;
    lastMarkedRead.current = unreadKey;
    markRead.mutate(activeId);
  }, [activeId, markRead, ticketDetail]);

  async function handleSend() {
    if (!activeId || !newMessage.trim()) return;
    try {
      await postMessage.mutateAsync({ ticketId: activeId, body: newMessage.trim() });
      setNewMessage("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send message";
      toastStore.toast({ title: "Error", description: message, color: "error" });
    }
  }

  async function handleCreateTicket() {
    if (!subject.trim() || !draftMessage.trim()) {
      toastStore.toast({
        title: "Fill in all required fields",
        color: "warning",
      });
      return;
    }

    try {
      const result = await createTicket.mutateAsync({
        subject: subject.trim(),
        category,
        body: draftMessage.trim(),
      });

      setNewTicketOpen(false);
      setSubject("");
      setCategory("QUESTION");
      setDraftMessage("");

      const nextId = (result as { id?: number } | undefined)?.id;
      if (typeof nextId === "number") setSelectedId(nextId);

      toastStore.toast({ title: "Ticket created", color: "success" });
    } catch (err) {
      toastStore.toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create ticket",
        color: "error",
      });
    }
  }

  const isTicketClosed = ticketDetail?.status === "CLOSED";
  const companyName = user?.profile?.companyName || user?.email || "You";

  return (
    <main className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Support</h1>
        <p className="mt-1 text-sm text-neutral-500">Contact our team and track every reply in one place.</p>
      </div>

      <AlertDialog open={newTicketOpen} onOpenChange={setNewTicketOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>New ticket</AlertDialogTitle>
          <AlertDialogDescription>
            Start a new conversation with the SendIt support team.
          </AlertDialogDescription>
          <div className="mt-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-neutral-500">Subject *</span>
              <input
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-neutral-500">Category *</span>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as SupportTicketCategory)}
                className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {getSupportCategoryLabel(option)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-neutral-500">Message *</span>
              <textarea
                rows={5}
                value={draftMessage}
                onChange={(event) => setDraftMessage(event.target.value)}
                className="rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
              />
            </label>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNewTicketOpen(false)}>Cancel</AlertDialogCancel>
            <Button color="green" disabled={createTicket.isPending} onClick={handleCreateTicket}>
              {createTicket.isPending ? "Submitting..." : "Submit"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isLoading && (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      )}

      {!isLoading && error && (
        <p className="py-10 text-center text-sm text-red-500">Failed to load support tickets.</p>
      )}

      {!isLoading && !error && (
        <div className="flex flex-col gap-4 xl:flex-row" style={{ minHeight: 620 }}>
          <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm xl:w-96">
            <div className="border-b border-neutral-100 px-4 py-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Button
                  size="sm"
                  color="green"
                  disabled={activeOpenTickets >= 3}
                  onClick={() => setNewTicketOpen(true)}
                >
                  <Plus size={14} className="mr-1" />
                  New ticket
                </Button>
              </div>
              {activeOpenTickets >= 3 && (
                <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  You have reached the maximum of 3 open tickets.
                </p>
              )}
              <div className="flex rounded-xl border border-neutral-200 bg-neutral-50 p-1">
                {(["active", "closed", "all"] as SupportTicketTab[]).map((nextTab) => (
                  <button
                    key={nextTab}
                    type="button"
                    onClick={() => setTab(nextTab)}
                    className={[
                      "flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                      tab === nextTab
                        ? "bg-white text-neutral-900 shadow-sm"
                        : "text-neutral-500 hover:text-neutral-900",
                    ].join(" ")}
                  >
                    {nextTab === "active" ? "Active" : nextTab === "closed" ? "Closed" : "All"}
                  </button>
                ))}
              </div>
            </div>

            <ul className="flex-1 overflow-y-auto">
              {tickets.map((ticket) => {
                const unreadCount = getTicketUnreadCount(ticket);
                const preview = getTicketPreview(ticket);
                return (
                  <li key={ticket.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(ticket.id)}
                      className={[
                        "w-full border-b border-neutral-100 px-4 py-3 text-left transition-colors hover:bg-neutral-50",
                        activeId === ticket.id ? "bg-green-50" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p
                          className={`truncate text-sm ${unreadCount > 0 ? "font-semibold text-neutral-900" : "font-medium text-neutral-800"}`}
                        >
                          {ticket.subject}
                        </p>
                        <span className="shrink-0 text-xs text-neutral-400">
                          {formatRelativeTime(getTicketLastMessageTime(ticket))}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${getSupportCategoryClass(ticket.category)}`}
                        >
                          {getSupportCategoryLabel(ticket.category)}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${getSupportStatusClass(ticket.status)}`}
                        >
                          {getSupportStatusLabel(ticket.status)}
                        </span>
                        {unreadCount > 0 && (
                          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-green-700 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 truncate text-sm text-neutral-500">{preview || "No messages yet."}</p>
                    </button>
                  </li>
                );
              })}
              {tickets.length === 0 && (
                <li className="px-4 py-12 text-center text-sm text-neutral-400">
                  No tickets in this tab.
                </li>
              )}
            </ul>
          </aside>

          <section className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            {activeId === null ? (
              <div className="flex flex-1 items-center justify-center text-sm text-neutral-400">
                Select a ticket
              </div>
            ) : detailLoading ? (
              <div className="flex flex-1 items-center justify-center">
                <Spinner />
              </div>
            ) : ticketDetail ? (
              <>
                <div className="border-b border-neutral-100 px-6 py-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getSupportCategoryClass(ticketDetail.category)}`}
                    >
                      {getSupportCategoryLabel(ticketDetail.category)}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getSupportStatusClass(ticketDetail.status)}`}
                    >
                      {getSupportStatusLabel(ticketDetail.status)}
                    </span>
                  </div>
                  <p className="font-semibold text-neutral-900">{ticketDetail.subject}</p>
                  <p className="mt-1 text-xs text-neutral-400">
                    Updated {formatSupportTimestamp(ticketDetail.updatedAt)}
                  </p>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                  {[...ticketDetail.messages]
                    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                    .map((message) => {
                      if (isSystemSupportMessage(message)) {
                        return (
                          <div key={message.id} className="flex justify-center">
                            <p className="rounded-full bg-neutral-100 px-3 py-1 text-xs italic text-neutral-500">
                              {message.body}
                            </p>
                          </div>
                        );
                      }

                      if (isAdminSupportMessage(message)) {
                        const adminName = getAdminDisplayName(message.admin);
                        return (
                          <div key={message.id} className="flex justify-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-xs font-semibold text-neutral-600">
                              {getAvatarInitials(adminName)}
                            </div>
                            <div className="max-w-lg rounded-2xl bg-neutral-100 px-4 py-3 text-sm text-neutral-900">
                              <p className="mb-1 text-xs font-semibold text-neutral-500">{adminName}</p>
                              <p>{message.body}</p>
                              <p className="mt-2 text-xs text-neutral-400">
                                {formatSupportTimestamp(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={message.id} className="flex justify-end">
                          <div className="max-w-lg rounded-2xl bg-green-600 px-4 py-3 text-sm text-white">
                            <p className="mb-1 text-xs font-semibold text-green-100">{companyName}</p>
                            <p>{message.body}</p>
                            <p className="mt-2 text-xs text-green-200">
                              {formatSupportTimestamp(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="border-t border-neutral-100 p-4">
                  {isTicketClosed && (
                    <div className="mb-3 rounded-xl bg-amber-50 px-4 py-3 text-center text-xs text-amber-800">
                      This ticket is closed. Send a new message to reopen it.
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(event) => setNewMessage(event.target.value)}
                      onKeyDown={(event) => event.key === "Enter" && handleSend()}
                      placeholder={isTicketClosed ? "Send a message to reopen this ticket..." : "Reply to support..."}
                      className="flex-1 rounded-xl border border-neutral-200 px-4 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    />
                    <Button color="green" onClick={handleSend} disabled={postMessage.isPending}>
                      {postMessage.isPending ? "Sending..." : isTicketClosed ? "Reopen" : "Send"}
                    </Button>
                  </div>
                </div>
              </>
            ) : null}
          </section>
        </div>
      )}
    </main>
  );
}
