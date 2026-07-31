// ---------- calendar / events ----------
// Events live on the backend. Only the main head can create one.
// An event whose date has already passed is invalid and stays out of
// the upcoming list.

let allEvents = [];

// The backend may answer with a bare array or wrap it like the other
// endpoints do, so accept either shape.
function readEvents(out) {
  if (Array.isArray(out)) return out;
  if (Array.isArray(out.events)) return out.events;
  if (out.data) {
    if (Array.isArray(out.data)) return out.data;
    if (Array.isArray(out.data.events)) return out.data.events;
  }
  return [];
}

// Midnight, local time, on the event's date. Null when the date is unusable.
function eventDay(e) {
  const parts = String(e.eventDate || "").split("-");
  if (parts.length !== 3) return null;

  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return isNaN(d.getTime()) ? null : d;
}

// An event stays valid until the end of its own day, so a gram sabha
// at 9am is still listed that afternoon.
function isExpired(e) {
  const day = eventDay(e);
  if (!day) return true;

  const endOfDay = new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    23,
    59,
    59,
    999,
  );
  return endOfDay.getTime() < Date.now();
}

function formatEventDate(e) {
  const day = eventDay(e);
  if (!day) return "";

  const opts = { weekday: "short", day: "numeric", month: "short" };
  if (day.getFullYear() !== new Date().getFullYear()) opts.year = "numeric";
  return day.toLocaleDateString([], opts);
}

function formatEventTime(e) {
  const raw = String(e.eventTime || "");
  if (!/^\d{1,2}:\d{2}$/.test(raw)) return "";

  const bits = raw.split(":");
  const d = new Date(2000, 0, 1, Number(bits[0]), Number(bits[1]));
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function daysAway(e) {
  const day = eventDay(e);
  if (!day) return "";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((day - today) / 86400000);

  if (diff <= 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff < 7) return "in " + diff + " days";
  if (diff < 14) return "next week";
  return "in " + Math.round(diff / 7) + " weeks";
}

async function loadEvents() {
  const me = session.load();
  const box = $("#events-upcoming");
  const pastNote = $("#events-past-note");

  box.innerHTML = '<div class="empty">Loading…</div>';

  try {
    const out = await api.post("/fetch_all_events", {
      villageId: me.villageId,
      username: me.username,
    });
    allEvents = readEvents(out);
  } catch (e) {
    // Some routes answer with an error when the village has no data yet,
    // so treat that as empty rather than a real failure.
    allEvents = [];
  }

  const upcoming = allEvents.filter(function (e) {
    return !isExpired(e);
  });
  const expiredCount = allEvents.length - upcoming.length;

  upcoming.sort(function (a, b) {
    const da = eventDay(a);
    const db = eventDay(b);
    if (!da || !db) return 0;
    if (da - db !== 0) return da - db;
    return String(a.eventTime || "").localeCompare(String(b.eventTime || ""));
  });

  drawEvents("#events-upcoming", upcoming);

  if (expiredCount > 0) {
    pastNote.textContent =
      expiredCount === 1
        ? "1 past event is no longer shown."
        : expiredCount + " past events are no longer shown.";
    show(pastNote);
  } else {
    hide(pastNote);
  }
}

function drawEvents(selector, events) {
  const box = $(selector);

  if (!events.length) {
    box.innerHTML =
      '<div class="empty">Nothing scheduled yet. Sowing dates, panchayat ' +
      "meetings and mandi days will show up here.</div>";
    return;
  }

  box.innerHTML = events
    .map(function (e) {
      const when = [formatEventDate(e), formatEventTime(e), e.eventPlace]
        .filter(function (part) {
          return part;
        })
        .map(escapeHTML)
        .join(" · ");

      const who = e.displayName || e.createdBy || "The sarpanch";

      return (
        '<article class="post post-master">' +
        '<h3 class="post-title">' +
        escapeHTML(e.eventTitle || "Untitled event") +
        "</h3>" +
        '<div class="post-meta">' +
        when +
        "</div>" +
        (e.eventDetails
          ? '<p class="post-body">' + escapeHTML(e.eventDetails) + "</p>"
          : "") +
        '<div class="tags">' +
        '<span class="tag">' +
        escapeHTML(daysAway(e)) +
        "</span>" +
        '<span class="tag">' +
        escapeHTML(who) +
        "</span>" +
        "</div>" +
        "</article>"
      );
    })
    .join("");
}

// ---------- creating an event ----------
$("#composer-event").addEventListener("submit", async function (event) {
  event.preventDefault();

  const me = session.load();
  const form = $("#composer-event");
  const msg = $("#event-msg");
  const button = form.querySelector('button[type="submit"]');

  const title = form.querySelector('[data-field="title"]');
  const date = form.querySelector('[data-field="date"]');
  const time = form.querySelector('[data-field="time"]');
  const place = form.querySelector('[data-field="place"]');
  const details = form.querySelector('[data-field="details"]');

  if (!me.mainHead) {
    setMessage(msg, "Only the sarpanch can add an event.");
    return;
  }
  if (!title.value.trim()) {
    setMessage(msg, "Give the event a name.");
    title.focus();
    return;
  }
  if (!date.value) {
    setMessage(msg, "Pick a date.");
    date.focus();
    return;
  }
  if (isExpired({ eventDate: date.value, eventTime: time.value })) {
    setMessage(msg, "That date has already passed. Pick a later one.");
    date.focus();
    return;
  }

  // One sortable timestamp for the backend. An event with no time is
  // pinned to the end of its day so it does not expire at midnight.
  const at = new Date(date.value + "T" + (time.value || "23:59"));

  const originalLabel = button.dataset.label || button.textContent;
  button.dataset.label = originalLabel;
  button.disabled = true;
  button.textContent = "Creating…";
  setMessage(msg, "");

  try {
    await api.post("/create_event", {
      villageId: me.villageId,
      username: me.username,
      eventTitle: title.value.trim(),
      eventDate: date.value,
      eventTime: time.value || "",
      eventPlace: place.value.trim(),
      eventDetails: details.value.trim(),
      eventAt: isNaN(at.getTime()) ? null : at.toISOString(),
    });

    title.value = "";
    date.value = "";
    time.value = "";
    place.value = "";
    details.value = "";

    setMessage(msg, "Event added to the calendar.", true);
    await loadEvents();
  } catch (e) {
    setMessage(msg, e.message);
  }

  button.disabled = false;
  button.textContent = originalLabel;
});