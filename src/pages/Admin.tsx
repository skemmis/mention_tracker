import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = ["hsl(240,100%,50%)", "hsl(330,70%,55%)", "hsl(145,65%,38%)", "hsl(30,90%,55%)", "hsl(200,80%,50%)"];

interface AnalyticsEvent {
  id: string;
  created_at: string;
  event_type: string;
  event_data: any;
  session_id: string | null;
  user_agent: string | null;
  referrer: string | null;
}

const Admin = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentEvents, setRecentEvents] = useState<AnalyticsEvent[]>([]);
  const [totalEventCount, setTotalEventCount] = useState(0);
  const [uniqueSessionCount, setUniqueSessionCount] = useState(0);
  const [eventTypeCounts, setEventTypeCounts] = useState<Record<string, number>>({});
  const [topPeople, setTopPeople] = useState<{ name: string; count: number }[]>([]);
  const [topPhrases, setTopPhrases] = useState<{ name: string; count: number }[]>([]);
  const [dailyData, setDailyData] = useState<{ date: string; count: number }[]>([]);
  const [dailySessionData, setDailySessionData] = useState<{ date: string; sessions: number }[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [livestreamUrl, setLivestreamUrl] = useState("");
  const [livestreamInput, setLivestreamInput] = useState("");
  const [configLoading, setConfigLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: fnError } = await supabase.functions.invoke("verify-admin", {
      body: { password },
    });

    if (fnError || !data?.success) {
      setError("WRONG PASSWORD");
      setLoading(false);
      return;
    }

    setAuthenticated(true);
    setLoading(false);
    sessionStorage.setItem("admin_authed", "1");
    sessionStorage.setItem("admin_pwd", password);
  };

  // Load events after auth
  useEffect(() => {
    if (!authenticated) {
      if (sessionStorage.getItem("admin_authed") === "1") {
        setAuthenticated(true);
      }
      return;
    }

    const loadEvents = async () => {
      setDataLoading(true);
      
      const [
        { data: recentData },
        { count },
        { data: sessionCount },
        { data: typeCounts },
        { data: people },
        { data: phrases },
        { data: daily },
        { data: dailySessions },
      ] = await Promise.all([
        supabase
          .from("analytics_events")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(25),
        supabase
          .from("analytics_events")
          .select("*", { count: "exact", head: true }),
        supabase.rpc("count_unique_sessions"),
        supabase.rpc("count_events_by_type"),
        supabase.rpc("top_searched_people", { lim: 10 }),
        supabase.rpc("top_searched_phrases", { lim: 10 }),
        supabase.rpc("daily_event_counts"),
        supabase.rpc("daily_session_counts"),
      ]);

      if (recentData) setRecentEvents(recentData as AnalyticsEvent[]);
      setTotalEventCount(count || 0);
      setUniqueSessionCount(typeof sessionCount === "number" ? sessionCount : 0);

      // Event type counts
      const typeMap: Record<string, number> = {};
      if (typeCounts) (typeCounts as any[]).forEach((r: any) => { typeMap[r.event_type] = Number(r.count); });
      setEventTypeCounts(typeMap);

      if (people) setTopPeople((people as any[]).map((r: any) => ({ name: r.name, count: Number(r.count) })));
      if (phrases) setTopPhrases((phrases as any[]).map((r: any) => ({ name: r.name, count: Number(r.count) })));
      if (daily) setDailyData((daily as any[]).map((r: any) => ({ date: String(r.day).slice(5), count: Number(r.count) })));
      if (dailySessions) setDailySessionData((dailySessions as any[]).map((r: any) => ({ date: String(r.day).slice(5), sessions: Number(r.sessions) })));

      setDataLoading(false);
    };
    loadEvents();
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated) return;
    supabase.from("site_config").select("value").eq("key", "livestream_url").single().then(({ data }: any) => {
      const val = data?.value || "";
      setLivestreamUrl(val);
      setLivestreamInput(val);
    });
  }, [authenticated]);

  const stats = useMemo(() => {
    const heroSearches = eventTypeCounts["hero_search"] || 0;
    const urlLookups = eventTypeCounts["url_lookup"] || 0;
    const referralClicks = eventTypeCounts["referral_click"] || 0;

    const byType = [
      { name: "Hero Search", value: heroSearches },
      { name: "URL Lookup", value: urlLookups },
      { name: "Referral Click", value: referralClicks },
    ].filter((d) => d.value > 0);

    return {
      totalEvents: totalEventCount,
      uniqueSessions: uniqueSessionCount,
      heroSearches,
      urlLookups,
      referralClicks,
      byType,
      topPeople,
      topPhrases,
      dailyData,
      dailySessionData,
    };
  }, [totalEventCount, uniqueSessionCount, eventTypeCounts, topPeople, topPhrases, dailyData, dailySessionData]);

  if (!authenticated) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <form onSubmit={handleLogin} className="border-2 border-border bg-card p-8 w-full max-w-sm">
          <h1 className="font-pixel text-sm text-primary mb-6 text-center">ADMIN ACCESS</h1>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="ENTER PASSWORD..."
            className="w-full border-2 border-border bg-muted px-3 py-2 font-mono text-xs uppercase tracking-wider placeholder:text-muted-foreground focus:outline-none focus:border-primary mb-4"
            autoFocus
          />
          {error && <p className="font-mono text-[10px] text-destructive mb-3">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full border-2 border-primary bg-primary px-4 py-2 font-pixel text-xs text-primary-foreground hover:bg-primary/80 disabled:opacity-50"
          >
            {loading ? "CHECKING..." : "ENTER"}
          </button>
        </form>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <span className="font-pixel text-sm text-primary animate-blink">LOADING ANALYTICS...</span>
      </div>
    );
  }

  const handleSaveLivestream = async () => {
    setConfigLoading(true);
    await supabase.functions.invoke("verify-admin", {
      body: { password: password || sessionStorage.getItem("admin_pwd") || "", action: "update_config", key: "livestream_url", value: livestreamInput.trim() || null },
    });
    setLivestreamUrl(livestreamInput.trim());
    setConfigLoading(false);
  };

  const handleClearLivestream = async () => {
    setConfigLoading(true);
    await supabase.functions.invoke("verify-admin", {
      body: { password: password || sessionStorage.getItem("admin_pwd") || "", action: "update_config", key: "livestream_url", value: null },
    });
    setLivestreamUrl("");
    setLivestreamInput("");
    setConfigLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-pixel text-sm text-primary sm:text-base">ANALYTICS DASHBOARD</h1>
        <button
          onClick={() => { setAuthenticated(false); sessionStorage.removeItem("admin_authed"); sessionStorage.removeItem("admin_pwd"); }}
          className="font-mono text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          LOGOUT
        </button>
      </div>

      {/* Livestream config */}
      <div className="border-2 border-border bg-card p-4 mb-8">
        <h2 className="font-pixel text-[10px] text-secondary mb-3">LIVESTREAM EMBED</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={livestreamInput}
            onChange={(e) => setLivestreamInput(e.target.value)}
            placeholder="YOUTUBE OR TWITCH URL..."
            className="flex-1 border-2 border-border bg-muted px-3 py-2 font-mono text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleSaveLivestream}
            disabled={configLoading}
            className="border-2 border-primary bg-primary px-4 py-2 font-pixel text-[10px] text-primary-foreground hover:bg-primary/80 disabled:opacity-50"
          >
            {configLoading ? "..." : "SAVE"}
          </button>
          {livestreamUrl && (
            <button
              onClick={handleClearLivestream}
              disabled={configLoading}
              className="border-2 border-destructive px-4 py-2 font-pixel text-[10px] text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              CLEAR
            </button>
          )}
        </div>
        {livestreamUrl && (
          <p className="font-mono text-[9px] text-muted-foreground mt-2">
            ACTIVE: {livestreamUrl}
          </p>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        {[
          { label: "TOTAL EVENTS", value: stats.totalEvents },
          { label: "UNIQUE SESSIONS", value: stats.uniqueSessions },
          { label: "HERO SEARCHES", value: stats.heroSearches },
          { label: "URL LOOKUPS", value: stats.urlLookups },
          { label: "REFERRAL CLICKS", value: stats.referralClicks },
        ].map((s) => (
          <div key={s.label} className="border-2 border-border bg-card p-4">
            <div className="font-pixel text-lg text-primary sm:text-2xl">{s.value}</div>
            <div className="font-mono text-[9px] text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Events over time */}
        <div className="border-2 border-border bg-card p-4">
          <h2 className="font-pixel text-[10px] text-secondary mb-4">EVENTS PER DAY</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.dailyData}>
              <XAxis dataKey="date" tick={{ fontSize: 9, fontFamily: "Space Mono" }} />
              <YAxis tick={{ fontSize: 9, fontFamily: "Space Mono" }} />
              <Tooltip contentStyle={{ fontFamily: "Space Mono", fontSize: 10 }} />
              <Line type="monotone" dataKey="count" stroke="hsl(240,100%,50%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Sessions over time */}
        <div className="border-2 border-border bg-card p-4">
          <h2 className="font-pixel text-[10px] text-secondary mb-4">SESSIONS PER DAY</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.dailySessionData}>
              <XAxis dataKey="date" tick={{ fontSize: 9, fontFamily: "Space Mono" }} />
              <YAxis tick={{ fontSize: 9, fontFamily: "Space Mono" }} />
              <Tooltip contentStyle={{ fontFamily: "Space Mono", fontSize: 10 }} />
              <Line type="monotone" dataKey="sessions" stroke="hsl(330,70%,55%)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Event type breakdown */}
        <div className="border-2 border-border bg-card p-4">
          <h2 className="font-pixel text-[10px] text-secondary mb-4">EVENT BREAKDOWN</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={stats.byType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={9} fontFamily="Space Mono">
                {stats.byType.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontFamily: "Space Mono", fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top people */}
        <div className="border-2 border-border bg-card p-4">
          <h2 className="font-pixel text-[10px] text-secondary mb-4">TOP SEARCHED PEOPLE</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.topPeople} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 9, fontFamily: "Space Mono" }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fontFamily: "Space Mono" }} width={120} />
              <Tooltip contentStyle={{ fontFamily: "Space Mono", fontSize: 10 }} />
              <Bar dataKey="count" fill="hsl(240,100%,50%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top phrases */}
      {stats.topPhrases.length > 0 && (
        <div className="border-2 border-border bg-card p-4 mb-8">
          <h2 className="font-pixel text-[10px] text-secondary mb-4">TOP SEARCHED PHRASES</h2>
          <ResponsiveContainer width="100%" height={Math.max(200, stats.topPhrases.length * 28)}>
            <BarChart data={stats.topPhrases} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 9, fontFamily: "Space Mono" }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fontFamily: "Space Mono" }} width={140} />
              <Tooltip contentStyle={{ fontFamily: "Space Mono", fontSize: 10 }} />
              <Bar dataKey="count" fill="hsl(330,70%,55%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent events log */}
      <div className="border-2 border-border bg-card p-4">
        <h2 className="font-pixel text-[10px] text-secondary mb-4">RECENT EVENTS</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left font-mono text-[9px] text-muted-foreground pb-2 pr-4">TIME</th>
                <th className="text-left font-mono text-[9px] text-muted-foreground pb-2 pr-4">TYPE</th>
                <th className="text-left font-mono text-[9px] text-muted-foreground pb-2 pr-4">DATA</th>
                <th className="text-left font-mono text-[9px] text-muted-foreground pb-2">SESSION</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.map((e) => (
                <tr key={e.id} className="border-b border-border/50">
                  <td className="font-mono text-[10px] text-foreground py-1.5 pr-4 whitespace-nowrap">
                    {new Date(e.created_at).toLocaleString()}
                  </td>
                  <td className="pr-4">
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 ${
                      e.event_type === "hero_search" ? "bg-primary/10 text-primary" :
                      e.event_type === "url_lookup" ? "bg-secondary/10 text-secondary" :
                      "bg-mentioned/10 text-mentioned"
                    }`}>
                      {e.event_type.toUpperCase()}
                    </span>
                  </td>
                  <td className="font-mono text-[10px] text-muted-foreground py-1.5 pr-4 max-w-[300px] truncate">
                    {JSON.stringify(e.event_data)}
                  </td>
                  <td className="font-mono text-[10px] text-muted-foreground py-1.5 max-w-[100px] truncate">
                    {e.session_id?.slice(0, 8)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
