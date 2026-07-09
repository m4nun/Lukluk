"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, MessageCircle, Plus, X, AlertCircle, MoreHorizontal } from "lucide-react";
import { AppNav } from "@/components/layout/AppNav";

/* ------------------------------------------------------------------ */
/*  Demo data                                                         */
/* ------------------------------------------------------------------ */

interface Comment {
  id: string;
  author: string;
  initials: string;
  color: string;
  text: string;
  time: string;
  replies?: Comment[];
}

interface Post {
  id: string;
  author: string;
  initials: string;
  color: string;
  petType: string;
  petTypeId: string;
  badge: string;
  badgeColor: string;
  time: string;
  body: string;
  photos: string[];
  likes: number;
  liked: boolean;
  comments: Comment[];
  commentsOpen: boolean;
}

const DEMO_POSTS: Post[] = [
  {
    id: "1",
    author: "James D.",
    initials: "JD",
    color: "bg-orange-500",
    petType: "Golden Gentleman",
    petTypeId: "golden-retriever",
    badge: "New Owner",
    badgeColor: "bg-orange-50 text-orange-600 border-orange-200",
    time: "2 hours ago",
    body: "Meet Kiba! Brought him home last week and he's already claimed the couch as his throne. The kids absolutely adore him — I was worried about the shedding but honestly the vacuum's been fine. Best decision we made all year. 🧡",
    photos: ["1.png"],
    likes: 24,
    liked: true,
    commentsOpen: true,
    comments: [
      {
        id: "c1", author: "Mika K.", initials: "MK", color: "bg-purple-500", text: "Kiba is gorgeous! How's the energy level indoors? I'm considering a Golden for my apartment.", time: "1h ago",
      },
      {
        id: "c2", author: "James D.", initials: "JD", color: "bg-orange-500", text: "Surprisingly chill indoors! Two 20-min walks and he's a couch potato. But I wouldn't do a studio — they need room to stretch.", time: "45m ago",
      },
      {
        id: "c3", author: "Sarah P.", initials: "SP", color: "bg-green-500", text: "That face!! What food are you feeding him? Our Golden had skin issues until we switched brands.", time: "30m ago",
      },
      {
        id: "c4", author: "Nat T.", initials: "NT", color: "bg-cyan-500", text: "Congrats! The first week is the hardest — it only gets better from here 💛", time: "15m ago",
      },
    ],
  },
  {
    id: "2",
    author: "Rin L.",
    initials: "RL",
    color: "bg-purple-500",
    petType: "Sassy Siamese",
    petTypeId: "siamese-cat",
    badge: "Experienced Owner",
    badgeColor: "bg-purple-50 text-purple-600 border-purple-200",
    time: "5 hours ago",
    body: "Hot take after 3 years with a Siamese: they're not \"difficult\" — they're communicative. Once you learn their vocal patterns, you realize they're just telling you exactly what they want. Mine has distinct meows for \"food,\" \"play,\" \"clean my litter,\" and \"you're 5 minutes late for lap time.\" It's honestly easier than a cat that just silently resents you 😂\n\nAnyone else decode their cat's vocabulary?",
    photos: [],
    likes: 47,
    liked: false,
    commentsOpen: false,
    comments: [],
  },
  {
    id: "3",
    author: "Amina Y.",
    initials: "AY",
    color: "bg-pink-500",
    petType: "Hop Star",
    petTypeId: "rabbit",
    badge: "New Owner",
    badgeColor: "bg-green-50 text-green-600 border-green-200",
    time: "8 hours ago",
    body: "Built Mochi a DIY bunny castle from cardboard boxes and he hasn't stopped binkying for 20 minutes straight. Total cost: $0 (okay, $4 for non-toxic glue). If you have a rabbit and haven't tried this — do it tonight. The joy is unreal. 🏰🐰",
    photos: ["1.png"],
    likes: 89,
    liked: true,
    commentsOpen: false,
    comments: [],
  },
  {
    id: "4",
    author: "Ken P.",
    initials: "KP",
    color: "bg-cyan-500",
    petType: "Axolotl Angel",
    petTypeId: "axolotl",
    badge: "Experienced Owner",
    badgeColor: "bg-cyan-50 text-cyan-600 border-cyan-200",
    time: "1 day ago",
    body: "People always ask if axolotls are \"boring\" since they mostly sit still. Honestly? That's the appeal. After a stressful day, watching Toothless drift around the tank is better than any meditation app. 10/10 would recommend for anyone who needs a low-maintenance zen buddy. Just don't skip the water chiller — that's the one non-negotiable. 🦎💧",
    photos: [],
    likes: 31,
    liked: false,
    commentsOpen: false,
    comments: [],
  },
];

