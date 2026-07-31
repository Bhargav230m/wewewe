let mode = "login"; // "login" or "signup"
let justCreated = null; // remembered so we can log the sarpanch straight in


function goto(name) {
  ["choose", "create", "codes", "join"].forEach(function (v) {
    const el = $("#view-" + v);
    if (el) el.classList.toggle("hidden", v !== name);
  });
}

$all("[data-goto]").forEach(function (btn) {
  btn.addEventListener("click", function () {
    goto(btn.dataset.goto);
  });
});

$all(".tab").forEach(function (tab) {
  tab.addEventListener("click", function () {
    mode = tab.dataset.tab;
    $all(".tab").forEach(function (t) {
      t.classList.toggle("active", t === tab);
    });
    $("#signup-only").classList.toggle("hidden", mode !== "signup");
    $("#join-submit").textContent = mode === "signup" ? "Sign up" : "Log in";
    setMessage($("#join-msg"), "");
  });
});

$("#create-submit").addEventListener("click", async function () {
  const msg = $("#create-msg");
  const name = $("#c-village-name").value.trim();
  const address = $("#c-village-address").value.trim();
  const displayName = $("#c-display-name").value.trim();
  const username = $("#c-username").value.trim().toLowerCase();
  const password = $("#c-password").value;

  if (!name || !address || !displayName || !username || !password) {
    setMessage(msg, "Fill in every field to create the village.");
    return;
  }

  setMessage(msg, "Creating…", true);

  try {
    const out = await api.post("/villageCreate", {
      name: name,
      address: address,
      headdetails: {
        pass: password,
        headUsername: username,
        displayName: displayName,
      },
    });

    justCreated = {
      username: username,
      password: password,
      memberCode: out.memberInviteCode,
    };

    $("#out-member-code").textContent = out.memberInviteCode;
    setMessage(msg, "");
    goto("codes");
  } catch (e) {
    setMessage(msg, e.message);
  }
});

$("#enter-village").addEventListener("click", async function () {
  if (!justCreated) {
    goto("join");
    return;
  }
  await doLogin(
    justCreated.username,
    justCreated.password,
    justCreated.memberCode,
    $("#create-msg"),
  );
});

$("#join-submit").addEventListener("click", async function () {
  const msg = $("#join-msg");
  const code = $("#j-code").value.trim();
  const one_time = $("#j-otp").value.trim();
  const username = $("#j-username").value.trim().toLowerCase();
  const password = $("#j-password").value;
  const displayName = $("#j-display-name").value.trim();

  if (!code || !username || !password) {
    setMessage(msg, "Invite code, username and password are all needed.");
    return;
  }
  if (mode === "signup" && (!displayName || !one_time)) {
    setMessage(msg, "Display name and Join OTP are required.");
    return;
}

  setMessage(msg, mode === "signup" ? "Creating account…" : "Logging in…", true);

  try {
    if (mode === "signup") {
      await api.post("/signup", buildCodeBody(code, {
        username: username,
        password: password,
        displayName: displayName,
        otp: one_time,
      }));
    }
    await doLogin(username, password, code, msg);
  } catch (e) {
    setMessage(msg, e.message);
  }
});

// The backend takes either memberCode or masterCode, never both.
function buildCodeBody(code, extra) {
  const body = Object.assign({}, extra);
  body.memberCode = code;
  return body;
}



async function doLogin(username, password, code, msg) {
  try {
    const out = await api.post("/login", buildCodeBody(code, {
      username: username,
      password: password,
    }));

    const data = out.data || {};
    session.save({
      villageId: data.villageId || code,
      villageName: data.villageName || "Village",
      villageAddress: data.villageAddress || "welcome",
      username: username,
      displayName: data.displayName || username,
      mainHead: Boolean(data.mainHead),
    });

    window.location.href = "/village.html";
  } catch (e) {
    console.error(e)
    setMessage(msg, e.message);
  }
}

const switcher_tourism = document.getElementById("switch1");
const switcher_market = document.getElementById("switch2");
const tourism = document.getElementById("tourist");
const market = document.getElementById("marketing");

switcher_tourism.addEventListener("click",Touristing);

function Touristing(){
    tourism.style.display = "none";
    market.style.display = "block";

}

switcher_market.addEventListener("click",Marketing);

function Marketing(){
    tourism.style.display = "block";
    market.style.display = "none";

}