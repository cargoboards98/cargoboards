import { useCallback, useEffect, useState } from 'react';
import { Ban, Check, ChevronLeft, ChevronRight, RefreshCw, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  bannedUntil: string | null;
  profile: {
    first_name: string;
    last_name: string;
    phone: string;
    account_type: string;
    ico: string | null;
    role: string;
  } | null;
}

interface AdminUsersResponse {
  users: AdminUser[];
  page: number;
  hasMore: boolean;
}

interface AdminUsersPanelProps {
  currentUserId: string;
  onNotify: (message: string) => void;
}

const formatDate = (date: string | null) =>
  date ? new Date(date).toLocaleDateString('cs-CZ') : 'Nikdy';

export function AdminUsersPanel({ currentUserId, onNotify }: AdminUsersPanelProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async (requestedPage: number) => {
    if (!supabase) {
      setError('Připojení k Supabase není nakonfigurováno.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const { data, error: invokeError } = await supabase.functions.invoke<AdminUsersResponse>('admin-users', {
      body: { action: 'list', page: requestedPage },
    });
    if (invokeError) {
      setError(invokeError.message);
    } else if (!data) {
      setError('Server nevrátil seznam uživatelů.');
    } else {
      setUsers(data.users);
      setPage(data.page);
      setHasMore(data.hasMore);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadUsers(1);
  }, [loadUsers]);

  const performAction = async (target: AdminUser, action: 'ban' | 'unban' | 'delete') => {
    const actionLabel = action === 'delete'
      ? 'trvale smazat'
      : action === 'ban'
        ? 'zablokovat'
        : 'odblokovat';
    if (!window.confirm(`Opravdu chcete účet ${target.email} ${actionLabel}?`)) return;
    if (!supabase) return;

    setBusyUserId(target.id);
    setError(null);
    const { data, error: invokeError } = await supabase.functions.invoke<{ success: boolean; error?: string }>(
      'admin-users',
      { body: { action, userId: target.id } },
    );
    if (invokeError || !data?.success) {
      const message = invokeError?.message ?? data?.error ?? 'Akci se nepodařilo dokončit.';
      setError(message);
      setBusyUserId(null);
      return;
    }

    onNotify(action === 'delete'
      ? 'Účet byl smazán.'
      : action === 'ban'
        ? 'Účet byl zablokován.'
        : 'Účet byl odblokován.');
    await loadUsers(page);
    setBusyUserId(null);
  };

  return (
    <main className="mx-auto min-h-[calc(100dvh-64px)] max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent-300">
            <ShieldCheck size={15} /> Administrace
          </div>
          <h1 className="text-2xl font-bold text-white">Správa uživatelů</h1>
          <p className="mt-1 text-sm text-ink-400">Mazání účtů a blokování přístupu.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadUsers(page)}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-sm font-semibold text-ink-200 transition hover:border-ink-500 disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Obnovit
        </button>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-300">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025]">
        {loading ? (
          <p className="p-8 text-center text-sm text-ink-400">Načítám uživatele…</p>
        ) : users.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-400">V této části nejsou žádní uživatelé.</p>
        ) : (
          <div className="divide-y divide-white/[0.07]">
            {users.map((target) => {
              const isAdmin = target.profile?.role === 'admin';
              const isSelf = target.id === currentUserId;
              const isBanned = Boolean(target.bannedUntil && new Date(target.bannedUntil) > new Date());
              const name = [target.profile?.first_name, target.profile?.last_name].filter(Boolean).join(' ');
              return (
                <article key={target.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-800 text-ink-300">
                      {isAdmin ? <ShieldCheck size={17} /> : <UserRound size={17} />}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{name || target.email}</p>
                      {name && <p className="truncate text-xs text-ink-400">{target.email}</p>}
                      <p className="mt-1 text-[11px] text-ink-500">
                        {target.profile?.account_type ?? 'Bez profilu'}
                        {target.profile?.ico ? ` · IČO ${target.profile.ico}` : ''}
                        {' · '}Registrace {formatDate(target.createdAt)}
                      </p>
                      <p className="text-[11px] text-ink-500">
                        {isAdmin ? 'Správce' : isBanned ? 'Zablokován' : 'Aktivní'}
                        {' · '}Poslední přihlášení {formatDate(target.lastSignInAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2 pl-12 sm:pl-0">
                    {!isAdmin && !isSelf && (
                      <>
                        <button
                          type="button"
                          onClick={() => void performAction(target, isBanned ? 'unban' : 'ban')}
                          disabled={busyUserId === target.id}
                          className="flex items-center gap-1.5 rounded-lg border border-warning-500/25 bg-warning-500/[0.08] px-3 py-2 text-xs font-semibold text-warning-300 transition hover:bg-warning-500/15 disabled:opacity-50"
                        >
                          {isBanned ? <Check size={14} /> : <Ban size={14} />}
                          {isBanned ? 'Odblokovat' : 'Zablokovat'}
                        </button>
                        <button
                          type="button"
                          onClick={() => void performAction(target, 'delete')}
                          disabled={busyUserId === target.id}
                          className="flex items-center gap-1.5 rounded-lg border border-danger-500/25 bg-danger-500/[0.08] px-3 py-2 text-xs font-semibold text-danger-300 transition hover:bg-danger-500/15 disabled:opacity-50"
                        >
                          <Trash2 size={14} /> Smazat
                        </button>
                      </>
                    )}
                    {isSelf && <span className="self-center text-xs text-ink-500">Váš účet</span>}
                    {isAdmin && !isSelf && <span className="self-center text-xs text-ink-500">Správce chráněn</span>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => void loadUsers(page - 1)}
          disabled={loading || page <= 1}
          className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-ink-300 transition hover:bg-white/[0.05] disabled:opacity-40"
        >
          <ChevronLeft size={15} /> Předchozí
        </button>
        <span className="text-xs text-ink-500">Strana {page}</span>
        <button
          type="button"
          onClick={() => void loadUsers(page + 1)}
          disabled={loading || !hasMore}
          className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-ink-300 transition hover:bg-white/[0.05] disabled:opacity-40"
        >
          Další <ChevronRight size={15} />
        </button>
      </div>
    </main>
  );
}
