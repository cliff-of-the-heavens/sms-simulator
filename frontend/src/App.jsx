import { useEffect, useState } from "react";
import {
  Activity,
  FileJson,
  FileText,
  Inbox,
  MessageSquareText,
  Phone,
  PlugZap,
  RefreshCw,
  Search,
  Smartphone,
  Trash2,
  X,
  Copy,
  Check
} from "lucide-react";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({ messages: 0, applications: 0, recipients: 0 });
  const [search, setSearch] = useState("");
  const [appName, setAppName] = useState("");
  const [msisdn, setMsisdn] = useState("");
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [integrationOpen, setIntegrationOpen] = useState(false);

  async function load() {
    setLoading(true);
    const p = new URLSearchParams();
    if (search.trim()) p.set("search", search.trim());
    if (appName.trim()) p.set("appName", appName.trim());
    if (msisdn.trim()) p.set("msisdn", msisdn.trim());

    try {
      const [m, s] = await Promise.all([
        fetch("/api/messages?" + p).then(r => r.json()),
        fetch("/api/messages/stats").then(r => r.json())
      ]);
      setMessages(m);
      setStats(s);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [search, appName, msisdn]);

  useEffect(() => {
    const es = new EventSource("/api/messages/events");

    es.onopen = () => setOnline(true);
    es.onerror = () => setOnline(false);

    es.addEventListener("sms", e => {
      const sms = JSON.parse(e.data);
      const q = search.toLowerCase();

      const match =
        (!q ||
          sms.appName.toLowerCase().includes(q) ||
          sms.msisdn.includes(q) ||
          sms.message.toLowerCase().includes(q)) &&
        (!appName || sms.appName.toLowerCase().includes(appName.toLowerCase())) &&
        (!msisdn || sms.msisdn.includes(msisdn));

      if (match) {
        setMessages(x => [sms, ...x].slice(0, 500));
      }

      fetch("/api/messages/stats")
        .then(r => r.json())
        .then(setStats);
    });

    es.addEventListener("clear", () => {
      setMessages([]);
      load();
    });

    return () => es.close();
  }, [search, appName, msisdn]);

  async function clearAll() {
    if (!stats.messages) return;

    if (!confirm(`Clear all ${stats.messages.toLocaleString()} messages? This cannot be undone.`)) {
      return;
    }

    await fetch("/api/messages", { method: "DELETE" });
    setMessages([]);
    load();
  }

  const exportAs = format => {
    window.location.href = `/api/messages/export?format=${format}`;
  };

  const clearFilters = () => {
    setSearch("");
    setAppName("");
    setMsisdn("");
  };

  const hasFilters = Boolean(search.trim() || appName.trim() || msisdn.trim());

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1500px] px-6 py-4">
          <div className="flex min-h-12 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
                <MessageSquareText size={23} />
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-bold tracking-tight text-slate-900">
                    SMS Simulator
                  </h1>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      online
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        online ? "bg-emerald-500" : "bg-slate-400"
                      }`}
                    />
                    {online ? "LIVE" : "OFFLINE"}
                  </span>
                </div>

                <p className="text-sm text-slate-500">
                  Development SMS gateway and message inbox
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                className="icon-action"
                onClick={() => setIntegrationOpen(true)}
                title="Integration guide"
                aria-label="Integration guide"
              >
                <PlugZap size={17} />
              </button>

              <button
                className={`icon-action ${searchOpen || hasFilters ? "icon-action-active" : ""}`}
                onClick={() => setSearchOpen(open => !open)}
                title={searchOpen ? "Hide search" : "Show search"}
                aria-label={searchOpen ? "Hide search" : "Show search"}
              >
                <Search size={17} />
                {hasFilters && <span className="filter-dot" />}
              </button>

              <button className="btn" onClick={() => exportAs("csv")}>
                <FileText size={16} /> Export CSV
              </button>

              <button className="btn" onClick={() => exportAs("json")}>
                <FileJson size={16} /> Export JSON
              </button>

              <button className="btn-danger" onClick={clearAll}>
                <Trash2 size={16} /> Clear
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-6 py-5">
        <section className="grid gap-3 sm:grid-cols-3">
          <Stat icon={<Inbox size={18} />} label="Messages" value={stats.messages} />
          <Stat icon={<Activity size={18} />} label="Applications" value={stats.applications} />
          <Stat icon={<Smartphone size={18} />} label="Recipients" value={stats.recipients} />
        </section>

        {searchOpen && (
          <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="grid gap-2.5 lg:grid-cols-[1.3fr_1fr_1fr_auto]">
              <Field
                icon={<Search size={16} />}
                value={search}
                set={setSearch}
                placeholder="Search message, AppName or MSISDN..."
                autoFocus
              />

              <Field
                icon={<Activity size={16} />}
                value={appName}
                set={setAppName}
                placeholder="AppName"
              />

              <Field
                icon={<Phone size={16} />}
                value={msisdn}
                set={setMsisdn}
                placeholder="MSISDN"
              />

              <button className="btn justify-center" onClick={clearFilters}>
                <X size={16} /> Clear filters
              </button>
            </div>
          </section>
        )}

        <section className={searchOpen ? "mt-5" : "mt-4"}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Received Messages</h2>
              <p className="text-sm text-slate-500">
                {messages.length.toLocaleString()} shown
              </p>
            </div>

            <button
              className="icon-btn"
              title="Refresh"
              onClick={load}
              aria-label="Refresh"
            >
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            </button>
          </div>

          {messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Inbox size={27} />
              </div>
              <h3 className="mt-4 font-semibold">No messages</h3>
              <p className="mt-1 text-sm text-slate-500">
                Send an SMS to <code>/sms/send</code> and it will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map(m => (
                <SmsCard key={m.id} m={m} />
              ))}
            </div>
          )}
        </section>
      </main>

      {integrationOpen && (
        <IntegrationModal onClose={() => setIntegrationOpen(false)} />
      )}

      <style>{`
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px solid #dbe2ea;
          background: #fff;
          border-radius: 10px;
          padding: 9px 13px;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          transition: all .15s ease;
        }
        .btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .btn-danger {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px solid #fecaca;
          background: #fff;
          border-radius: 10px;
          padding: 9px 13px;
          font-size: 13px;
          font-weight: 600;
          color: #dc2626;
        }
        .btn-danger:hover {
          background: #fef2f2;
        }

        .icon-action {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 38px;
          width: 38px;
          border: 1px solid #dbe2ea;
          border-radius: 10px;
          background: #fff;
          color: #64748b;
          transition: all .15s ease;
        }
        .icon-action:hover,
        .icon-action-active {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
        }
        .filter-dot {
          position: absolute;
          right: 6px;
          top: 6px;
          height: 6px;
          width: 6px;
          border-radius: 999px;
          background: #2563eb;
          box-shadow: 0 0 0 2px #fff;
        }

        .field {
          display: flex;
          align-items: center;
          gap: 9px;
          min-height: 40px;
          border: 1px solid #dbe2ea;
          background: #f8fafc;
          border-radius: 10px;
          padding: 0 11px;
          color: #94a3b8;
        }
        .field:focus-within {
          background: #fff;
          border-color: #94a3b8;
          box-shadow: 0 0 0 3px rgba(148,163,184,.12);
        }
        .field input {
          width: 100%;
          outline: none;
          background: transparent;
          font-size: 13px;
          color: #0f172a;
        }
        .field input::placeholder {
          color: #94a3b8;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(15, 23, 42, .42);
          backdrop-filter: blur(3px);
        }
        .integration-modal {
          width: min(820px, 100%);
          max-height: min(88vh, 900px);
          overflow: hidden;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          background: #fff;
          box-shadow: 0 24px 70px rgba(15, 23, 42, .22);
        }
        .modal-close {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 9px;
          color: #64748b;
        }
        .modal-close:hover {
          background: #f1f5f9;
          color: #0f172a;
        }
        .method-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 52px;
          border-radius: 6px;
          padding: 3px 8px;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .04em;
        }
        .method-get {
          background: #e0f2fe;
          color: #0369a1;
        }
        .method-post {
          background: #dcfce7;
          color: #15803d;
        }
        .copy-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid #dbe2ea;
          border-radius: 8px;
          padding: 6px 9px;
          background: #fff;
          color: #475569;
          font-size: 12px;
          font-weight: 600;
        }
        .copy-btn:hover {
          background: #f8fafc;
          color: #0f172a;
        }

        .icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 36px;
          width: 36px;
          border: 1px solid #dbe2ea;
          border-radius: 9px;
          background: #fff;
          color: #64748b;
        }
        .icon-btn:hover {
          background: #f8fafc;
          color: #0f172a;
        }
      `}</style>
    </div>
  );
}

function IntegrationModal({ onClose }) {
  const [copied, setCopied] = useState("");

  const baseUrl = window.location.origin;
  const endpoint = `${baseUrl}/sms/send`;

  const getUrl =
    `${endpoint}?AppName=MO626&MSISDN=265998866442&SMS=` +
    encodeURIComponent("Payment successful.\nAmount: MWK 50,000\nReference: TXN123456");

  const postBody = `{
  "appName": "MO626",
  "msisdn": "265998866442",
  "sms": "Payment successful.\\nAmount: MWK 50,000\\nReference: TXN123456"
}`;

  async function copy(text, key) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 1600);
    } catch {
      // Clipboard may be unavailable in an insecure browser context.
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="integration-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="integration-title"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
              <PlugZap size={19} />
            </div>
            <div>
              <h2 id="integration-title" className="font-semibold text-slate-900">
                SMS Integration
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Send SMS messages to this simulator from your application.
              </p>
            </div>
          </div>

          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-6 py-5">
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-blue-700">
              Simulator endpoint
            </div>
            <div className="mt-1 break-all font-mono text-sm text-blue-950">
              {endpoint}
            </div>
          </div>

          <IntegrationMethod
            title="GET"
            description="Compatible with the traditional query-string interface."
            value={getUrl}
            copied={copied === "get"}
            onCopy={() => copy(getUrl, "get")}
          />

          <IntegrationMethod
            title="POST"
            description="Recommended for new integrations because the message is sent in the request body."
            value={`${endpoint}\n\n${postBody}`}
            copied={copied === "post"}
            onCopy={() => copy(`${endpoint}\n\n${postBody}`, "post")}
            body={postBody}
          />

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500">
            <strong className="text-slate-700">Tip:</strong> For GET requests,
            URL-encode the SMS text. New lines are represented as
            <code className="mx-1 rounded bg-white px-1 py-0.5 font-mono text-slate-700">%0A</code>
            and will be displayed as separate lines in the inbox.
          </div>
        </div>
      </div>
    </div>
  );
}

function IntegrationMethod({ title, description, value, copied, onCopy, body }) {
  const isGet = title === "GET";

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={`method-badge ${isGet ? "method-get" : "method-post"}`}>
              {title}
            </span>
            <span className="text-sm font-semibold text-slate-800">
              {isGet ? "Query parameters" : "JSON request"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>

        <button className="copy-btn" onClick={onCopy}>
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="bg-slate-950 p-4">
        {isGet ? (
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-all font-mono text-xs leading-5 text-slate-200">
            {value}
          </pre>
        ) : (
          <>
            <div className="mb-3 font-mono text-xs font-semibold text-emerald-300">
              POST {window.location.origin}/sms/send
            </div>
            <pre className="overflow-auto whitespace-pre-wrap font-mono text-xs leading-5 text-slate-200">
              {body}
            </pre>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ icon, value, set, placeholder, autoFocus = false }) {
  return (
    <div className="field">
      {icon}
      <input
        autoFocus={autoFocus}
        value={value}
        onChange={e => set(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="flex min-h-[82px] items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        {icon}
      </div>

      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold tracking-tight text-slate-900">
          {value.toLocaleString()}
        </div>
        <div className="text-sm font-medium text-slate-500">{label}</div>
      </div>
    </div>
  );
}

function SmsCard({ m }) {
  const d = new Date(m.receivedAt);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">
            {m.appName}
          </span>
          <span className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            <Phone size={13} />
            {m.msisdn}
          </span>
        </div>

        <div className="text-xs text-slate-400">
          {d.toLocaleDateString()} · {d.toLocaleTimeString()}
          <span className="ml-3 font-mono">#{m.id}</span>
        </div>
      </div>

      <div className="px-5 py-5">
        <div className="whitespace-pre-wrap break-words text-[15px] leading-7 text-slate-700">
          {m.message}
        </div>
      </div>
    </article>
  );
}
