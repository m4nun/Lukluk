"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MessageCircle, PawPrint } from "lucide-react";
import AgentChat from "@/components/agent/AgentChat";
import type { ChatMessage } from "@/components/agent/AgentChat";
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton";

export interface WorkspaceLayoutProps {
  /** The workspace/owned profile ID */
  profileId: string;
  /** Display name for the pet */
  petName: string;
  /** URL to the pet logo image */
  logoSrc: string | null;
  /** Badge text shown next to the name (e.g. "Exploring", "Owned") */
  badgeLabel: string;
  /** Badge CSS class — "bg-orange-50 text-orange-600" for decision, "bg-green-50 text-green-600" for owned */
  badgeClass?: string;
  /** Tab definitions */
  tabs: { key: string; label: string }[];
  /** Currently active tab */
  activeTab: string;
  /** Called when user switches tabs */
  onTabChange: (key: string) => void;
  /** Agent chat configuration */
  chat: {
    endpoint: string;
    bodyKey: string;
    suggestions: string[];
    placeholder: string;
    emptyTitle: string;
    emptyDescription: string;
    onMessageSent: () => void;
    messages: ChatMessage[];
    onMessagesChange: (m: ChatMessage[]) => void;
    chatInput: string;
    onChatInputConsumed: () => void;
  };
  /** Whether the chat bottom sheet is open on mobile */
  chatOpen: boolean;
  /** Toggle mobile chat sheet */
  onChatToggle: (open: boolean) => void;
  /** Extra actions rendered in the header right slot */
  headerActions?: React.ReactNode;
  /** Tab content */
  children: React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Error message if loading failed */
  error?: string;
  /** Error back link */
  errorBackHref?: string;
}

