/* SynapseOS Team Analytics dashboard (served by the backend at /analytics).
   Vanilla JS + Chart.js (vendored). All user-provided text is inserted via textContent. */
(function () {
  "use strict";

  var API = "/api";
  var TOKEN_KEY = "synapseos_analytics_token";
  var $ = function (id) { return document.getElementById(id); };
  var state = { project: null, range: "30", data: null, charts: [] };

  // Categorical palette, fixed order (validated light/dark sets). Colour follows the person, not the rank.
  var PAL_DARK = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"];
  var PAL_LIGHT = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"];
  var isDark = function () { return !window.matchMedia("(prefers-color-scheme: light)").matches; };
  var palette = function () { return isDark() ? PAL_DARK : PAL_LIGHT; };
  var css = function (name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); };

  // ---------- helpers ----------
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }
  function initials(name) {
    var p = String(name || "?").trim().split(/\s+/);
    return ((p[0] || "?")[0] + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase();
  }
  function fmtDate(iso) {
    var d = new Date(iso + "T00:00:00Z");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
  }
  function colorMap(members) {
    var pal = palette(), map = {};
    members.slice().sort(function (a, b) { return a.userId < b.userId ? -1 : 1; })
      .forEach(function (m, i) { map[m.userId] = i < pal.length ? pal[i] : css("--muted"); });
    return map;
  }

  // ---------- API ----------
  function api(path, opts) {
    opts = opts || {};
    var headers = { "Content-Type": "application/json" };
    var t = sessionStorage.getItem(TOKEN_KEY);
    if (t) headers.Authorization = "Bearer " + t;
    return fetch(API + path, { method: opts.method || "GET", headers: headers, body: opts.body })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (r.status === 401 && !opts.noAuthRedirect) { showLogin(); throw new Error("auth"); }
          if (!r.ok || j.success === false) throw new Error(j.message || "Request failed");
          return j.data;
        });
      });
  }

  // ---------- login ----------
  function showLogin() {
    sessionStorage.removeItem(TOKEN_KEY);
    $("app").classList.add("hidden");
    $("login").classList.remove("hidden");
  }
  $("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    $("loginError").textContent = "";
    api("/auth/login", {
      method: "POST", noAuthRedirect: true,
      body: JSON.stringify({ email: $("email").value, password: $("password").value })
    }).then(function (d) {
      sessionStorage.setItem(TOKEN_KEY, d.token);
      boot();
    }).catch(function (err) { $("loginError").textContent = err.message; });
  });
  $("logout").addEventListener("click", showLogin);

  // ---------- boot ----------
  function boot() {
    if (!sessionStorage.getItem(TOKEN_KEY)) return showLogin();
    api("/projects").then(function (d) {
      var projects = d.projects || [];
      $("login").classList.add("hidden");
      $("app").classList.remove("hidden");
      var sel = $("project");
      sel.textContent = "";
      projects.forEach(function (p) {
        var o = el("option", null, p.name); o.value = p._id; sel.appendChild(o);
      });
      if (!projects.length) {
        $("projectName").textContent = "No projects yet";
        $("kpis").textContent = "";
        return;
      }
      var wanted = new URLSearchParams(location.search).get("project");
      state.project = projects.some(function (p) { return p._id === wanted; }) ? wanted : projects[0]._id;
      sel.value = state.project;
      load();
    }).catch(function (e) { if (e.message !== "auth") alert(e.message); });
  }

  $("project").addEventListener("change", function (e) { state.project = e.target.value; load(); });
  $("range").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    state.range = b.dataset.range;
    Array.prototype.forEach.call($("range").children, function (x) { x.classList.toggle("on", x === b); });
    load();
  });

  function load() {
    $("updated").textContent = "Loading…";
    api("/projects/" + state.project + "/analytics?range=" + state.range).then(function (d) {
      state.data = d.analytics;
      render(state.data);
    }).catch(function (e) { if (e.message !== "auth") $("updated").textContent = e.message; });
  }

  // ---------- render ----------
  function render(a) {
    state.charts.forEach(function (c) { c.destroy(); });
    state.charts = [];

    var colors = colorMap(a.members);
    var s = a.summary;
    $("projectName").textContent = a.project.name;
    $("updated").textContent = "Updated " + new Date(a.range.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    $("subtitle").textContent = a.range.days ? "Last " + a.range.days + " days" : "Whole project history";

    // notices
    var notes = [];
    if (!s.totalTasks && !s.documents && !s.meetings) notes.push("No activity in this date range yet.");
    if (a.unassigned && a.unassigned.tasks.total) notes.push(a.unassigned.tasks.total + " task(s) have no assignee and are not credited to anyone.");
    if (a.github && a.github.contributors === null) notes.push("GitHub contributor data is unavailable right now (rate limit or network).");
    $("notice").classList.toggle("hidden", !notes.length);
    $("notice").textContent = notes.join(" ");

    kpis(a);
    Chart.defaults.font.family = "Inter, system-ui, sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = css("--text-2");
    Chart.defaults.borderColor = css("--grid");

    shareChart(a, colors);
    board(a, colors);
    tasksChart(a, colors);
    timeChart(a);
    radarChart(a, colors);
    prioChart(a, colors);
    docsChart(a);
    githubChart(a);
    weights(a);
  }

  function kpis(a) {
    var s = a.summary, box = $("kpis"); box.textContent = "";
    var tiles = [
      ["Tasks", s.totalTasks, s.completedTasks + " completed"],
      ["Completion rate", s.completionRate + "%", "of all tasks"],
      ["Overdue", s.overdueTasks, s.overdueTasks ? "need attention" : "all on track", s.overdueTasks ? "bad" : ""],
      ["On-time delivery", s.onTimeRate + "%", "of tasks with a due date"],
      ["Active contributors", s.activeContributors, "of " + s.totalMembers + " members"],
      ["Docs & meetings", s.documents + s.meetings, s.documents + " docs · " + s.meetings + " meetings"]
    ];
    tiles.forEach(function (t) {
      var k = el("div", "kpi");
      k.appendChild(el("div", "label", t[0]));
      k.appendChild(el("div", "value" + (t[3] ? " " + t[3] : ""), t[1]));
      k.appendChild(el("div", "sub", t[2]));
      box.appendChild(k);
    });
  }

  function emptyChart(canvasId, msg) {
    var c = $(canvasId), box = c.parentNode;
    c.style.display = "none";
    var old = box.querySelector(".empty"); if (old) old.remove();
    box.appendChild(el("div", "empty", msg));
    return null;
  }
  function useCanvas(id) {
    var c = $(id); c.style.display = "";
    var old = c.parentNode.querySelector(".empty"); if (old) old.remove();
    return c;
  }
  function track(chart) { state.charts.push(chart); return chart; }

  var surface = function () { return css("--surface"); };
  var tipStyle = function () {
    return { backgroundColor: css("--surface-2"), titleColor: css("--text"), bodyColor: css("--text-2"),
      borderColor: css("--line"), borderWidth: 1, padding: 10, cornerRadius: 10, boxPadding: 4 };
  };
  var legendOpts = function () {
    return { position: "bottom", labels: { usePointStyle: true, pointStyle: "rectRounded", boxWidth: 8, boxHeight: 8, color: css("--text-2"), padding: 14 } };
  };

  // --- Contribution share (doughnut) ---
  function shareChart(a, colors) {
    var people = a.members.filter(function (m) { return m.score > 0; });
    var legend = $("legendShare"); legend.textContent = "";
    $("donutCenter").textContent = "";
    if (!people.length) { emptyChart("cShare", "No contributions yet"); return; }
    var c = useCanvas("cShare");
    track(new Chart(c, {
      type: "doughnut",
      data: {
        labels: people.map(function (m) { return m.name; }),
        datasets: [{
          data: people.map(function (m) { return m.score; }),
          backgroundColor: people.map(function (m) { return colors[m.userId]; }),
          borderColor: surface(), borderWidth: 3, hoverOffset: 6
        }]
      },
      options: {
        maintainAspectRatio: false, cutout: "68%",
        plugins: { legend: { display: false }, tooltip: Object.assign(tipStyle(), { callbacks: {
          label: function (ctx) { var m = people[ctx.dataIndex]; return " " + m.score + " pts · " + m.sharePercent + "%"; }
        } }) }
      }
    }));
    var dc = $("donutCenter");
    dc.appendChild(el("b", null, a.summary.totalScore));
    dc.appendChild(el("span", null, "total points"));
    people.forEach(function (m) {
      var sp = el("span"); var d = el("i", "dot"); d.style.background = colors[m.userId];
      sp.appendChild(d); sp.appendChild(document.createTextNode(m.name + " · " + m.sharePercent + "%"));
      legend.appendChild(sp);
    });
  }

  // --- Leaderboard ---
  var SEG = function () { var p = palette(); return { tasks: p[0], documents: p[3], meetings: p[6] }; };
  function board(a, colors) {
    var t = $("board"); t.textContent = "";
    if (!a.members.length) { t.appendChild(el("caption", "empty", "No members")); return; }
    var head = el("tr");
    ["#", "Member", "Score", "Share", "Tasks done", "On-time", "Docs", "Meetings"].forEach(function (h) { head.appendChild(el("th", null, h)); });
    var thead = el("thead"); thead.appendChild(head); t.appendChild(thead);
    var max = Math.max.apply(null, a.members.map(function (m) { return m.score; }).concat([1]));
    var seg = SEG(), tb = el("tbody");

    a.members.forEach(function (m) {
      var tr = el("tr");
      var rk = el("td"); rk.appendChild(el("span", "rank" + (m.rank === 1 && m.score > 0 ? " r1" : ""), m.rank)); tr.appendChild(rk);

      var who = el("td"), p = el("div", "person");
      var av = el("div", "avatar", initials(m.name)); av.style.background = colors[m.userId];
      var nm = el("div"); nm.appendChild(document.createTextNode(m.name));
      nm.appendChild(el("small", null, m.projectRole === "owner" ? "Owner" : m.projectRole === "former" ? "Former member" : "Member"));
      p.appendChild(av); p.appendChild(nm); who.appendChild(p); tr.appendChild(who);

      var sc = el("td"), bar = el("div", "scorebar"), track = el("div", "track");
      track.title = "Tasks " + m.scoreBreakdown.tasks + " · Docs " + m.scoreBreakdown.documents + " · Meetings " + m.scoreBreakdown.meetings;
      ["tasks", "documents", "meetings"].forEach(function (k) {
        var i = el("i"); i.style.width = (m.scoreBreakdown[k] / max * 100) + "%"; i.style.background = seg[k]; track.appendChild(i);
      });
      bar.appendChild(track); bar.appendChild(el("b", null, m.score)); sc.appendChild(bar); tr.appendChild(sc);

      tr.appendChild(el("td", null, m.sharePercent + "%"));
      tr.appendChild(el("td", null, m.tasks.completed + " / " + m.tasks.total));
      var ot = el("td");
      if (m.tasks.completedWithDueDate) ot.appendChild(el("span", "pill " + (m.onTimeRate >= 80 ? "good" : m.onTimeRate < 50 ? "bad" : ""), m.onTimeRate + "%"));
      else ot.textContent = "—";
      tr.appendChild(ot);
      tr.appendChild(el("td", null, m.documents.created + m.documents.edited));
      tr.appendChild(el("td", null, m.meetings.organized + m.meetings.attended));
      tb.appendChild(tr);
    });
    t.appendChild(tb);

    var cap = el("caption"); cap.style.cssText = "caption-side:bottom;text-align:left;padding-top:10px";
    [["Tasks", seg.tasks], ["Documents", seg.documents], ["Meetings", seg.meetings]].forEach(function (x) {
      var sp = el("span", "small muted"); sp.style.marginRight = "14px";
      var d = el("i", "dot"); d.style.background = x[1]; d.style.marginRight = "6px";
      sp.appendChild(d); sp.appendChild(document.createTextNode(x[0])); cap.appendChild(sp);
    });
    t.appendChild(cap);
  }

  var names = function (a) { return a.members.map(function (m) { return m.name; }); };
  var barBase = function () {
    return { borderColor: surface(), borderWidth: 2, borderRadius: 4, borderSkipped: false };
  };

  // --- Tasks per member (stacked horizontal) ---
  function tasksChart(a) {
    var ms = a.members.filter(function (m) { return m.tasks.total > 0; });
    if (!ms.length) return emptyChart("cTasks", "No assigned tasks in this range");
    var c = useCanvas("cTasks"), p = palette();
    var ds = [["Completed", "completed", css("--good")], ["In progress", "inProgress", p[0]], ["To do", "todo", css("--muted")]];
    track(new Chart(c, {
      type: "bar",
      data: { labels: ms.map(function (m) { return m.name; }), datasets: ds.map(function (d) {
        return Object.assign({ label: d[0], data: ms.map(function (m) { return m.tasks[d[1]]; }), backgroundColor: d[2], maxBarThickness: 22 }, barBase());
      }) },
      options: { indexAxis: "y", maintainAspectRatio: false,
        scales: { x: { stacked: true, beginAtZero: true, ticks: { precision: 0 }, grid: { color: css("--grid") } }, y: { stacked: true, grid: { display: false } } },
        plugins: { legend: legendOpts(), tooltip: Object.assign(tipStyle(), { mode: "index", intersect: false }) } }
    }));
  }

  // --- Timeline ---
  function timeChart(a) {
    var tl = a.timeline;
    if (!tl.length) return emptyChart("cTime", "No data");
    var c = useCanvas("cTime"), p = palette();
    var line = function (label, key, color) {
      return { label: label, data: tl.map(function (r) { return r[key]; }), borderColor: color, backgroundColor: color,
        borderWidth: 2, cubicInterpolationMode: "monotone", pointRadius: 0, pointHoverRadius: 5, pointHoverBorderWidth: 2, pointHoverBorderColor: surface() };
    };
    track(new Chart(c, {
      type: "line",
      data: { labels: tl.map(function (r) { return fmtDate(r.date); }), datasets: [
        line("Tasks created", "tasksCreated", p[0]), line("Tasks completed", "tasksCompleted", css("--good")),
        line("Documents", "documents", p[3]), line("Meetings", "meetings", p[6]) ] },
      options: { maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
        scales: { x: { ticks: { maxTicksLimit: 8, maxRotation: 0 }, grid: { display: false } },
                  y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: css("--grid") } } },
        plugins: { legend: legendOpts(), tooltip: tipStyle() } }
    }));
  }

  // --- Radar ---
  function radarChart(a, colors) {
    var top = a.members.filter(function (m) { return m.score > 0; }).slice(0, 5);
    if (top.length < 1) return emptyChart("cRadar", "Not enough data");
    var c = useCanvas("cRadar");
    var axes = [
      ["Tasks done", function (m) { return m.tasks.completed; }, true],
      ["High priority", function (m) { return m.tasks.completedByPriority.high; }, true],
      ["Docs", function (m) { return m.documents.created + m.documents.edited; }, true],
      ["Meetings", function (m) { return m.meetings.organized + m.meetings.attended; }, true],
      ["On-time %", function (m) { return m.onTimeRate; }, false],
      ["Completion %", function (m) { return m.completionRate; }, false]
    ];
    var maxes = axes.map(function (ax) { return ax[2] ? Math.max.apply(null, top.map(ax[1]).concat([1])) : 100; });
    track(new Chart(c, {
      type: "radar",
      data: { labels: axes.map(function (x) { return x[0]; }), datasets: top.map(function (m) {
        var col = colors[m.userId];
        return { label: m.name, data: axes.map(function (ax, i) { return Math.round(ax[1](m) / maxes[i] * 100); }),
          borderColor: col, backgroundColor: col + "33", borderWidth: 2, pointRadius: 2, pointBackgroundColor: col };
      }) },
      options: { maintainAspectRatio: false,
        scales: { r: { min: 0, max: 100, ticks: { display: false, stepSize: 25 }, grid: { color: css("--grid") }, angleLines: { color: css("--grid") }, pointLabels: { font: { size: 11 } } } },
        plugins: { legend: legendOpts(), tooltip: tipStyle() } }
    }));
  }

  // --- Completed by priority ---
  function prioChart(a) {
    var ms = a.members.filter(function (m) { return m.tasks.completed > 0; });
    if (!ms.length) return emptyChart("cPrio", "No completed tasks yet");
    var c = useCanvas("cPrio");
    var ramp = [["Low", "low", "#184f95"], ["Medium", "medium", "#2a78d6"], ["High", "high", "#86b6ef"]];
    track(new Chart(c, {
      type: "bar",
      data: { labels: ms.map(function (m) { return m.name; }), datasets: ramp.map(function (r) {
        return Object.assign({ label: r[0], data: ms.map(function (m) { return m.tasks.completedByPriority[r[1]]; }), backgroundColor: r[2], maxBarThickness: 36 }, barBase());
      }) },
      options: { maintainAspectRatio: false,
        scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 }, grid: { color: css("--grid") } } },
        plugins: { legend: legendOpts(), tooltip: Object.assign(tipStyle(), { mode: "index", intersect: false }) } }
    }));
  }

  // --- Docs & meetings ---
  function docsChart(a) {
    var ms = a.members.filter(function (m) { return m.documents.created + m.documents.edited + m.meetings.organized + m.meetings.attended > 0; });
    if (!ms.length) return emptyChart("cDocs", "No documents or meetings yet");
    var c = useCanvas("cDocs"), p = palette();
    var ds = [["Docs created", function (m) { return m.documents.created; }, p[3]], ["Docs edited", function (m) { return m.documents.edited; }, p[6]],
              ["Meetings organised", function (m) { return m.meetings.organized; }, p[2]], ["Meetings attended", function (m) { return m.meetings.attended; }, p[0]]];
    track(new Chart(c, {
      type: "bar",
      data: { labels: ms.map(function (m) { return m.name; }), datasets: ds.map(function (d) {
        return Object.assign({ label: d[0], data: ms.map(d[1]), backgroundColor: d[2], maxBarThickness: 14 }, barBase());
      }) },
      options: { maintainAspectRatio: false,
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: css("--grid") } } },
        plugins: { legend: legendOpts(), tooltip: Object.assign(tipStyle(), { mode: "index", intersect: false }) } }
    }));
  }

  // --- GitHub ---
  function githubChart(a) {
    var card = $("githubCard"), g = a.github;
    if (!g || !g.contributors || !g.contributors.length) { card.classList.add("hidden"); return; }
    card.classList.remove("hidden");
    $("githubSub").textContent = g.repository + " · all-time commits (GitHub usernames, not matched to SynapseOS users)";
    var c = useCanvas("cGit");
    track(new Chart(c, {
      type: "bar",
      data: { labels: g.contributors.map(function (x) { return x.login; }), datasets: [Object.assign({
        label: "Commits", data: g.contributors.map(function (x) { return x.commits; }), backgroundColor: palette()[0], maxBarThickness: 22 }, barBase())] },
      options: { indexAxis: "y", maintainAspectRatio: false,
        scales: { x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: css("--grid") } }, y: { grid: { display: false } } },
        plugins: { legend: { display: false }, tooltip: tipStyle() } }
    }));
  }

  function weights(a) {
    var w = a.scoring, box = $("weights"); box.textContent = "";
    [["Task completed", w.taskCompleted.low + " / " + w.taskCompleted.medium + " / " + w.taskCompleted.high, "low / medium / high priority"],
     ["Task in progress", w.taskInProgress, "per task"], ["Document created", w.documentCreated, "per document"],
     ["Document edited", w.documentEdited, "last editor, if not the author"], ["Meeting organised", w.meetingOrganized, "per meeting"],
     ["Meeting attended", w.meetingAttended, "as participant"]].forEach(function (x) {
      var d = el("div"); d.appendChild(el("span", null, x[0])); d.appendChild(el("b", null, x[1])); d.appendChild(el("span", null, x[2])); box.appendChild(d);
    });
  }

  // ---------- CSV export ----------
  $("exportCsv").addEventListener("click", function () {
    if (!state.data) return;
    var rows = [["Rank", "Member", "Email", "Score", "Share %", "Tasks total", "Completed", "In progress", "To do", "Overdue", "Completion %", "On-time %", "Docs created", "Docs edited", "Meetings organised", "Meetings attended"]];
    state.data.members.forEach(function (m) {
      rows.push([m.rank, m.name, m.email, m.score, m.sharePercent, m.tasks.total, m.tasks.completed, m.tasks.inProgress, m.tasks.todo, m.tasks.overdue, m.completionRate, m.onTimeRate, m.documents.created, m.documents.edited, m.meetings.organized, m.meetings.attended]);
    });
    var csv = rows.map(function (r) {
      return r.map(function (v) {
        v = String(v == null ? "" : v);
        if (/^[=+\-@]/.test(v)) v = "'" + v; // neutralise spreadsheet formulas
        return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
      }).join(",");
    }).join("\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "analytics-" + state.data.project.name.replace(/[^\w-]+/g, "_") + ".csv";
    a.click(); URL.revokeObjectURL(a.href);
  });

  window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", function () { if (state.data) render(state.data); });
  boot();
})();
