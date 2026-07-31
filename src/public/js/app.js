const me = session.requireOrRedirect();

if (me) {
  $("#top-village-name").textContent = me.villageName || "Village";
  $("#top-village-id").textContent = me.villageId || "The digital chaupal"
  $("#top-village-add").textContent = me.villageAddress || "Welcome"
  $("#top-me").textContent = me.displayName || me.username;

  $("#logout").addEventListener("click", function () {
    stopChatPolling();
    session.clear();
    window.location.href = "/index.html";
  });

  const acctBtn = $("#account-btn");
  const acctMenu = $("#account-menu");

  function setAcctOpen(open) {
    acctMenu.classList.toggle("hidden", !open);
    acctBtn.classList.toggle("open", open);
    acctBtn.setAttribute("aria-expanded", String(open));
  }

  acctBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    setAcctOpen(acctMenu.classList.contains("hidden"));
  });

  document.addEventListener("click", function (e) {
    if (!acctMenu.contains(e.target) && !acctBtn.contains(e.target)) {
      setAcctOpen(false);
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setAcctOpen(false);
  });

  const isHead = me.mainHead;

  if (isHead) {
    show($("#nav-invites"));
    show($("#composer-master"));
    show($("#composer-event"));
    show($("#revoke-member"));
  }

  function openPanel(name) {
    $all(".panel").forEach(function (p) {
      p.classList.toggle("hidden", p.id !== "panel-" + name);
    });
    $all(".nav-item").forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.panel === name);
    });

    if (name === "chat") {
      loadChat();
      startChatPolling();
    } else {
      stopChatPolling();
    }

    if (name === "masterposts" || name === "generalposts") loadPosts();
    if (name === "invites") loadInvites();
    if (name === "calendar") loadEvents();
  }

  // Wired once, at startup - not inside openPanel.
  $all(".nav-item").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openPanel(btn.dataset.panel);
    });
  });

  $all("[data-refresh='posts']").forEach(function (btn) {
    btn.addEventListener("click", loadPosts);
  });

  $all("[data-refresh='events']").forEach(function (btn) {
    btn.addEventListener("click", loadEvents);
  });

  loadMembers();
  openPanel("masterposts");
}