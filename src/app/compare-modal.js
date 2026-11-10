function Dc(i) {
  let e = q("div", {
      class: "overlay",
      onclick: (a) => {
        a.target === e && e.remove();
      },
    }),
    t = "tr",
    n = q("canvas", { class: "plot", style: { height: "300px" } }),
    s = q("div", { class: "ctable" }),
    r = () => {
      let a = n.getBoundingClientRect(),
        l = Math.min(2, devicePixelRatio || 1);
      ((n.width = a.width * l), (n.height = a.height * l));
      let c = n.getContext("2d");
      c.scale(l, l);
      let h = a.width,
        d = a.height;
      ((c.fillStyle = "#05080b"), c.fillRect(0, 0, h, d));
      let u = p0.map((g) => g[t]).filter((g) => g > 0),
        f = Math.floor(Math.log10(Math.min(...u))),
        p = Math.ceil(Math.log10(Math.max(...u))),
        x = (h - 70) / p0.length;
      ((c.strokeStyle = "#223"),
        (c.fillStyle = "#8b98a9"),
        (c.font = "10px ui-monospace,monospace"));
      for (let g = f; g <= p; g++) {
        let m = d - 40 - ((g - f) / (p - f || 1)) * (d - 70);
        (c.beginPath(),
          c.moveTo(60, m),
          c.lineTo(h - 6, m),
          c.stroke(),
          c.fillText("1e" + g, 4, m + 3));
      }
      p0.forEach((g, m) => {
        let S = g[t],
          b = 64 + m * x;
        if (
          (c.save(),
          c.translate(b + x / 2, d - 4),
          c.rotate(-0.6),
          (c.fillStyle = "#cfd8e3"),
          c.fillText(g.year + " " + g.id, 0, 0),
          c.restore(),
          !(S > 0))
        ) {
          ((c.fillStyle = "#444"), c.fillText("—", b + x / 2 - 3, d - 46));
          return;
        }
        let y = d - 40 - ((Math.log10(S) - f) / (p - f || 1)) * (d - 70),
          E = c.createLinearGradient(0, y, 0, d - 40);
        (E.addColorStop(0, "#ffb347"),
          E.addColorStop(1, "#3a7bd5"),
          (c.fillStyle = E),
          c.fillRect(b + 4, y, x - 8, d - 40 - y),
          (c.fillStyle = "#fff"),
          c.fillText(Wy(t, S), b + 2, y - 4, x));
      });
    },
    o = q(
      "select",
      {
        onchange: (a) => {
          ((t = a.target.value), r());
        },
      },
      ...Um.map(([a, l]) => q("option", { value: a, selected: a === t }, l)),
    );
  return (
    s.append(
      q(
        "table",
        {},
        q(
          "tr",
          {},
          ...[
            "Year",
            "Reference machine",
            ...Um.map((a) => a[1].split(" (")[0]),
            "Notes · source",
          ].map((a) => q("th", {}, a)),
        ),
        ...p0.map((a) =>
          q(
            "tr",
            {
              onclick: () => {
                (e.remove(), i && i(a.id));
              },
              title: "open this machine",
            },
            q("td", {}, a.year),
            q("td", {}, q("b", {}, a.name)),
            ...Um.map(([l]) =>
              q(
                "td",
                {},
                l === "tr" && a.devices && a.tr == null ? a.devices : Wy(l, a[l]),
              ),
            ),
            q("td", { class: "small" }, a.note + " · " + a.src),
          ),
        ),
      ),
    ),
    e.append(
      q(
        "div",
        { class: "modal wide" },
        q("button", { class: "mx", onclick: () => e.remove() }, "×"),
        q("h2", {}, "Compare the eras"),
        q(
          "p",
          { class: "small" },
          "Documented figures for the real machine each scene is modelled on (log scale). “—” means not applicable or not reliably documented, never estimated. Click a row to open that machine.",
        ),
        q("div", { class: "row" }, "Metric ", o),
        n,
        s,
      ),
    ),
    document.body.append(e),
    requestAnimationFrame(r),
    e
  );
}
