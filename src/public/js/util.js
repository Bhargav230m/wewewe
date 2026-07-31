function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function escapeHTML(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function show(el) {
  el.classList.remove("hidden");
}

function hide(el) {
  el.classList.add("hidden");
}

function setMessage(el, text, good) {
  el.textContent = text || "";
  el.classList.toggle("good", Boolean(good));
}

function shortTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function splitTags(value) {
  return String(value || "")
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}
