import { useEffect, useRef, useState } from "react";
import {
  fetchMessages,
  sendMessage,
  type ThreadType,
  type Audience,
  type ChatMessage,
} from "../api";

function formatTime(iso: string) {
  const d = new Date(iso);
  const mm = `${d.getMonth() + 1}.${d.getDate()}`;
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm} ${hh}:${mi}`;
}

// 예약/상담 건의 소통 스레드 (관리자↔업체 또는 관리자↔고객).
// me = 현재 사용자 역할. 내 메시지는 오른쪽(브랜드), 상대는 왼쪽에 표시.
export default function MessageThread({
  type,
  id,
  audience,
  me,
  title,
}: {
  type: ThreadType;
  id: string;
  audience: Audience;
  me: "admin" | "partner" | "customer";
  title: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const rows = await fetchMessages(type, id, audience);
      setMessages(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, id, audience]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      const msg = await sendMessage(type, id, audience, body);
      setMessages((prev) => [...prev, msg]);
      setText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "전송에 실패했어요.");
    } finally {
      setSending(false);
    }
  }

  const bg =
    audience === "partner" ? "rgba(56,189,248,0.08)" : "rgba(16,185,129,0.08)";

  return (
    <div
      className="card card-pad"
      style={{ marginTop: 12, background: bg }}
    >
      <b className="small">{title}</b>

      <div
        ref={scrollRef}
        style={{ maxHeight: 220, overflowY: "auto", marginTop: 8 }}
      >
        {loading ? (
          <p className="tiny muted center-text" style={{ padding: "10px 0" }}>
            불러오는 중…
          </p>
        ) : messages.length === 0 ? (
          <p className="tiny muted center-text" style={{ padding: "10px 0" }}>
            아직 주고받은 메시지가 없어요.
          </p>
        ) : (
          <div className="stack" style={{ gap: 8 }}>
            {messages.map((m) => {
              const mine = m.sender === me;
              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: mine ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "85%",
                      borderRadius: 16,
                      padding: "7px 12px",
                      fontSize: "0.9rem",
                      background: mine ? "var(--brand)" : "#fff",
                      color: mine ? "#fff" : "var(--ink)",
                      border: mine ? "none" : "1px solid var(--line)",
                    }}
                  >
                    {m.body}
                  </div>
                  <span
                    className="muted"
                    style={{ fontSize: "0.65rem", marginTop: 2 }}
                  >
                    {m.senderName} · {formatTime(m.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <p className="tiny" style={{ color: "var(--rose-600)", marginTop: 4 }}>
          {error}
        </p>
      )}

      <div className="flex gap-8" style={{ marginTop: 8 }}>
        <input
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="메시지를 입력하세요"
          style={{ flex: 1 }}
        />
        <button
          className="btn btn-brand"
          onClick={send}
          disabled={sending || !text.trim()}
          style={{ flexShrink: 0 }}
        >
          전송
        </button>
      </div>
    </div>
  );
}
