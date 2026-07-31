async function loadPosts() {
  const me = session.load();
  let posts = [];

  try {
    const out = await api.post("/fetch_posts", { villageCode: me.villageId });
    posts = (out.data && out.data.posts) || [];
  } catch (e) {
    // The backend answers with an error when the village has no data
    // yet, so treat that as empty rather than a real failure.
    posts = [];
  }

  posts = posts.slice().reverse();

  drawPosts(
    "#posts-master",
    posts.filter((p) => p.type === "master_post"),
    "No announcements yet.",
    true,
  );
  drawPosts(
    "#posts-general",
    posts.filter((p) => p.type !== "master_post"),
    "Nothing raised yet. Start the first one.",
    false,
  );
}

function drawPosts(selector, posts, emptyText, isMaster) {
  const box = $(selector);

  if (!posts.length) {
    box.innerHTML = '<div class="empty">' + emptyText + "</div>";
    return;
  }

  box.innerHTML = posts
    .map(function (p) {
      const tags = (p.postTags || [])
        .map((t) => '<span class="tag">' + escapeHTML(t) + "</span>")
        .join("");

      const who = p.displayName || p.author || "Someone";
      const when = shortTime(p.createdAt);

      return (
        '<article class="post' +
        (isMaster ? " post-master" : "") +
        '">' +
        '<h3 class="post-title">' +
        escapeHTML(p.postTitle || "Untitled") +
        "</h3>" +
        '<div class="post-meta">' +
        escapeHTML(who) +
        (when ? " · " + when : "") +
        "</div>" +
        '<p class="post-body">' +
        escapeHTML(p.postBody || "") +
        "</p>" +
        (tags ? '<div class="tags">' + tags + "</div>" : "") +
        "</article>"
      );
    })
    .join("");
}

// ---------- writing a post ----------
function wireComposer(formSelector, endpoint) {
  const form = $(formSelector);

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const me = session.load();
    const title = form.querySelector('[data-field="title"]');
    const body = form.querySelector('[data-field="body"]');
    const tags = form.querySelector('[data-field="tags"]');
    const button = form.querySelector("button");

    if (!title.value.trim() || !body.value.trim()) {
      //button.textContent = "Title and body are both needed";
      return;
    }

    const originalLabel = button.dataset.label || button.textContent;
    button.dataset.label = originalLabel;
    button.disabled = true;
    button.textContent = "Posting…";

    try {
      await api.post(endpoint, {
        villageId: me.villageId,
        username: me.username,
        postTitle: title.value.trim(),
        postBody: body.value.trim(),
        postTags: splitTags(tags.value),
      });

      title.value = "";
      body.value = "";
      tags.value = "";
      await loadPosts();
    } catch (e) {
      button.textContent = e.message;
      button.disabled = false;
      return;
    }

    button.disabled = false;
    button.textContent = originalLabel;
  });
}

wireComposer("#composer-master", "/create_masterpost");
wireComposer("#composer-general", "/create_post");