export function WorkspaceLayout({
  profileId,
  petName,
  logoSrc,
  badgeLabel,
  badgeClass = "bg-orange-50 text-orange-600 border-orange-200",
  tabs,
  activeTab,
  onTabChange,
  chat,
  chatOpen,
  onChatToggle,
  headerActions,
  children,
  loading,
  error,
  errorBackHref = "/dashboard",
}: WorkspaceLayoutProps) {
  // ── Loading ──
  if (loading) {
    return (
      <div className="flex h-screen flex-col">
        <div className="flex h-14 items-center border-b border-gray-200 bg-white px-5">
          <LoadingSkeleton variant="text" rows={1} />
        </div>
        <div className="flex flex-1">
          <div className="flex-1 overflow-auto p-6">
            <LoadingSkeleton variant="card" />
            <div className="mt-6"><LoadingSkeleton variant="table" rows={6} /></div>
          </div>
          <div className="w-[380px] border-l border-gray-200 bg-white" />
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center px-6">
        <h2 className="text-xl font-bold">Workspace not found</h2>
        <p className="mt-2 text-gray-500">{error}</p>
        <Link href={errorBackHref} className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#fafafa]">
      {/* Desktop Nav */}
      <nav className="hidden md:flex h-14 shrink-0 items-center border-b border-gray-200 bg-white px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <Image src="/assets/logo.png" alt="Lukluk" width={24} height={24} />
            Lukluk
          </Link>
          <div className="h-5 w-px bg-gray-200" />
          <Link href="/dashboard" className="flex items-center gap-1 text-[13px] text-gray-500 transition-colors hover:text-gray-900 rounded-full px-2.5 py-1 hover:bg-gray-100">
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center gap-2.5">
          {logoSrc && (
            <div className="h-7 w-7 overflow-hidden rounded-full border-2 border-gray-200">
              <Image src={logoSrc} alt={petName} width={28} height={28} className="object-cover" />
            </div>
          )}
          <span className="text-sm font-semibold">{petName}</span>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badgeClass}`}>
            <PawPrint className="h-3 w-3" fill="currentColor" />
            {badgeLabel}
          </span>
        </div>
        <div className="w-[100px]" />
      </nav>

      {/* Mobile Nav */}
      <nav className="flex md:hidden h-[52px] shrink-0 items-center border-b border-gray-200 bg-white px-4">
        <Link href="/dashboard" className="flex items-center gap-1 text-sm text-orange-500 font-medium">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="mx-auto flex items-center gap-2">
          {logoSrc && (
            <div className="h-7 w-7 overflow-hidden rounded-full border-2 border-gray-200">
              <Image src={logoSrc} alt={petName} width={28} height={28} className="object-cover" />
            </div>
          )}
          <span className="text-[15px] font-semibold">{petName}</span>
        </div>
        <div className="w-9" />
      </nav>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel */}
        <div className="flex-1 overflow-y-auto">
          {/* Pet Header */}
          <div className="border-b border-gray-200 bg-white px-7 py-5">
            <div className="flex items-center gap-4">
              {logoSrc ? (
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-gray-200">
                  <Image src={logoSrc} alt={petName} width={56} height={56} className="object-cover" />
                </div>
              ) : (
                <div className="h-14 w-14 flex-shrink-0 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center">
                  <PawPrint className="h-6 w-6 text-gray-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>{petName}</h1>
                  <span className="text-[13px] text-gray-400">·</span>
                  <span className="text-[13px] text-gray-500">{tabs[0]?.label ?? ""}</span>
                </div>
                <div className="mt-1 text-[13px] text-gray-500">{badgeLabel}</div>
              </div>
              {headerActions && (
                <div className="flex items-center gap-3">
                  {headerActions}
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 px-5 md:px-7 sticky top-0 bg-[#fafafa] z-10">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => onTabChange(t.key)}
                className={`px-4 py-3 text-[13px] font-semibold border-b-2 transition-colors ${
                  activeTab === t.key
                    ? "border-orange-500 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-5 pb-24 md:p-7 md:pb-7">
            {children}
          </div>
        </div>

        {/* Right Panel — Agent Chat (Desktop) */}
        {!chatOpen && (
          <div className="hidden md:flex w-[380px] shrink-0 flex-col bg-white border-l border-gray-200 overflow-hidden">
            <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-3.5">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
                <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">{chat.emptyTitle}</h3>
                <p className="text-xs text-gray-500">{chat.emptyDescription}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-green-600">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Available
              </div>
            </div>
            <AgentChat
              endpoint={chat.endpoint}
              bodyKey={chat.bodyKey}
              profileId={profileId}
              suggestions={chat.suggestions}
              placeholder={chat.placeholder}
              emptyTitle={chat.emptyTitle}
              emptyDescription={chat.emptyDescription}
              onMessageSent={chat.onMessageSent}
              externalInput={chat.chatInput}
              onExternalInputConsumed={chat.onChatInputConsumed}
              messages={chat.messages}
              onMessagesChange={chat.onMessagesChange}
            />
          </div>
        )}
      </div>

      {/* Mobile Chat FAB */}
      <button
        onClick={() => onChatToggle(true)}
        className="md:hidden fixed bottom-20 right-4 z-30 h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-green-500 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Mobile Bottom Sheet Chat */}
      <div
        className={`md:hidden fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${chatOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => onChatToggle(false)}
      />
      <div
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[20px] flex flex-col transition-transform duration-300 ${chatOpen ? "translate-y-0" : "translate-y-full"}`}
        style={{ height: "85dvh" }}
      >
        <div className="w-9 h-1 rounded-full bg-gray-300 mx-auto mt-2.5 flex-shrink-0" />
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-gray-200 flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center">
            <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-semibold">{chat.emptyTitle}</h3>
            <p className="text-xs text-gray-500">Always available</p>
          </div>
          <button onClick={() => onChatToggle(false)} className="h-8 w-8 rounded-full flex items-center justify-center text-gray-500">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 min-h-0 h-full">
          <AgentChat
            endpoint={chat.endpoint}
            bodyKey={chat.bodyKey}
            profileId={profileId}
            suggestions={chat.suggestions}
            placeholder={chat.placeholder}
            emptyTitle={chat.emptyTitle}
            emptyDescription={chat.emptyDescription}
            onMessageSent={chat.onMessageSent}
            externalInput={chat.chatInput}
            onExternalInputConsumed={chat.onChatInputConsumed}
            messages={chat.messages}
            onMessagesChange={chat.onMessagesChange}
          />
        </div>
      </div>
    </div>
  );
}
