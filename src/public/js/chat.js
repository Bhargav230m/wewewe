let chatTimer = null;
let lastCount = 0;

async function loadChat() {
  const me = session.load();
  const log = $("#chat-log");
  let messages = [];

  try {
    const out = await api.post("/fetch_messages", { villageId: me.villageId });
    messages = (out.data && out.data.messages) || [];
  } catch (e) {
    messages = [];
  }

  if (!messages.length) {
    log.innerHTML =
      '<div class="empty">The chaupal is quiet. Say the first word.</div>';
    lastCount = 0;
    return;
  }

  log.innerHTML = messages
    .map(function (m) {
      return (
        '<div class="line">' +
        '<span class="line-who">' +
        escapeHTML(m.displayName || m.username || "Someone") +
        "</span>" +
        escapeHTML(m.message || "") +
        '<span class="line-time">' +
        shortTime(m.createdAt) +
        "</span>" +
        "</div>"
      );
    })
    .join("");

  // Only jump to the bottom when something new arrived, so reading
  // older messages isn't interrupted by the refresh.
  if (messages.length !== lastCount) {
    log.scrollTop = log.scrollHeight;
    lastCount = messages.length;
  }
}

$("#chat-form").addEventListener("submit", async function (event) {
  event.preventDefault();

  const me = session.load();
  const input = $("#chat-input");
  const text = input.value.trim();
  if (!text) return;

  input.value = "";

  try {
    await api.post("/send_message", {
      villageId: me.villageId,
      username: me.username,
      message: text,
    });
    await loadChat();
  } catch (e) {
    input.value = text; // give it back so nothing is lost
    input.placeholder = e.message;
  }
});

// Poll while the chat panel is open, stop when it isn't.
function startChatPolling() {
  stopChatPolling();
  chatTimer = setInterval(loadChat, 4000);
}

function stopChatPolling() {
  if (chatTimer) clearInterval(chatTimer);
  chatTimer = null;
}
