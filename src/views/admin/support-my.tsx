import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  TicketClosedError,
  useAdminMarkTicketReadMutation,
  useAdminPostMessageMutation,
  useAdminTicketQuery,
  useAdminTicketsQuery,
  useAdminUpdateTicketMutation,
} from "@/api/admin-support";
import { Button } from "@/components/Button";
import { Spinner } from "@/components/Loader/Spinner";
import { toastStore } from "@/store/toastStore";
import type { SupportTicketListItem, SupportTicketTab } from "@/types/support";
import {
  formatRelativeTime,
  formatSupportTimestamp,
  getSupportCategoryClass,
  getSupportCategoryLabel,
  getSupportStatusClass,
  getSupportStatusLabel,
  getTicketLastMessageTime,
  getTicketUnreadCount,
  isAdminSupportMessage,
  isSystemSupportMessage,
  isSupportTicketActive,
} from "@/views/support/support-meta";

function getTicketUserLabel(ticket: SupportTicketListItem) {
  return ticket.user.profile.companyName?.trim() || ticket.user.email;
}

export default function AdminMySupportPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<SupportTicketTab>("active");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const lastMarkedRead = useRef<string | null>(null);

  const { data: ticketsData, isLoading, error } = useAdminTicketsQuery({
    assigned: "me",
    status: tab === "closed" ? "CLOSED" : undefined,
    page: 1,
    limit: 100,
  });
  const { data: allAssignedData } = useAdminTicketsQuery({
    assigned: "me",
    page: 1,
    limit: 100,
  });
  const postMessage = useAdminPostMessageMutation();
  const updateTicket = useAdminUpdateTicketMutation();
  const markRead = useAdminMarkTicketReadMutation();

  const tickets = useMemo(() => {
    const source = ticketsData?.items ?? [];
    if (tab === "all") return source;
    if (tab === "closed") return source.filter((ticket) => ticket.status === "CLOSED");
    return source.filter((ticket) => isSupportTicketActive(ticket.status));
  }, [tab, ticketsData?.items]);

  const rawTicketId = searchParams.get("ticketId");
  const requestedTicketId = rawTicketId ? Number(rawTicketId) : null;

  useEffect(() => {
    if (tickets.length === 0) {
      if (selectedId !== null) setSelectedId(null);
      return;
    }

    if (requestedTicketId && tickets.some((ticket) => ticket.id === requestedTicketId)) {
      if (selectedId !== requestedTicketId) setSelectedId(requestedTicketId);
      return;
    }

    const fallbackId = tickets[0]?.id ?? null;
    if (selectedId !== fallbackId) setSelectedId(fallbackId);
    if (fallbackId !== null && rawTicketId !== String(fallbackId)) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("ticketId", String(fallbackId));
      setSearchParams(nextParams, { replace: true });
    }
  }, [rawTicketId, requestedTicketId, searchParams, selectedId, setSearchParams, tickets]);

  const activeId = selectedId ?? tickets[0]?.id ?? null;
  const { data: ticketDetail, isLoading: detailLoading } = useAdminTicketQuery(activeId ?? 0);

  useEffect(() => {
    if (!ticketDetail || !activeId) return;
    const unreadKey = `${activeId}:${ticketDetail.unreadCount ?? 0}`;
    if ((ticketDetail.unreadCount ?? 0) <= 0) return;
    if (lastMarkedRead.current === unreadKey) return;
    lastMarkedRead.current = unreadKey;
    markRead.mutate(activeId);
  }, [activeId, markRead, ticketDetail]);

  const totalUnreadAssigned = useMemo(
    () => (allAssignedData?.items ?? []).reduce((sum, ticket) => sum + getTicketUnreadCount(ticket), 0),
    [allAssignedData?.items],
  );

  function openTicket(id: number) {
    setSelectedId(id);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("ticketId", String(id));
    setSearchParams(nextParams, { replace: true });
  }

  async function handleSend() {
    if (!newMessage.trim() || activeId === null) return;
    try {
      await postMessage.mutateAsync({ ticketId: activeId, body: newMessage.trim() });
      setNewMessage("");
    } catch (err) {
      const message =
        err instanceof TicketClosedError
          ? "This ticket is already closed."
          : err instanceof Error
            ? err.message
            : "Failed to send message";
      toastStore.toast({ title: "Error", description: message, color: "error" });
    }
  }

  async function handleAction(action: "leave" | "close") {
    if (!activeId) return;
    try {
      await updateTicket.mutateAsync({ id: activeId, action });
      toastStore.toast({
        title: action === "leave" ? "Ticket left" : "Ticket closed",
        color: "success",
      });
    } catch (err) {
      toastStore.toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update ticket",
        color: "error",
      });
    }
  }

  return (
    <main className="py-10">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-neutral-900">My tickets</h1>
          {totalUnreadAssigned > 0 && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-green-700 px-1.5 text-xs font-semibold text-white">
              {totalUnreadAssigned > 99 ? "99+" : totalUnreadAssigned}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          Assigned conversations with read state, close flow, and leave-ticket controls.
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      )}

      {!isLoading && error && (
        <p className="py-10 text-center text-sm text-red-500">Failed to load your tickets.</p>
      )}

      {!isLoading && !error && (
        <div className="flex flex-col gap-4 xl:flex-row" style={{ minHeight: 620 }}>
          <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm xl:w-96">
            <div className="border-b border-neutral-100 px-4 py-4">
              <div className="mb-3 flex rounded-xl border border-neutral-200 bg-neutral-50 p-1">
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
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Assigned chats
              </p>
            </div>

            <ul className="flex-1 overflow-y-auto">
              {tickets.map((ticket) => {
                const unreadCount = getTicketUnreadCount(ticket);
                const lastTime = getTicketLastMessageTime(ticket);
                return (
                  <li key={ticket.id}>
                    <button
                      type="button"
                      onClick={() => openTicket(ticket.id)}
                      className={[
                        "w-full border-b border-neutral-100 px-4 py-3 text-left transition-colors hover:bg-neutral-50",
                        activeId === ticket.id ? "bg-green-50" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p
                          className={`truncate text-sm ${unreadCount > 0 ? "font-semibold text-neutral-900" : "font-medium text-neutral-800"}`}
                        >
                          {getTicketUserLabel(ticket)}
                        </p>
                        <span className="shrink-0 text-xs text-neutral-400">
                          {formatRelativeTime(lastTime)}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-neutral-700">{ticket.subject}</p>
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
                <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-6 py-4">
                  <div>
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
                      {ticketDetail.user.profile.companyName || ticketDetail.user.email} - Updated{" "}
                      {formatSupportTimestamp(ticketDetail.updatedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      color="neutral"
                      disabled={updateTicket.isPending || ticketDetail.status === "CLOSED"}
                      onClick={() => handleAction("leave")}
                    >
                      Leave ticket
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      color="neutral"
                      disabled={updateTicket.isPending || ticketDetail.status === "CLOSED"}
                      onClick={() => handleAction("close")}
                    >
                      Close ticket
                    </Button>
                  </div>
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
                        return (
                          <div key={message.id} className="flex justify-end">
                            <div className="max-w-lg rounded-2xl bg-green-600 px-4 py-3 text-sm text-white">
                              <p className="mb-1 text-xs font-semibold text-green-100">You</p>
                              <p>{message.body}</p>
                              <p className="mt-2 text-xs text-green-200">
                                {formatSupportTimestamp(message.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div key={message.id} className="flex justify-start">
                          <div className="max-w-lg rounded-2xl bg-neutral-100 px-4 py-3 text-sm text-neutral-900">
                            <p className="mb-1 text-xs font-semibold text-neutral-500">
                              {ticketDetail.user.profile.companyName || ticketDetail.user.email}
                            </p>
                            <p>{message.body}</p>
                            <p className="mt-2 text-xs text-neutral-400">
                              {formatSupportTimestamp(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className="border-t border-neutral-100 p-4">
                  {ticketDetail.status === "CLOSED" ? (
                    <p className="text-center text-xs text-neutral-400">This ticket is closed.</p>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(event) => setNewMessage(event.target.value)}
                        onKeyDown={(event) => event.key === "Enter" && handleSend()}
                        placeholder="Reply to client..."
                        className="flex-1 rounded-xl border border-neutral-200 px-4 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                      />
                      <Button color="green" onClick={handleSend} disabled={postMessage.isPending}>
                        {postMessage.isPending ? "Sending..." : "Send"}
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </section>
        </div>
      )}
    </main>
  );
}
