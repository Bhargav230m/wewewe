const api = {
  async post(path, body) {
    let res;
    try {
      res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
      });
    } catch (e) {
      throw new Error("Can't reach the server. Is it running?");
    }

    let json = {};
    try {
      json = await res.json();
    } catch (e) {
      console.error(e)
      throw new Error("The server sent something that isn't JSON.");
    }

    if (!res.ok || json.error) {
      throw new Error(json.error || "Something went wrong.");
    }

    return json;
  },
};