const FILTERS = [
  { label: "All Pets", active: true },
  { label: "Dogs", dot: "bg-orange-500" },
  { label: "Cats", dot: "bg-purple-500" },
  { label: "Small Pets", dot: "bg-green-500" },
  { label: "Exotic", dot: "bg-cyan-500" },
];

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function CommunityPage() {
  const [posts, setPosts] = useState<Post[]>(DEMO_POSTS);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState("");

  function toggleLike(postId: string) {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const wasLiked = p.liked;
        return { ...p, liked: !wasLiked, likes: wasLiked ? p.likes - 1 : p.likes + 1 };
      })
    );
  }

  function toggleComments(postId: string) {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, commentsOpen: !p.commentsOpen } : p))
    );
  }

  function flagPost() {
    setToast("Reported — we'll review this post. Thank you for keeping the community safe.");
    setTimeout(() => setToast(""), 3000);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />

      <div className="mx-auto w-full max-w-[680px] flex-1 px-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-10">
          <div>
            <h1 className="text-[clamp(24px,4vw,28px)] font-extrabold tracking-tight">Community</h1>
            <p className="mt-1 text-sm text-muted-foreground">Stories, photos, and tips from real pet owners</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Share Your Pet
          </button>
        </div>

        {/* Disclaimer */}
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-card px-3.5 py-2.5 text-xs text-muted-foreground">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
          <span>
            Community posts are from fellow pet owners — not expert advice. If you see something concerning, tap the <strong>•••</strong> menu to report it.
          </span>
        </div>

        {/* Filter bar */}
        <div className="mt-5 mb-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f.label}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${
                f.active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card text-muted-foreground hover:border-foreground/20 hover:text-foreground"
              }`}
            >
              {f.dot && <span className={`inline-block h-1.5 w-1.5 rounded-full ${f.dot}`} />}
              {f.label}
            </button>
          ))}
        </div>

        {/* Feed */}
        <div className="space-y-4 pb-16">
          {posts.map((post) => (
            <article
              key={post.id}
              className="overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md"
            >
              {/* Post header */}
              <div className="flex items-center gap-2.5 px-5 pt-4">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${post.color}`}>
                  <span className="text-xs font-bold text-white">{post.initials}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight">{post.author}</p>
                  <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{post.petType}</span>
                    <span className={`rounded-full border px-1.5 py-px text-[10px] font-semibold ${post.badgeColor}`}>
                      {post.badge}
                    </span>
                    <span>{post.time}</span>
                  </p>
                </div>
              </div>

              {/* Photo (if any) */}
              {post.photos.length > 0 && (
                <div className="relative mt-3 aspect-[16/10] w-full overflow-hidden bg-muted">
                  <Image
                    src={`/assets/PetLogo/${post.petTypeId}/${post.photos[0]}`}
                    alt={post.petType}
                    fill
                    className="object-cover"
                    sizes="(max-width: 680px) 100vw, 680px"
                  />
                  <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                    <Image
                      src={`/assets/PetLogo/${post.petTypeId}/1.png`}
                      alt=""
                      width={18}
                      height={18}
                      className="rounded-full object-cover"
                    />
                    {post.petType}
                    {post.photos.length > 1 && (
                      <span className="ml-0.5 opacity-70">· 1/{post.photos.length}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Body */}
              <div className="px-5 pt-3.5">
                {post.body.split("\n\n").map((p, i) => (
                  <p key={i} className={i > 0 ? "mt-2 text-sm leading-relaxed" : "text-sm leading-relaxed"}>
                    {p}
                  </p>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 px-5 py-2.5">
                <button
                  onClick={() => toggleLike(post.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] font-medium transition-all hover:bg-muted ${
                    post.liked ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  <Heart
                    className={`h-[18px] w-[18px] transition-transform duration-200 ${
                      post.liked ? "fill-destructive scale-110" : ""
                    }`}
                  />
                  <span className="tabular-nums">{post.likes}</span>
                </button>
                <button
                  onClick={() => toggleComments(post.id)}
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-all hover:bg-muted"
                >
                  <MessageCircle className="h-[18px] w-[18px]" />
                  <span className="tabular-nums">{post.comments.length}</span>
                </button>
                <button
                  onClick={flagPost}
                  className="ml-auto rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                  title="Report"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>

              {/* Comments */}
              {post.commentsOpen && (
                <div className="border-t border-border bg-muted/40">
                  {post.comments.length > 0 && (
                    <div className="flex flex-col gap-2.5 px-5 py-3">
                      {post.comments.map((c) => (
                        <div key={c.id} className="flex gap-2.5">
                          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${c.color}`}>
                            <span className="text-[11px] font-bold text-white">{c.initials}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold">{c.author}</span>
                              <span className="text-[11px] text-muted-foreground">{c.time}</span>
                            </div>
                            <p className="text-[13px] leading-snug">{c.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2.5 border-t border-border px-5 py-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500">
                      <span className="text-[11px] font-bold text-white">B</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      className="flex-1 bg-transparent text-[13px] placeholder:text-muted-foreground focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && e.currentTarget.value.trim()) {
                          const text = e.currentTarget.value.trim();
                          setPosts((prev) =>
                            prev.map((p) => {
                              if (p.id !== post.id) return p;
                              return {
                                ...p,
                                comments: [
                                  ...p.comments,
                                  {
                                    id: `c${Date.now()}`,
                                    author: "You",
                                    initials: "B",
                                    color: "bg-orange-500",
                                    text,
                                    time: "Just now",
                                  },
                                ],
                              };
                            })
                          );
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                    <button
                      className="text-[13px] font-bold text-primary hover:text-primary/80"
                      onClick={(e) => {
                        const input = (e.target as HTMLElement).previousElementSibling as HTMLInputElement;
                        if (input?.value.trim()) {
                          input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
                        }
                      }}
                    >
                      Post
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-border py-8 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            &larr; Back to home
          </Link>
        </div>
      </div>

      {/* Create Post Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-5"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="w-full max-w-[520px] rounded-2xl bg-card shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between px-6 pt-5">
              <h2 className="text-lg font-bold tracking-tight">Share Your Pet</h2>
              <button
                onClick={() => setShowModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold">Pet Type</label>
                  <select className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                    <option>Select your pet type…</option>
                    <option>Golden Gentleman</option>
                    <option>Sassy Siamese</option>
                    <option>Hop Star</option>
                    <option>Royal Corgi</option>
                    <option>Axolotl Angel</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[13px] font-semibold">Pet Name</label>
                  <input
                    type="text"
                    placeholder="Your pet's name"
                    className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-semibold">Title</label>
                <input
                  type="text"
                  placeholder="A short title for your post"
                  className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-semibold">Your Story</label>
                <textarea
                  rows={4}
                  placeholder="Share your experience, tips, or a fun moment with your pet…"
                  className="resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-semibold">Photos</label>
                <div className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-border px-4 py-8 text-center transition-colors hover:border-primary hover:bg-primary/5">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-[13px] text-muted-foreground">
                    <strong className="text-primary">Click to upload</strong> or drag and drop
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">Up to 5 photos. First photo will be the cover.</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <button
                  onClick={() => setShowModal(false)}
                  className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold transition-colors hover:border-foreground/20"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { alert("Post submitted! (POST /api/community/posts)"); setShowModal(false); }}
                  className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:-translate-y-0.5"
                >
                  Post to Community
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Flag toast */}
      <div
        className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-border bg-card px-4 py-3.5 text-[13px] shadow-lg transition-all duration-300 ${
          toast ? "translate-y-0 opacity-100" : "translate-y-[120px] opacity-0 pointer-events-none"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0 text-success">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        {toast}
      </div>
    </div>
  );
}
