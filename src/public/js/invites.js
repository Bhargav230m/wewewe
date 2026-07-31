// Only heads see this panel. Only the main head can generate join OTPs.
let otpCountdown = null;
async function loadInvites() {
  const me = session.load();

  setMessage($("#invite-msg"), "");

  $("#member-code").textContent = me.villageId;
  $("#inv-member-code").textContent = "No OTP generated";
}

async function generateOTP(button) {
  const me = session.load();
  const msg = $("#invite-msg");

  button.disabled = true;
  setMessage(msg, "Generating OTP...", true);

  try {
    const out = await api.post("/generateOTP", {
      villageId: me.villageId,
      username: me.username,
    });

    $("#inv-member-code").textContent = out.otp;
    setMessage($("#invite-msg"), "Join OTP generated. Valid for 5 minutes.", true);

    let time = out.expiresIn || 300;
    setMessage(msg, "Join OTP generated. Valid for 5 minutes.", true);

    const countdown = setInterval(() => {
      time--;

      if (time <= 0) {
        clearInterval(countdown);
        $("#inv-member-code").textContent = "Expired";
        setMessage(msg, "OTP has expired.", false);
        return;
      }

      const minutes = Math.floor(time / 60);
      const seconds = String(time % 60).padStart(2, "0");

      setMessage(
        msg,
        `Join OTP generated. Expires in ${minutes}:${seconds}`,
        true
      );
    }, 1000);

  } catch (e) {
    setMessage(msg, e.message);
  }

  button.disabled = false;
}

$("#revoke-member").addEventListener("click", function () {
  generateOTP($("#revoke-member"));
});

loadInvites();