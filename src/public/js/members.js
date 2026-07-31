let allMembers = [];

async function loadMembers() {
  const me = session.load();

  console.log(me.villageId)
  try {
    const out = await api.post("/fetch_users", { villageId: me.villageId });
    allMembers = (out.data && out.data.members) || [];
  } catch (e) {
    allMembers = [];
  }

  drawGroup("#list-mainhead", allMembers.filter((m) => m.isMainHead));
  drawGroup(
    "#list-members",
    allMembers.filter((m) => !m.isMainHead && !m.isSecondaryHead),
  );
}

function drawGroup(selector, people) {
  const list = $(selector);

  if (!people.length) {
    list.innerHTML = '<li class="side-empty">Nobody yet</li>';
    return;
  }

  list.innerHTML = people
    .map(function (m) {
      return (
        '<li><button class="person" data-username="' +
        escapeHTML(m.username) +
        '"><span class="dot"></span>' +
        escapeHTML(m.displayName || m.username) +
        "</button></li>"
      );
    })
    .join("");

  list.querySelectorAll(".person").forEach(function (btn) {
    btn.addEventListener("click", function (event) {
      event.stopPropagation();
      openPopup(btn.dataset.username, btn);
    });
  });
}

function openPopup(username, anchor) {
  const popup = $("#user-popup");
  const me = session.load();
  const person = allMembers.find((m) => m.username === username);
  if (!person) return;

  let role = "Member";
  if (person.isMainHead) role = "Main head";

  // A main head can kick anyone but themselves.
  // A secondary head can only kick plain members.
  const isMe = person.username === me.username;
  let canKick = false;
  if (!isMe && me.mainHead) canKick = true;
  if (!isMe && !person.isMainHead)
    canKick = true;

  popup.innerHTML =
    '<div class="popup-name">' +
    escapeHTML(person.displayName || person.username) +
    "</div>" +
    '<div class="popup-username">@' +
    escapeHTML(person.username) +
    "</div>" +
    '<span class="popup-role">' +
    role +
    "</span>" +
    (canKick
      ? '<button class="btn btn-small btn-danger" id="popup-kick">Remove from village</button>'
      : "");

  const box = anchor.getBoundingClientRect();
  popup.style.top = window.scrollY + box.top + "px";
  popup.style.left = box.right + 10 + "px";
  show(popup);

  const kick = $("#popup-kick");
  if (kick) {
    kick.addEventListener("click", async function () {
      kick.disabled = true;
      kick.textContent = "Removing…";
      try {
        await api.post("/kick_user", {
          villageId: me.villageId,
          username: me.username, // who is doing the kicking
          target: person.username, // who is being kicked
        });
        hide(popup);
        loadMembers();
      } catch (e) {
        kick.disabled = false;
        kick.textContent = e.message;
      }
    });
  }
}

// Click anywhere else to close it.
document.addEventListener("click", function () {
  hide($("#user-popup"));
});
