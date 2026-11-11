import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { AccountRole } from '@/types';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  created_at: string;
}

export function OrderChat({
  orderId,
  orderOwnerId,
  claimedBy,
  userId,
  role,
}: {
  orderId: string;
  orderOwnerId?: string;
  claimedBy?: string | null;
  userId?: string;
  role: AccountRole;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supabase || !userId) {
      setMessages([]);
      return;
    }

    const client = supabase;
    let active = true;
    const loadMessages = async () => {
      try {
        const { data, error: loadError } = await client
          .from('order_messages')
          .select('id, sender_id, recipient_id, body, created_at')
          .eq('order_id', orderId)
          .order('created_at', { ascending: true });
        if (!active) return;
        if (loadError) {
          setError(`Chat se nepodařilo načíst: ${loadError.message}`);
          return;
        }
        setMessages(data ?? []);
        setError('');
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? `Chat se nepodařilo načíst: ${loadError.message}` : 'Chat se nepodařilo načíst.');
      }
    };

    void loadMessages();
    const channel = client
      .channel(`order-chat-${orderId}-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_messages', filter: `order_id=eq.${orderId}` }, () => {
        void loadMessages();
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' && active) setError('Živé aktualizace chatu nejsou dostupné. Zkuste obnovit stránku.');
      });

    return () => {
      active = false;
      void client.removeChannel(channel);
    };
  }, [orderId, userId]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!supabase || !userId || !body.trim() || sending) return;
    const client = supabase;
    if (role === 'carrier' && claimedBy !== userId) {
      setError('Nejprve si zakázku přiřaďte, poté můžete zahájit chat.');
      return;
    }
    if (role === 'shipper' && !claimedBy) {
      setError('Chat bude dostupný po přiřazení dopravce k zakázce.');
      return;
    }
    const recipientId = role === 'carrier' ? orderOwnerId : claimedBy;
    if (!recipientId) {
      setError('Nejprve musí být zakázka přiřazena dopravci, abyste mohli zahájit chat.');
      return;
    }

    setSending(true);
    setError('');
    try {
      const { error: sendError } = await client.from('order_messages').insert({
        order_id: orderId,
        sender_id: userId,
        recipient_id: recipientId,
        body: body.trim(),
      });
      if (sendError) {
        setError(`Zprávu se nepodařilo odeslat: ${sendError.message}`);
        return;
      }
      setBody('');
    } catch (sendError) {
      setError(sendError instanceof Error ? `Zprávu se nepodařilo odeslat: ${sendError.message}` : 'Zprávu se nepodařilo odeslat.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="mt-5">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-300">Chat k zakázce</h3>
      <div ref={listRef} className="mb-2 max-h-56 min-h-20 space-y-2 overflow-y-auto rounded-xl border border-ink-700/70 bg-ink-900/50 p-3">
        {messages.length === 0
          ? <p className="py-3 text-center text-[11px] text-ink-500">{userId ? 'Zatím zde nejsou žádné zprávy.' : 'Chat je dostupný po přihlášení.'}</p>
          : messages.map((message) => (
            <div key={message.id} className={`max-w-[88%] rounded-xl px-3 py-2 text-xs leading-5 ${message.sender_id === userId ? 'ml-auto bg-accent-500/20 text-ink-100' : 'bg-ink-700/70 text-ink-200'}`}>
              <p>{message.body}</p>
              <time className="mt-1 block text-right text-[9px] text-ink-500">{new Date(message.created_at).toLocaleString('cs-CZ')}</time>
            </div>
          ))}
      </div>
      {error && <p role="alert" className="mb-2 text-[11px] leading-4 text-danger-300">{error}</p>}
      <div className="relative">
        <textarea value={body} onChange={(event) => setBody(event.target.value)} disabled={!userId || sending || (role === 'carrier' ? claimedBy !== userId : !claimedBy)} placeholder={!userId ? 'Přihlaste se pro chat' : role === 'carrier' && claimedBy !== userId ? 'Nejprve si přiřaďte zakázku' : !claimedBy ? 'Čeká se na přiřazení dopravce' : 'Napište zprávu…'} rows={2} maxLength={4000} className="field resize-none pr-12 text-xs" />
        <button type="button" onClick={() => void send()} disabled={!userId || !body.trim() || sending || (role === 'carrier' ? claimedBy !== userId : !claimedBy)} aria-label="Odeslat zprávu" className="absolute bottom-2 right-2 rounded-lg bg-accent-500 p-2 text-white transition enabled:hover:bg-accent-600 disabled:opacity-40">
          <Send size={14} />
        </button>
      </div>
    </section>
  );
}
