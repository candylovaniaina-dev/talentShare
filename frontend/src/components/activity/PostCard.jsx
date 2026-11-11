import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  MoreHorizontal, ThumbsUp, MessageSquare, Share2, MapPin, Loader2, Banknote, Home, Globe,
  Pencil, Trash2, Flag, Send, CheckCircle,
} from "lucide-react";
import api from "../../services/api";
import { card, Avatar, Chip, asArray, fileUrl, timeAgo, getAuthor } from "./shared";

export default function PostCard({
  post, mine, onLike, onShare, onDelete, onEdit, onReport, onPatch, showToast, avatarUrl,
  sentProposals = [], myApplications = [], onOpenOffer, onApply,
}) {
  const author = getAuthor(post);
  const [menuOpen, setMenuOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(null);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [localReaction, setLocalReaction] = useState(post.is_liked ? "like" : null);
  const [localLikesCount, setLocalLikesCount] = useState(post.is_job_offer ? 0 : post.likes_count || 0);
  const menuRef = useRef(null);
  const reactionTimeoutRef = useRef(null);

  const isJobOffer = post.is_job_offer || ["offre", "offer", "job"].includes(post.type);

  const hasApplied = useMemo(() => {
    if (mine) return false;
    const realId = String(post.real_id || post.id).replace(/^(req|job)-/, "");
    if (post.is_job_offer) return (myApplications || []).some((app) => String(app.job_offer_id) === realId);
    if (!sentProposals?.length) return false;
    return sentProposals.some((p) =>
      [p.resource_request_id, p.resourceRequest?.id, p.resource_request?.id, p.request_id, p.subject_id, p.proposalable_id]
        .some((id) => id != null && String(id) === realId)
    );
  }, [mine, post.real_id, post.id, post.is_job_offer, sentProposals, myApplications]);

  useEffect(() => { setLocalLikesCount(post.likes_count || 0); }, [post.likes_count, post.is_job_offer]);

  useEffect(() => {
    const saved = localStorage.getItem(`reaction_${post.id}`);
    setLocalReaction(saved || (post.is_liked ? "like" : null));
  }, [post.is_liked, post.id]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const handleReactionClick = (type) => {
    const newType = localReaction === type ? null : type;
    setLocalReaction(newType);
    setShowReactions(false);
    if (newType && !localReaction) setLocalLikesCount((p) => p + 1);
    else if (!newType && localReaction) setLocalLikesCount((p) => Math.max(0, p - 1));
    if (newType) localStorage.setItem(`reaction_${post.id}`, newType); else localStorage.removeItem(`reaction_${post.id}`);
    if (newType !== null) onLike(post.id, post.real_id || post.id, post.is_job_offer);
  };

  const toggleComments = async () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments === null) {
      setLoadingComments(true);
      try {
        const res = await api.get(`/resource-requests/${post.real_id || post.id}/comments`);
        setComments(asArray(res.data));
      } catch (error) {
        showToast(error.response?.status === 403 ? "Vous n'avez pas accès aux commentaires de cette publication." : "Impossible de charger les commentaires", "error");
        setComments([]);
      } finally {
        setLoadingComments(false);
      }
    }
  };

  const sendComment = async (e) => {
    e.preventDefault();
    const content = newComment.trim();
    if (!content) return;
    setSending(true);
    try {
      const res = await api.post(`/resource-requests/${post.real_id || post.id}/comment`, { content });
      setComments((prev) => [res.data.comment, ...(prev || [])]);
      onPatch(post.id, { comments_count: (post.comments_count || 0) + 1 });
      setNewComment("");
    } catch (error) {
      showToast(error.response?.status === 403 ? "Vous n'êtes pas autorisé à commenter cette publication." : "Impossible d'ajouter le commentaire", "error");
    } finally {
      setSending(false);
    }
  };

  const description = post.description || "";
  const isLong = description.length > 300;
  const shown = isLong && !expanded ? `${description.slice(0, 300)}…` : description;
  const actionBtn = "flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-medium text-slate-500 transition hover:bg-slate-50 active:scale-[.98] dark:text-slate-400 dark:hover:bg-white/5";

  return (
    <article className={`${card} relative overflow-hidden transition duration-300 hover:shadow-[0_14px_36px_-16px_rgba(16,42,67,0.18)]`}>
      <span className={`absolute bottom-5 left-0 top-5 w-[3px] rounded-r-full ${isJobOffer ? "bg-violet-300" : "bg-teal-300"}`} />

      <div className="flex items-start justify-between px-6 pb-2 pt-5">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar src={author.logo} name={author.name} size={44} fit={author.isTalent ? "cover" : "contain"} />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-slate-800 dark:text-white">{author.name}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              {author.subtitle && <><span className="max-w-[160px] truncate">{author.subtitle}</span><span>·</span></>}
              <span>{timeAgo(post.created_at)}</span><Globe size={11} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`hidden rounded-full px-3 py-1 text-[10px] font-medium sm:inline-block ${isJobOffer ? "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300" : "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-300"}`}>
            {isJobOffer ? "Recrutement" : "Demande de talent"}
          </span>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenuOpen((o) => !o)} aria-label="Options" className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 dark:hover:bg-white/10"><MoreHorizontal size={19} /></button>
            {menuOpen && (
              <div className="ts-pop absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-2xl bg-white py-1 shadow-xl ring-1 ring-slate-900/5 dark:bg-[#142B49] dark:ring-white/10">
                {mine ? (
                  <>
                    <button onClick={() => { setMenuOpen(false); onEdit(post); }} className="flex w-full items-center gap-2 px-3.5 py-2.5 text-xs text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"><Pencil size={14} /> Modifier</button>
                    <button onClick={() => { setMenuOpen(false); setShowDeleteModal(true); }} className="flex w-full items-center gap-2 px-3.5 py-2.5 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"><Trash2 size={14} /> Supprimer</button>
                  </>
                ) : (
                  <button onClick={() => { setMenuOpen(false); onReport(post); }} className="flex w-full items-center gap-2 px-3.5 py-2.5 text-xs text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"><Flag size={14} /> Signaler</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-6 pb-4">
        <h3 className="mb-2 text-[17px] font-semibold leading-snug text-slate-800 dark:text-white">{post.title}</h3>
        <p className="whitespace-pre-line text-[14px] leading-relaxed text-slate-600 dark:text-slate-300">{shown}</p>
        {isLong && <button onClick={() => setExpanded((e) => !e)} className="mt-1 text-xs font-medium text-teal-600 hover:underline dark:text-teal-400">{expanded ? "Voir moins" : "Voir plus"}</button>}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {(post.city || post.country) && <Chip icon={MapPin}>{[post.city, post.country].filter(Boolean).join(", ")}</Chip>}
          {post.remote && <Chip icon={Home}>Télétravail</Chip>}
          {(post.budget_min || post.budget_max) && <Chip icon={Banknote}>{post.budget_min || 0} - {post.budget_max || 0} € / jour</Chip>}
        </div>

        {post.skills?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.skills.slice(0, 6).map((s, i) => (
              <span key={s.id ?? i} className="rounded-lg bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600 dark:bg-white/5 dark:text-slate-300">{s.name || s}</span>
            ))}
            {post.skills.length > 6 && <span className="px-2 py-1 text-[11px] text-slate-400">+{post.skills.length - 6}</span>}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between px-6 pb-3 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          {localReaction === "love" ? <span className="text-sm">❤️</span> : localReaction === "like" ? <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#3478E8] text-white"><ThumbsUp size={10} fill="currentColor" /></span> : null}
          <span>{localLikesCount}</span>
        </span>
        <span>{post.comments_count || 0} commentaire(s) · {post.shares_count || 0} partage(s)</span>
      </div>

      <div className="flex items-center gap-1 border-t border-slate-100 px-3 py-2 dark:border-white/5">
        <div className="relative flex-1" onMouseEnter={() => { clearTimeout(reactionTimeoutRef.current); setShowReactions(true); }} onMouseLeave={() => { reactionTimeoutRef.current = setTimeout(() => setShowReactions(false), 500); }}>
          <button onClick={() => handleReactionClick(localReaction === "like" ? null : "like")} className={`${actionBtn} w-full ${localReaction ? "!text-[#3478E8] dark:!text-blue-400" : ""}`}>
            {localReaction === "love" ? <span>❤️ J'adore</span> : <><ThumbsUp size={16} fill={localReaction === "like" ? "currentColor" : "none"} /> J'aime</>}
          </button>
          {showReactions && (
            <div className="ts-pop absolute bottom-full left-0 z-30 mb-1 flex gap-1 rounded-full bg-white p-1.5 shadow-xl ring-1 ring-slate-900/5 dark:bg-[#142B49] dark:ring-white/10">
              <button onClick={() => handleReactionClick("like")} className="flex h-10 w-10 items-center justify-center rounded-full transition hover:scale-110"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3478E8] text-white"><ThumbsUp size={14} fill="currentColor" /></span></button>
              <button onClick={() => handleReactionClick("love")} className="flex h-10 w-10 items-center justify-center rounded-full transition hover:scale-110"><span className="text-2xl">❤️</span></button>
            </div>
          )}
        </div>
        <button onClick={toggleComments} className={`${actionBtn} ${showComments ? "bg-slate-50 dark:bg-white/5" : ""}`}><MessageSquare size={16} /> <span className="hidden sm:inline">Commenter</span></button>
        <button onClick={() => onShare(post)} className={actionBtn}><Share2 size={16} /> <span className="hidden sm:inline">Partager</span></button>

        {!mine && (hasApplied ? (
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-teal-50 px-4 py-2.5 text-[13px] font-medium text-teal-700 dark:bg-teal-500/10 dark:text-teal-300">
            <CheckCircle size={15} /> {isJobOffer ? "Candidature envoyée" : "Proposition envoyée"}
          </span>
        ) : (
          <button
            onClick={() => (isJobOffer ? onOpenOffer?.(String(post.real_id || post.id).replace(/^job-/, "")) : onApply(post))}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium transition active:scale-[.98] ${isJobOffer ? "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-white/10 dark:text-white" : "bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-500/10 dark:text-teal-300"}`}
          >
            <Send size={14} /> {isJobOffer ? "Voir l'offre" : "Proposer"}
          </button>
        ))}
      </div>

      {showComments && (
        <div className="ts-pop space-y-4 border-t border-slate-100 bg-slate-50/60 p-5 dark:border-white/5 dark:bg-white/[0.03]">
          <form onSubmit={sendComment} className="flex items-center gap-3">
            <Avatar src={avatarUrl} name="Moi" size={34} />
            <input value={newComment} onChange={(e) => setNewComment(e.target.value)} maxLength={2000} placeholder="Écrire un commentaire…"
              className="flex-1 rounded-full border-0 bg-white px-4 py-2.5 text-sm outline-none ring-1 ring-slate-900/10 focus:ring-2 focus:ring-teal-300 dark:bg-[#142B49] dark:text-white dark:ring-white/10" />
            <button type="submit" disabled={!newComment.trim() || sending} className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-600 transition disabled:opacity-50 dark:bg-teal-500/20 dark:text-teal-300">
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </form>
          {loadingComments ? (
            <div className="flex justify-center py-3"><Loader2 size={20} className="animate-spin text-teal-500" /></div>
          ) : comments?.length === 0 ? (
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">Soyez le premier à commenter.</p>
          ) : (
            <div className="space-y-3">
              {comments?.map((c) => (
                <div key={c.id} className="flex items-start gap-3">
                  <Avatar src={fileUrl(c.user?.professional_profile?.avatar_path || c.user?.professionalProfile?.avatar_path || c.user?.avatar_path)} name={c.user?.name} size={34} />
                  <div className="min-w-0 rounded-2xl rounded-tl-md bg-white px-4 py-2.5 shadow-sm dark:bg-[#142B49]">
                    <p className="text-[13px] font-medium text-slate-800 dark:text-white">{c.user?.name || "Utilisateur"}</p>
                    <p className="mt-0.5 whitespace-pre-line break-words text-[13px] text-slate-600 dark:text-slate-300">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showDeleteModal && (
        <div className="ts-root fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}>
          <div className="ts-pop w-full max-w-sm space-y-4 rounded-3xl bg-white p-7 text-center shadow-2xl dark:bg-[#112A3A]" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-500/10"><Trash2 size={24} /></div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Supprimer la publication ?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Cette action est irréversible.</p>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300">Annuler</button>
              <button onClick={() => { setShowDeleteModal(false); onDelete(post); }} className="flex-1 rounded-xl bg-rose-50 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-100 dark:bg-rose-500/20 dark:text-rose-300">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}