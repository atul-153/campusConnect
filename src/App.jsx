import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardList,
  GraduationCap,
  Heart,
  LogOut,
  Megaphone,
  MessageSquareText,
  Plus,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Vote,
  X,
} from "lucide-react";
import { api, request } from "./api.js";

const navigation = [
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "elections", label: "Elections", icon: Vote },
  { id: "ideas", label: "Ideas & suggestions", icon: MessageSquareText },
  { id: "events", label: "Campus events", icon: CalendarDays },
  { id: "complaints", label: "Private complaints", icon: ShieldCheck },
];

function dateLabel(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function App() {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("campusconnect.session"));
    } catch {
      return null;
    }
  });
  const [authMode, setAuthMode] = useState("login");
  const [active, setActive] = useState("overview");
  const [data, setData] = useState({
    dashboard: {},
    elections: [],
    suggestions: [],
    events: [],
    complaints: [],
  });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [modal, setModal] = useState(null);

  const isAdmin = session?.role === "ADMIN";

  async function refresh() {
    if (!session?.token) return;
    const token = session.token;
    const paths = [
      ["dashboard", "/dashboard"],
      ["elections", "/elections"],
      ["suggestions", "/suggestions"],
      ["events", "/events"],
      ["complaints", isAdmin ? "/admin/complaints" : null],
    ];
    const results = await Promise.allSettled(
      paths.map(([, path]) =>
        path ? api(path, { token }) : Promise.resolve([]),
      ),
    );
    setData((current) =>
      Object.fromEntries(
        paths.map(([key], index) => [
          key,
          results[index].status === "fulfilled"
            ? results[index].value
            : current[key],
        ]),
      ),
    );
  }

  useEffect(() => {
    refresh();
  }, [session?.token]);

  async function act(action, success = "Changes saved") {
    setBusy(true);
    try {
      await action();
      await refresh();
      setModal(null);
      setNotice(success);
      window.setTimeout(() => setNotice(""), 2800);
    } catch (error) {
      setNotice(error.message);
      window.setTimeout(() => setNotice(""), 4200);
    } finally {
      setBusy(false);
    }
  }

  async function authenticate(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const path = authMode === "login" ? "/auth/login" : "/auth/register";
    setBusy(true);
    try {
      const result = await api(
        path,
        request("POST", Object.fromEntries(form.entries())),
      );
      const next = {
        token: result.token,
        name: result.name,
        email: result.email,
        role: result.role,
      };
      localStorage.setItem("campusconnect.session", JSON.stringify(next));
      setSession(next);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    localStorage.removeItem("campusconnect.session");
    setSession(null);
    setData({
      dashboard: {},
      elections: [],
      suggestions: [],
      events: [],
      complaints: [],
    });
  }

  if (!session)
    return (
      <AuthScreen
        mode={authMode}
        setMode={setAuthMode}
        onSubmit={authenticate}
        busy={busy}
        notice={notice}
      />
    );

  const upcomingEvents = [...data.events].sort(
    (a, b) => new Date(a.startsAt) - new Date(b.startsAt),
  );
  const sections = {
    overview: (
      <Overview
        data={data}
        isAdmin={isAdmin}
        events={upcomingEvents}
        navigate={setActive}
      />
    ),
    elections: (
      <Elections
        items={data.elections}
        isAdmin={isAdmin}
        act={act}
        openModal={setModal}
        token={session.token}
      />
    ),
    ideas: (
      <Ideas
        items={data.suggestions}
        isAdmin={isAdmin}
        act={act}
        openModal={setModal}
        token={session.token}
      />
    ),
    events: (
      <Events
        items={upcomingEvents}
        isAdmin={isAdmin}
        act={act}
        openModal={setModal}
        token={session.token}
      />
    ),
    complaints: (
      <Complaints
        items={data.complaints}
        isAdmin={isAdmin}
        act={act}
        openModal={setModal}
        token={session.token}
      />
    ),
  };
  const currentNav = navigation.find((item) => item.id === active);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#overview"
          onClick={() => setActive("overview")}
        >
          <span className="brand-mark">
            <GraduationCap size={22} />
          </span>
          <span>
            campus<span className="brand-light">voice</span>
            <small>YOUR CAMPUS, HEARD</small>
          </span>
        </a>
        <div className="campus-switch">
          <span className="campus-dot">N</span>
          <span>
            Northfield College<small>Student community</small>
          </span>
          <ChevronDown size={15} />
        </div>
        <p className="nav-caption">CAMPUS LIFE</p>
        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map(({ id, label, icon: Icon, badge }) => (
            <button
              className={`nav-link ${active === id ? "selected" : ""}`}
              key={id}
              onClick={() => setActive(id)}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {badge && <span className="nav-badge">{badge}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-icon">
            <Heart size={16} />
          </span>
          <p>
            A better campus
            <br />
            starts with <strong>your voice.</strong>
          </p>
          <span className="note-spark">✳</span>
        </div>
        <div className="sidebar-bottom">
          <button className="nav-link">
            <CircleHelp size={18} />
            <span>Help & support</span>
          </button>
          <div className="profile-row">
            <div className="avatar">
              {session.name?.charAt(0)?.toUpperCase()}
            </div>
            <span className="profile-name">
              {session.name}
              <small>{isAdmin ? "Teacher · Admin" : "Student"}</small>
            </span>
            <button
              className="icon-button"
              aria-label="Sign out"
              onClick={logout}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">
            Northfield College <span>/</span> {currentNav?.label}
          </div>
          <div className="top-actions">
            <span className="term-pill">
              <span /> CAMPUS PORTAL · 2026
            </span>
            <button
              className="icon-button notification-button"
              aria-label="Notifications"
            >
              <Bell size={19} />
              <i />
            </button>
            <div className="top-avatar">
              {session.name?.charAt(0)?.toUpperCase()}
            </div>
          </div>
        </header>
        <div className="content-wrap">
          <div className="page-heading">
            <div>
              <p className="eyebrow">
                {isAdmin ? "FACULTY PORTAL" : "STUDENT PORTAL"} <span>·</span>{" "}
                NORTHFIELD COLLEGE
              </p>
              <h1>
                {active === "overview"
                  ? `Good ${getGreeting()}, ${session.name?.split(" ")[0]}.`
                  : currentNav?.label}
              </h1>
              <p className="page-subtitle">{pageSubtitle(active, isAdmin)}</p>
            </div>
            {isAdmin && (active === "events" || active === "elections") && (
              <button
                className="primary-button"
                onClick={() => setModal({ type: active === "events" ? "event" : "election" })}
              >
                <Plus size={17} /> New {active === "events" ? "event" : "election"}
              </button>
            )}
          </div>
          {notice && (
            <div className="toast" role="status">
              <Check size={16} />
              {notice}
              <button onClick={() => setNotice("")} aria-label="Dismiss">
                <X size={15} />
              </button>
            </div>
          )}
          {sections[active]}
          <footer className="page-footer">
            <span>Made for the voices that shape campus.</span>
            <span>Northfield College · 2026</span>
          </footer>
        </div>
      </main>
      {modal && (
        <Modal
          modal={modal}
          close={() => setModal(null)}
          submit={(payload) =>
            act(
              () => submitModal(modal, payload, session.token),
              "Your update is live",
            )
          }
          busy={busy}
        />
      )}
    </div>
  );
}

function AuthScreen({ mode, setMode, onSubmit, busy, notice }) {
  return (
    <main className="auth-page">
      <section className="auth-visual">
        <a className="brand auth-brand" href="#">
          <span className="brand-mark">
            <GraduationCap size={22} />
          </span>
          <span>
            campus<span className="brand-light">voice</span>
            <small>YOUR CAMPUS, HEARD</small>
          </span>
        </a>
        <div className="auth-message">
          <span className="issue-tag">
            <span /> THE NORTHFIELD EDITION · VOL. 01
          </span>
          <h1>
            Campus life
            <br />
            is a <em>conversation.</em>
          </h1>
          <p>
            Big ideas, better events, a campus that feels like yours. It starts
            when someone speaks up.
          </p>
          <div className="auth-orbit">
            <div className="orbit-center">
              <Megaphone size={29} />
            </div>
            <span className="orbit-tag tag-one">
              Ideas, in motion <ArrowUpRight size={14} />
            </span>
            <span className="orbit-tag tag-two">
              Your vote matters <Vote size={14} />
            </span>
            <span className="orbit-tag tag-three">
              A campus that listens <Heart size={14} />
            </span>
          </div>
        </div>
        <div className="visual-footer">
          <span>EST. FOR STUDENTS, BY STUDENTS</span>
          <span>01 — 04</span>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-mobile-brand">
          <GraduationCap size={20} /> campusconnect
        </div>
        <div className="auth-form-wrap">
          <p className="eyebrow">NORTHFIELD COLLEGE</p>
          <h2>{mode === "login" ? "Welcome back." : "Find your voice."}</h2>
          <p className="auth-intro">
            {mode === "login"
              ? "Sign in to see what’s happening on campus."
              : "Create your student account to join the conversation."}
          </p>
          <form onSubmit={onSubmit} className="auth-form">
            {mode === "register" && (
              <label>
                Full name
                <input
                  name="name"
                  placeholder="e.g. Alex Morgan"
                  autoComplete="name"
                  required
                  minLength="2"
                />
              </label>
            )}
            <label>
              College email
              <input
                name="email"
                type="email"
                placeholder="you@northfield.edu"
                autoComplete="email"
                required
              />
            </label>
            <label>
              Password
              <input
                name="password"
                type="password"
                placeholder="At least 8 characters"
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                required
                minLength="8"
              />
            </label>
            {notice && (
              <p className="form-error" role="alert">
                {notice}
              </p>
            )}
            <button className="primary-button auth-submit" disabled={busy}>
              {busy
                ? "One moment…"
                : mode === "login"
                  ? "Sign in"
                  : "Create account"}
              <ArrowUpRight size={17} />
            </button>
          </form>
          <p className="auth-switch">
            {mode === "login"
              ? "New to CampusConnect?"
              : "Already have an account?"}{" "}
            <button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
          <div className="auth-privacy">
            <ShieldCheck size={16} />
            <span>
              Your account is protected. Complaints are private to college
              administrators.
            </span>
          </div>
        </div>
        <div className="auth-panel-footer">
          <span>© 2026 NORTHFIELD CAMPUSCONNECT</span>
          <span>PRIVACY · COMMUNITY GUIDELINES</span>
        </div>
      </section>
    </main>
  );
}

function Overview({ data, isAdmin, events, navigate }) {
  const stats = isAdmin
    ? [
        {
          label: "STUDENTS",
          value: data.dashboard.totalStudents ?? "—",
          detail: "Registered members",
          icon: GraduationCap,
          tone: "mint",
        },
        {
          label: "VOTES CAST",
          value: data.dashboard.totalVotes ?? "—",
          detail: "Across all elections",
          icon: Vote,
          tone: "lavender",
        },
        {
          label: "SUGGESTIONS",
          value: data.dashboard.totalSuggestions ?? "—",
          detail: "From your community",
          icon: MessageSquareText,
          tone: "peach",
        },
        {
          label: "COMPLAINTS",
          value: data.dashboard.totalComplaints ?? "—",
          detail: "Private submissions",
          icon: ShieldCheck,
          tone: "blue",
        },
        {
          label: "UPCOMING EVENTS",
          value: data.dashboard.totalEvents ?? "—",
          detail: "On the campus calendar",
          icon: CalendarDays,
          tone: "mint",
        },
      ]
    : [
        {
          label: "OPEN ELECTIONS",
          value:
            data.elections.filter((e) => e.status === "OPEN").length || "—",
          detail: "Make your voice count",
          icon: Vote,
          tone: "mint",
        },
        {
          label: "CAMPUS IDEAS",
          value: data.dashboard.totalSuggestions ?? "—",
          detail: "Ideas from students",
          icon: MessageSquareText,
          tone: "lavender",
        },
        {
          label: "UPCOMING EVENTS",
          value: events.length || "—",
          detail: "Good things ahead",
          icon: CalendarDays,
          tone: "peach",
        },
        {
          label: "YOUR IMPACT",
          value: data.dashboard.myVotes ?? "—",
          detail: "Votes cast so far",
          icon: Heart,
          tone: "blue",
        },
      ];
  return (
    <>
      <section className="welcome-band">
        <div>
          <p className="eyebrow">A LITTLE BIT OF CAMPUS, ALL IN ONE PLACE</p>
          <h2>
            {isAdmin
              ? "Your community is talking."
              : "There’s a lot happening."}
          </h2>
          <p>
            {isAdmin
              ? "Here’s the pulse of your campus community this week."
              : "Stay close to the people, plans, and ideas shaping your campus."}
          </p>
          <button
            className="text-button"
            onClick={() => navigate(isAdmin ? "ideas" : "elections")}
          >
            {isAdmin
              ? "See what students are saying"
              : "Explore open elections"}{" "}
            <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="welcome-art">
          <span className="art-sun" />
          <span className="art-line line-a" />
          <span className="art-line line-b" />
          <span className="art-card card-a">
            <Vote size={19} />
            <small>HAVE YOUR SAY</small>
          </span>
          <span className="art-card card-b">
            <Heart size={19} />
            <small>MAKE IT BETTER</small>
          </span>
          <span className="art-flower">✳</span>
        </div>
      </section>
      <section className="stats-grid">
        {stats.map(({ label, value, detail, icon: Icon, tone }) => (
          <article className="stat-card" key={label}>
            <div className={`stat-icon ${tone}`}>
              <Icon size={18} />
            </div>
            <p>{label}</p>
            <strong>{value}</strong>
            <span>{detail}</span>
          </article>
        ))}
      </section>
      <section className="overview-columns">
        <div className="feed-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">THE COMMUNITY BOARD</p>
              <h3>Ideas worth hearing</h3>
            </div>
            <button className="subtle-button" onClick={() => navigate("ideas")}>
              See all <ArrowUpRight size={15} />
            </button>
          </div>
          {data.suggestions.length ? (
            <div className="mini-ideas">
              {[...data.suggestions]
                .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
                .slice(0, 3)
                .map((idea) => (
                  <article key={idea.id} className="mini-idea">
                    <span className="idea-marker">✳</span>
                    <div>
                      <h4>{idea.title}</h4>
                      <p>{idea.content}</p>
                      <small>
                        {idea.status?.replace("_", " ")} · {idea.score ?? 0}{" "}
                        support
                      </small>
                    </div>
                    <ArrowUpRight size={16} />
                  </article>
                ))}
            </div>
          ) : (
            <EmptyState
              icon={MessageSquareText}
              title="The board is ready for ideas"
              text="Share the first suggestion your campus needs."
              action="Share an idea"
              onClick={() => navigate("ideas")}
            />
          )}
        </div>
        <aside className="events-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">MARK YOUR CALENDAR</p>
              <h3>Coming up</h3>
            </div>
            <button
              className="icon-button"
              aria-label="View events"
              onClick={() => navigate("events")}
            >
              <ArrowUpRight size={17} />
            </button>
          </div>
          {events.length ? (
            events
              .slice(0, 3)
              .map((event) => <EventRow key={event.id} event={event} />)
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="Nothing on the calendar yet"
              text="Check back for campus events."
            />
          )}
        </aside>
      </section>
    </>
  );
}

function Elections({ items, isAdmin, act, openModal, token }) {
  const [expanded, setExpanded] = useState(null);
  return (
    <section className="content-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">YOUR REPRESENTATIVES, YOUR CHOICE</p>
          <h3>Current elections</h3>
        </div>
        <span className="count-pill">{items.length} elections</span>
      </div>
      {items.length ? (
        <div className="election-list">
          {items.map((election) => (
            <article className="election-card" key={election.id}>
              <div className="election-top">
                <span
                  className={`status-label ${election.status?.toLowerCase()}`}
                >
                  {election.status === "OPEN"
                    ? "● Voting open"
                    : election.status === "PUBLISHED"
                      ? "✓ Results published"
                      : "Voting closed"}
                </span>
                <span className="election-category">
                  {election.category?.replace("_", " ")}
                </span>
              </div>
              <h3>{election.title}</h3>
              <p>{election.description}</p>
              <div className="election-footer">
                <span>{election.voteCount ?? 0} votes cast</span>
                {election.status === "OPEN" && !isAdmin && (
                  <button
                    className="text-button"
                    onClick={() =>
                      setExpanded(expanded === election.id ? null : election.id)
                    }
                  >
                    Choose a candidate <ArrowUpRight size={15} />
                  </button>
                )}
                {election.status === "PUBLISHED" && (
                  <span className="published-hint">Results are in</span>
                )}
                {isAdmin && (
                  <button
                    className="subtle-button"
                    onClick={() => openModal({ type: "candidate", election })}
                  >
                    Manage candidates <Plus size={14} />
                  </button>
                )}
              </div>
              {isAdmin && (
                <AdminElectionTools
                  election={election}
                  act={act}
                  openModal={openModal}
                  token={token}
                />
              )}
              {expanded === election.id && (
                <div className="candidate-grid">
                  {election.candidates?.map((candidate) => (
                    <button
                      className="candidate-option"
                      key={candidate.id}
                      onClick={() =>
                        act(
                          () =>
                            api(`/elections/${election.id}/vote`, {
                              ...request("POST", { candidateId: candidate.id }),
                              token,
                            }),
                          "Your vote has been counted",
                        )
                      }
                    >
                      <span className="candidate-initial">
                        {candidate.name
                          ?.split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                      <span>
                        <strong>{candidate.name}</strong>
                        <small>{candidate.platform || "Candidate"}</small>
                      </span>
                      <ArrowUpRight size={16} />
                    </button>
                  ))}
                </div>
              )}
              {election.status === "PUBLISHED" && (
                <div className="results-list">
                  {election.candidates
                    ?.slice()
                    .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))
                    .map((candidate) => (
                      <div className="result-row" key={candidate.id}>
                        <span>{candidate.name}</span>
                        <strong>{candidate.votes ?? 0} votes</strong>
                      </div>
                    ))}
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Vote}
          title="No elections just yet"
          text="When an election opens, candidates will appear here."
        />
      )}
    </section>
  );
}

function AdminElectionTools({ election, act, openModal, token }) {
  const frozen =
    election.status === "OPEN" ||
    election.status === "PUBLISHED" ||
    election.voteCount > 0;
  const changeStatus = (status) =>
    act(
      () =>
        api(`/admin/elections/${election.id}/status`, {
          ...request("PATCH", { status }),
          token,
        }),
      `Election ${formatStatus(status).toLowerCase()}`,
    );

  return (
    <div className="admin-election-tools">
      <div className="admin-tool-row">
        <button
          className="subtle-button"
          onClick={() => openModal({ type: "election-edit", election })}
        >
          Edit details
        </button>
        <button
          className="subtle-button"
          disabled={frozen}
          onClick={() => openModal({ type: "candidate", election })}
        >
          Add candidate <Plus size={14} />
        </button>
        {election.status === "DRAFT" && (
          <button
            className="subtle-button"
            disabled={(election.candidates?.length ?? 0) < 2}
            onClick={() => changeStatus("OPEN")}
          >
            Open voting <ArrowUpRight size={14} />
          </button>
        )}
        {election.status === "OPEN" && (
          <button
            className="subtle-button"
            onClick={() => changeStatus("CLOSED")}
          >
            Close voting
          </button>
        )}
        {election.status === "CLOSED" && (
          <>
            <button
              className="subtle-button"
              onClick={() => changeStatus("OPEN")}
            >
              Reopen voting
            </button>
            <button
              className="subtle-button"
              onClick={() => changeStatus("PUBLISHED")}
            >
              Publish results <ArrowUpRight size={14} />
            </button>
          </>
        )}
        {election.status !== "OPEN" && election.status !== "PUBLISHED" && (
          <button
            className="subtle-button remove-button"
            onClick={() => {
              if (window.confirm("Remove this election?")) {
                act(
                  () =>
                    api(`/admin/elections/${election.id}`, {
                      method: "DELETE",
                      token,
                    }),
                  "Election removed",
                );
              }
            }}
          >
            Remove election <X size={14} />
          </button>
        )}
      </div>
      {!!election.candidates?.length && (
        <div className="admin-candidate-list">
          {election.candidates.map((candidate) => (
            <div className="admin-candidate-row" key={candidate.id}>
              <span>
                <strong>{candidate.name}</strong>
                <small>{candidate.platform || "No platform added"}</small>
              </span>
              <button
                className="subtle-button"
                disabled={frozen}
                onClick={() =>
                  openModal({ type: "candidate-edit", election, candidate })
                }
              >
                Edit
              </button>
              <button
                className="icon-button remove-button"
                disabled={frozen}
                title="Remove candidate"
                onClick={() =>
                  act(
                    () =>
                      api(`/admin/candidates/${candidate.id}`, {
                        method: "DELETE",
                        token,
                      }),
                    "Candidate removed",
                  )
                }
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Ideas({ items, isAdmin, act, openModal, token }) {
  const [sort, setSort] = useState("score");
  const [draft, setDraft] = useState("");
  const sorted = useMemo(
    () =>
      [...items].sort((a, b) =>
        sort === "recent"
          ? new Date(b.createdAt) - new Date(a.createdAt)
          : (b.score ?? 0) - (a.score ?? 0),
      ),
    [items, sort],
  );
  return (
    <section className="content-panel">
      <div className="ideas-intro">
        <div>
          <p className="eyebrow">SMALL THOUGHTS. REAL CHANGE.</p>
          <h3>The suggestion board</h3>
          <p>Good ideas get better when we build them together.</p>
        </div>
        <div className="sort-control">
          <button
            className={sort === "score" ? "active" : ""}
            onClick={() => setSort("score")}
          >
            <ArrowUp size={14} /> Top
          </button>
          <button
            className={sort === "recent" ? "active" : ""}
            onClick={() => setSort("recent")}
          >
            Recent
          </button>
        </div>
      </div>
      {!isAdmin && (
        <form
          className="idea-composer"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.trim()) return;
            act(
              () =>
                api("/suggestions", {
                  ...request("POST", {
                    title: draft.trim(),
                    content: draft.trim(),
                  }),
                  token,
                }),
              "Your idea has been shared",
            );
            setDraft("");
          }}
        >
          <div className="composer-avatar">✳</div>
          <input
            aria-label="Share a campus suggestion"
            placeholder="What would make campus life better?"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength="180"
          />
          <button className="primary-button" disabled={!draft.trim()}>
            <Plus size={16} /> Share idea
          </button>
        </form>
      )}
      <div className="suggestion-list">
        {sorted.map((item) => (
          <article className="suggestion-card" key={item.id}>
            <div className="vote-stack">
              <button
                aria-label="Support suggestion"
                onClick={() =>
                  act(
                    () =>
                      api(`/suggestions/${item.id}/reaction`, {
                        ...request("PUT", { liked: true }),
                        token,
                      }),
                    "Your reaction was recorded",
                  )
                }
              >
                <ThumbsUp size={16} />
              </button>
              <strong>{item.score ?? 0}</strong>
              <button
                aria-label="Do not support suggestion"
                onClick={() =>
                  act(
                    () =>
                      api(`/suggestions/${item.id}/reaction`, {
                        ...request("PUT", { liked: false }),
                        token,
                      }),
                    "Your reaction was recorded",
                  )
                }
              >
                <ThumbsDown size={16} />
              </button>
            </div>
            <div className="suggestion-content">
              <div className="suggestion-top">
                <span
                  className={`status-label status-${item.status?.toLowerCase().replaceAll("_", "-")}`}
                >
                  {formatStatus(item.status)}
                </span>
                <span className="suggestion-date">
                  {dateLabel(item.createdAt)}
                </span>
              </div>
              <h4>{item.title}</h4>
              <p>{item.content}</p>
              <div className="suggestion-byline">
                <span className="tiny-avatar">
                  {item.authorName?.charAt(0) || "S"}
                </span>{" "}
                Shared by {isAdmin ? item.authorName || "Student" : "a student"}{" "}
                {isAdmin && (
                  <button
                    className="subtle-button"
                    onClick={() =>
                      openModal({ type: "status", suggestion: item })
                    }
                  >
                    Update status <ChevronDown size={14} />
                  </button>
                )}
              </div>
            </div>
            {isAdmin && (
              <button
                className="icon-button remove-button"
                title="Remove suggestion"
                onClick={() =>
                  act(
                    () =>
                      api(`/admin/suggestions/${item.id}`, {
                        method: "DELETE",
                        token,
                      }),
                    "Suggestion removed",
                  )
                }
              >
                <X size={16} />
              </button>
            )}
          </article>
        ))}
        {!sorted.length && (
          <EmptyState
            icon={MessageSquareText}
            title="A fresh page"
            text="No suggestions have been shared yet. Start with something small."
          />
        )}
      </div>
    </section>
  );
}

function Complaints({ items, isAdmin, act, openModal, token }) {
  return (
    <section className="content-panel">
      <div className="privacy-banner">
        <ShieldCheck size={22} />
        <div>
          <strong>
            {isAdmin
              ? "Private faculty inbox"
              : "A private channel to your college"}
          </strong>
          <p>
            {isAdmin
              ? "Only authorized administrators can access complaint details."
                  : "Your complaint goes directly to college administrators and is never shown on the public board."}
          </p>
        </div>
        <span className="lock-badge">PRIVATE</span>
      </div>
      {!isAdmin && (
        <button
          className="primary-button complaint-cta"
          onClick={() => openModal({ type: "complaint" })}
        >
          <Plus size={16} /> Submit a complaint
        </button>
      )}
      <div className="complaint-list">
        {items.map((item) => (
          <article className="complaint-row" key={item.id}>
            <div className="complaint-icon">
              <ShieldCheck size={18} />
            </div>
            <div className="complaint-main">
              <div className="suggestion-top">
                <span
                  className={`status-label status-${item.status?.toLowerCase().replaceAll("_", "-")}`}
                >
                  {formatStatus(item.status)}
                </span>
                <span className="suggestion-date">
                  {dateLabel(item.createdAt)}
                </span>
              </div>
              <h4>
                {isAdmin
                  ? `${item.subject} · ${item.authorName}`
                  : item.subject}
              </h4>
              <p>{item.description}</p>
              {isAdmin && (
                <div className="complaint-actions">
                  <button
                    className="subtle-button"
                    onClick={() =>
                      openModal({ type: "complaint-status", complaint: item })
                    }
                  >
                    Update status <ChevronDown size={14} />
                  </button>
                  <button
                    className="icon-button remove-button"
                    title="Remove complaint"
                    onClick={() =>
                      act(
                        () =>
                          api(`/admin/complaints/${item.id}`, {
                            method: "DELETE",
                            token,
                          }),
                        "Complaint removed",
                      )
                    }
                  >
                    <X size={15} />
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
        {!items.length && isAdmin && (
          <EmptyState
            icon={ClipboardList}
            title="Inbox is clear"
            text="New private complaints will appear here."
          />
        )}
      </div>
    </section>
  );
}

function Events({ items, isAdmin, act, openModal, token }) {
  return (
    <section className="content-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">MAKE ROOM FOR SOMETHING GOOD</p>
          <h3>On the campus calendar</h3>
        </div>
        {isAdmin && (
          <button
            className="primary-button"
            onClick={() => openModal({ type: "event" })}
          >
            <Plus size={16} /> Add event
          </button>
        )}
      </div>
      {items.length ? (
        <div className="event-grid">
          {items.map((event) => (
            <article className="event-card" key={event.id}>
              <div className="event-date-tile">
                <strong>{new Date(event.startsAt).getDate()}</strong>
                <span>
                  {new Intl.DateTimeFormat("en", { month: "short" })
                    .format(new Date(event.startsAt))
                    .toUpperCase()}
                </span>
              </div>
              <div className="event-details">
                <span className="event-category">
                  {event.category || "CAMPUS EVENT"}
                </span>
                <h4>{event.title}</h4>
                <p>{event.description}</p>
                <div className="event-meta">
                  <span>
                    <CalendarDays size={14} />
                    {new Intl.DateTimeFormat("en", {
                      weekday: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    }).format(new Date(event.startsAt))}
                  </span>
                  <span>{event.location}</span>
                </div>
              </div>
              {isAdmin && (
                <div className="event-actions">
                  <button
                    className="icon-button"
                    title="Edit event"
                    onClick={() => openModal({ type: "event-edit", event })}
                  >
                    <ClipboardList size={16} />
                  </button>
                  <button
                    className="icon-button remove-button"
                    title="Delete event"
                    onClick={() =>
                      act(
                        () =>
                          api(`/admin/events/${event.id}`, {
                            method: "DELETE",
                            token,
                          }),
                        "Event deleted",
                      )
                    }
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="A little quiet around here"
          text="New campus events will show up as soon as they’re planned."
        />
      )}
    </section>
  );
}

function EventRow({ event }) {
  return (
    <article className="event-row">
      <div className="event-date-tile small">
        <strong>{new Date(event.startsAt).getDate()}</strong>
        <span>
          {new Intl.DateTimeFormat("en", { month: "short" })
            .format(new Date(event.startsAt))
            .toUpperCase()}
        </span>
      </div>
      <div>
        <h4>{event.title}</h4>
        <p>
          {event.location} ·{" "}
          {new Intl.DateTimeFormat("en", {
            hour: "numeric",
            minute: "2-digit",
          }).format(new Date(event.startsAt))}
        </p>
      </div>
      <ArrowUpRight size={15} />
    </article>
  );
}

function EmptyState({ icon: Icon, title, text, action, onClick }) {
  return (
    <div className="empty-state">
      <span>
        <Icon size={21} />
      </span>
      <h4>{title}</h4>
      <p>{text}</p>
      {action && (
        <button className="text-button" onClick={onClick}>
          {action} <ArrowUpRight size={15} />
        </button>
      )}
    </div>
  );
}

function Modal({ modal, close, submit, busy }) {
  const configs = {
    complaint: {
      title: "Share a private complaint",
      fields: [
        ["subject", "Subject", "text"],
        ["description", "What happened?", "textarea"],
      ],
    },
    event: {
      title: "Add a campus event",
      fields: [
        ["title", "Event name", "text"],
        ["description", "A little about it", "textarea"],
        ["startsAt", "Date and time", "datetime-local"],
        ["location", "Where is it?", "text"],
        ["category", "Category", "text"],
      ],
    },
    "event-edit": {
      title: "Edit campus event",
      fields: [
        ["title", "Event name", "text"],
        ["description", "A little about it", "textarea"],
        ["startsAt", "Date and time", "datetime-local"],
        ["location", "Where is it?", "text"],
        ["category", "Category", "text"],
      ],
    },
    election: {
      title: "Create an election",
      fields: [
        ["title", "Election title", "text"],
        ["description", "About this election", "textarea"],
        [
          "category",
          "Election category",
          "select",
          ["COLLEGE_BACHELOR_REP", "CLASS_REP"],
        ],
      ],
    },
    "election-edit": {
      title: "Edit election details",
      fields: [
        ["title", "Election title", "text"],
        ["description", "About this election", "textarea"],
        [
          "category",
          "Election category",
          "select",
          ["COLLEGE_BACHELOR_REP", "CLASS_REP"],
        ],
      ],
    },
    candidate: {
      title: `Add a candidate · ${modal.election?.title}`,
      fields: [
        ["name", "Candidate name", "text"],
        ["platform", "Their platform", "textarea"],
      ],
    },
    "candidate-edit": {
      title: `Edit candidate · ${modal.election?.title}`,
      fields: [
        ["name", "Candidate name", "text"],
        ["platform", "Their platform", "textarea"],
      ],
    },
    status: {
      title: "Update suggestion status",
      fields: [
        [
          "status",
          "Status",
          "select",
          ["UNDER_REVIEW", "PLANNED", "IN_PROGRESS", "COMPLETED"],
        ],
      ],
    },
    "complaint-status": {
      title: "Update complaint status",
      fields: [
        [
          "status",
          "Status",
          "select",
          ["UNDER_REVIEW", "IN_PROGRESS", "COMPLETED"],
        ],
      ],
    },
  };
  const config = configs[modal.type];
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && close()}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="modal-heading">
          <div>
            <p className="eyebrow">CAMPUSCONNECT</p>
            <h3 id="modal-title">{config.title}</h3>
          </div>
          <button className="icon-button" onClick={close} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit(
              Object.fromEntries(new FormData(event.currentTarget).entries()),
            );
          }}
          className="modal-form"
        >
          {config.fields.map(([name, label, type, options]) => (
            <label key={name}>
              {label}
              {type === "textarea" ? (
                <textarea
                  name={name}
                  rows="4"
                  required
                  maxLength="1200"
                  defaultValue={modal.candidate?.[name] ?? modal.election?.[name] ?? modal.event?.[name] ?? ""}
                />
              ) : type === "select" ? (
                <select
                  name={name}
                  required
                  defaultValue={modal[name] ?? modal.election?.[name] ?? modal.suggestion?.status ?? modal.complaint?.status ?? options[0]}
                >
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {formatStatus(option)}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={type}
                  name={name}
                  required
                  defaultValue={
                    type === "datetime-local" && modal.event?.[name]
                      ? toLocalDateTime(modal.event[name])
                      : modal.candidate?.[name] ?? modal.election?.[name] ?? modal.event?.[name] ?? ""
                  }
                />
              )}
            </label>
          ))}
          <div className="modal-actions">
            <button type="button" className="subtle-button" onClick={close}>
              Cancel
            </button>
            <button className="primary-button" disabled={busy}>
              {busy ? "Saving…" : "Save changes"} <ArrowUpRight size={16} />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

async function submitModal(modal, body, token) {
  if (modal.type === "complaint")
    return api("/complaints", { ...request("POST", body), token });
  if (modal.type === "event")
    return api("/admin/events", {
      ...request("POST", {
        ...body,
        startsAt: new Date(body.startsAt).toISOString(),
      }),
      token,
    });
  if (modal.type === "event-edit")
    return api(`/admin/events/${modal.event.id}`, {
      ...request("PUT", {
        ...body,
        startsAt: new Date(body.startsAt).toISOString(),
      }),
      token,
    });
  if (modal.type === "election")
    return api("/admin/elections", { ...request("POST", body), token });
  if (modal.type === "election-edit")
    return api(`/admin/elections/${modal.election.id}`, {
      ...request("PUT", body),
      token,
    });
  if (modal.type === "candidate")
    return api(`/admin/elections/${modal.election.id}/candidates`, {
      ...request("POST", body),
      token,
    });
  if (modal.type === "candidate-edit")
    return api(`/admin/candidates/${modal.candidate.id}`, {
      ...request("PUT", body),
      token,
    });
  if (modal.type === "status")
    return api(`/admin/suggestions/${modal.suggestion.id}/status`, {
      ...request("PATCH", body),
      token,
    });
  if (modal.type === "complaint-status")
    return api(`/admin/complaints/${modal.complaint.id}/status`, {
      ...request("PATCH", body),
      token,
    });
}

function getGreeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
}
function toLocalDateTime(value) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}
function pageSubtitle(active, isAdmin) {
  const subtitles = {
    overview: isAdmin
      ? "A clear view of your campus community."
      : "A little more connected to the place you call campus.",
    elections: "Choose the people who will speak up for your community.",
    ideas: "The best campus changes start with one small suggestion.",
    events: "Good people, good ideas, and things worth showing up for.",
    complaints:
      "A secure, private line between students and college administrators.",
  };
  return subtitles[active];
}
function formatStatus(status = "") {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default App;
