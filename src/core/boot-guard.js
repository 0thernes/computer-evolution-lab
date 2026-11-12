// Startup error guard (external so the page can use a strict Content-Security-Policy).
// Works both via file:// double-click and via local HTTP server
(function () {
  function show(title, msg) {
    var b = document.getElementById("boot");
    if (!b) {
      b = document.createElement("div");
      b.id = "boot";
      (document.body || document.documentElement).appendChild(b);
    }
    b.className = "err";
    b.style.display = "flex";
    b.innerHTML =
      '<div class="bx"><h1></h1><p></p><pre></pre><p>Open in a current Chrome, Edge, Firefox, or Safari browser with WebGL2 enabled.</p></div>';
    b.querySelector("h1").textContent = title;
    b.querySelector("p").textContent =
      "The Computer Evolution Lab could not start.";
    b.querySelector("pre").textContent = msg;
  }
  window.__labFail = show;
  window.__labStarted = false;
  window.addEventListener("error", function (e) {
    if (!window.__labStarted && !document.querySelector("#boot.err")) {
      show(
        "Startup error",
        (e.message || "error") +
          (e.filename ? "\n" + e.filename + ":" + e.lineno : ""),
      );
    }
  });
  window.addEventListener("unhandledrejection", function (e) {
    if (!window.__labStarted && !document.querySelector("#boot.err")) {
      show("Startup error", String((e.reason && e.reason.message) || e.reason));
    }
  });
  setTimeout(function () {
    if (!window.__labStarted && !document.querySelector("#boot.err")) {
      show(
        "Still loading after 25 s",
        "Ensure all modular files in styles/, vendor/, assets/, and src/ are next to this HTML file.",
      );
    }
  }, 25000);
})();
