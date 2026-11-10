// Core DOM builders, reactive controls, and high-DPI 2D live architecture diagram (Ra)

function JT(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function $T(hexA, hexB, t) {
  const a = parseInt(hexA.slice(1), 16);
  const b = parseInt(hexB.slice(1), 16);
  const k = Math.max(0, Math.min(1, t));
  const rgb = [16, 8, 0].map((shift) =>
    Math.round(((a >> shift) & 255) * (1 - k) + ((b >> shift) & 255) * k),
  );
  return `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
}

function hexAlpha(hex, alpha) {
  if (!hex || hex[0] !== "#") return `rgba(88,196,255,${alpha})`;
  const v = parseInt(hex.slice(1), 16);
  return `rgba(${(v >> 16) & 255},${(v >> 8) & 255},${v & 255},${alpha})`;
}

var Ra = class ArchDiagram {
  constructor(nodes, edges) {
    this.nodes = {};
    for (const n of nodes) this.nodes[n.id] = { ...n, act: 0 };
    this.edges = edges.map(([a, b, label]) => ({ a, b, label, glow: 0 }));
    this.pulses = [];
    this.maxPulses = 72;
  }

  pulse(a, b, color = "#58c4ff", speed = 1.75) {
    if (ArchDiagram.hook) ArchDiagram.hook(this, a, b);
    if (!this.nodes[a] || !this.nodes[b]) return;
    this.nodes[a].act = Math.min(1, this.nodes[a].act + 0.55);
    for (const e of this.edges) {
      if ((e.a === a && e.b === b) || (e.a === b && e.b === a)) {
        e.glow = Math.min(1, (e.glow || 0) + 0.7);
      }
    }
    if (this.pulses.length < this.maxPulses) {
      this.pulses.push({ a, b, t: 0, color, speed });
    }
  }

  activate(id, amount = 1) {
    if (this.nodes[id]) {
      this.nodes[id].act = Math.max(this.nodes[id].act, Math.min(1, amount));
    }
  }

  _edgePoint(nA, nB, w, h, u) {
    const x0 = nA.x * w;
    const y0 = nA.y * h;
    const x1 = nB.x * w;
    const y1 = nB.y * h;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const cx0 = x0 + dx * 0.42;
    const cy0 = y0 + dy * 0.1;
    const cx1 = x0 + dx * 0.58;
    const cy1 = y1 - dy * 0.1;
    const inv = 1 - u;
    const x =
      inv * inv * inv * x0 +
      3 * inv * inv * u * cx0 +
      3 * inv * u * u * cx1 +
      u * u * u * x1;
    const y =
      inv * inv * inv * y0 +
      3 * inv * inv * u * cy0 +
      3 * inv * u * u * cy1 +
      u * u * u * y1;
    return [x, y, cx0, cy0, cx1, cy1];
  }

  draw(ctx, w, h, dt) {
    ctx.clearRect(0, 0, w, h);

    // Subtle schematic grid backdrop
    const step = Math.max(14, Math.round(w / 24));
    ctx.fillStyle = "rgba(120, 165, 220, 0.08)";
    for (let gx = step * 0.5; gx < w; gx += step) {
      for (let gy = step * 0.5; gy < h; gy += step) {
        ctx.fillRect(gx, gy, 1.2, 1.2);
      }
    }

    const baseLine = Math.max(1.15, w / 310);
    for (const edge of this.edges) {
      const nA = this.nodes[edge.a];
      const nB = this.nodes[edge.b];
      if (!nA || !nB) continue;
      edge.glow = Math.max(0, (edge.glow || 0) - dt * 2.1);
      const x0 = nA.x * w;
      const y0 = nA.y * h;
      const x1 = nB.x * w;
      const y1 = nB.y * h;
      const [, , cx0, cy0, cx1, cy1] = this._edgePoint(nA, nB, w, h, 0.5);

      ctx.strokeStyle =
        edge.glow > 0.02
          ? $T("#2a3a4e", nA.color || "#58c4ff", edge.glow * 0.85)
          : "#2a3a4e";
      ctx.lineWidth = baseLine + edge.glow * 1.4;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.bezierCurveTo(cx0, cy0, cx1, cy1, x1, y1);
      ctx.stroke();

      // Midpoint directional chevron
      const [mx, my] = this._edgePoint(nA, nB, w, h, 0.52);
      const [mx0, my0] = this._edgePoint(nA, nB, w, h, 0.46);
      const ang = Math.atan2(my - my0, mx - mx0);
      const arr = Math.max(3.2, h / 44);
      ctx.fillStyle = edge.glow > 0.05 ? nA.color || "#58c4ff" : "#445873";
      ctx.beginPath();
      ctx.moveTo(mx + Math.cos(ang) * arr, my + Math.sin(ang) * arr);
      ctx.lineTo(
        mx + Math.cos(ang + 2.5) * arr * 0.85,
        my + Math.sin(ang + 2.5) * arr * 0.85,
      );
      ctx.lineTo(
        mx + Math.cos(ang - 2.5) * arr * 0.85,
        my + Math.sin(ang - 2.5) * arr * 0.85,
      );
      ctx.closePath();
      ctx.fill();

      if (edge.label) {
        ctx.font = `500 ${Math.max(9, Math.round(h / 19))}px "JetBrains Mono", ui-monospace, monospace`;
        const tw = ctx.measureText(edge.label).width + 6;
        const th = Math.max(10, Math.round(h / 16));
        ctx.fillStyle = "rgba(8, 12, 18, 0.78)";
        JT(ctx, mx - tw * 0.5, my - th - 2, tw, th, 3);
        ctx.fill();
        ctx.fillStyle = "#8ca2bd";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(edge.label, mx, my - th * 0.5 - 2);
      }
    }

    // Data packet pulses with luminous comet trails
    for (const p of this.pulses) {
      p.t += dt * p.speed;
      const nA = this.nodes[p.a];
      const nB = this.nodes[p.b];
      if (!nA || !nB) continue;
      const u = Math.min(1, p.t);
      const [px, py] = this._edgePoint(nA, nB, w, h, u);
      const [tx, ty] = this._edgePoint(nA, nB, w, h, Math.max(0, u - 0.12));

      const grad = ctx.createLinearGradient(tx, ty, px, py);
      grad.addColorStop(0, hexAlpha(p.color, 0));
      grad.addColorStop(1, p.color);
      ctx.strokeStyle = grad;
      ctx.lineWidth = Math.max(2.2, h / 52);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(px, py);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(px, py, Math.max(2.6, h / 46), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (p.t >= 1) {
        nB.act = Math.min(1, nB.act + 0.55);
      }
    }
    this.pulses = this.pulses.filter((p) => p.t < 1);

    // Hardware/subsystem nodes
    const fontSize = Math.max(10, Math.round(h / 15));
    for (const node of Object.values(this.nodes)) {
      const nx = node.x * w;
      const ny = node.y * h;
      const nw = node.w * w;
      const nh = (node.h || 0.16) * h;
      const act = node.act;
      node.act = Math.max(0, node.act - dt * 1.75);

      const accent = node.color || "#58c4ff";
      const x0 = nx - nw * 0.5;
      const y0 = ny - nh * 0.5;

      if (act > 0.04) {
        ctx.shadowColor = accent;
        ctx.shadowBlur = 14 * act;
      }
      const bgGrad = ctx.createLinearGradient(x0, y0, x0, y0 + nh);
      bgGrad.addColorStop(0, $T("#192331", accent, 0.16 + act * 0.48));
      bgGrad.addColorStop(1, $T("#0e141e", accent, 0.08 + act * 0.3));
      ctx.fillStyle = bgGrad;
      ctx.strokeStyle = $T("#364963", accent, 0.45 + act * 0.55);
      ctx.lineWidth = 1.1 + act * 1.8;
      JT(ctx, x0, y0, nw, nh, 6);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Top accent bar
      ctx.fillStyle = hexAlpha(accent, 0.55 + act * 0.45);
      JT(ctx, x0 + 2, y0 + 1.5, Math.max(4, nw - 4), 2.2, 1);
      ctx.fill();

      ctx.fillStyle = "#eef4fb";
      ctx.font = `600 ${fontSize}px Inter, system-ui, -apple-system, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const lines = String(node.label).split("\n");
      lines.forEach((ln, idx) => {
        ctx.fillText(
          ln,
          nx,
          ny + (idx - (lines.length - 1) * 0.5) * fontSize * 1.06,
          nw - 6,
        );
      });

      if (node.val) {
        const vFont = Math.max(9, Math.round(fontSize * 0.84));
        ctx.font = `500 ${vFont}px "JetBrains Mono", ui-monospace, monospace`;
        const pillW = Math.min(nw * 1.38, ctx.measureText(node.val).width + 10);
        const pillH = vFont * 1.24;
        ctx.fillStyle = "rgba(6, 10, 16, 0.92)";
        ctx.strokeStyle = hexAlpha(accent, 0.45);
        ctx.lineWidth = 0.9;
        JT(ctx, nx - pillW * 0.5, y0 + nh + 1.5, pillW, pillH, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#ffd66b";
        ctx.fillText(node.val, nx, y0 + nh + 1.5 + pillH * 0.53, nw * 1.34);
      }
    }
  }
};

function q(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === "style" && typeof v === "object") {
      Object.assign(el.style, v);
    } else if (k.startsWith("on") && typeof v === "function") {
      el.addEventListener(k.slice(2), v);
    } else if (k === "html") {
      el.innerHTML = v;
    } else if (v !== false && v != null) {
      el.setAttribute(k, v === true ? "" : v);
    }
  }
  for (const child of children.flat()) {
    if (child != null) {
      el.append(child.nodeType ? child : document.createTextNode(child));
    }
  }
  return el;
}

var Ie = (title, ...children) =>
    q(
      "div",
      { class: "box" },
      title ? q("div", { class: "sec-t" }, title) : null,
      ...children,
    ),
  Fe = (label, onClick, cls = "") =>
    q("button", { class: "btn " + cls, onclick: onClick }, label);

function We(label, min, max, step, val, onChange, fmt = (x) => x) {
  const readout = q("span", { class: "v" }, fmt(val));
  const input = q("input", {
    type: "range",
    min,
    max,
    step,
    value: val,
  });
  input.addEventListener("input", () => {
    readout.textContent = fmt(+input.value);
    onChange(+input.value);
  });
  const row = q("div", { class: "ctl" }, q("span", {}, label), input, readout);
  row.set = (next) => {
    input.value = next;
    readout.textContent = fmt(+input.value);
  };
  row.input = input;
  return row;
}

function st(options, initial, onChange) {
  const sel = q(
    "select",
    {},
    ...options.map((opt) => {
      const [val, text] = Array.isArray(opt) ? opt : [opt, opt];
      return q("option", { value: val, selected: val == initial }, text);
    }),
  );
  sel.addEventListener("change", () => onChange(sel.value));
  return sel;
}

function Ht(initialText, onEdit, rows = 12, debounceMs = 300) {
  const area = q("textarea", {
    class: "code",
    spellcheck: "false",
    rows,
  });
  area.value = initialText;
  let timer;
  area.addEventListener("keydown", (ev) => {
    if (ev.key === "Tab") {
      ev.preventDefault();
      const start = area.selectionStart;
      area.setRangeText("  ", start, area.selectionEnd, "end");
      area.dispatchEvent(new Event("input"));
    }
    ev.stopPropagation();
  });
  area.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => onEdit(area.value), debounceMs);
  });
  return area;
}

function Pt(fields) {
  const grid = q("div", { class: "stats" });
  const refs = {};
  for (const [key, label] of fields) {
    const valEl = q("b", {}, "–");
    refs[key] = valEl;
    grid.append(q("div", {}, label, valEl));
  }
  grid.set = (key, value) => {
    if (refs[key] && refs[key].textContent !== String(value)) {
      refs[key].textContent = value;
    }
  };
  return grid;
}

function It(heightPx = 160) {
  const canvas = q("canvas", { class: "plot" });
  canvas.style.height = heightPx + "px";
  return canvas;
}

function yt(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(10, Math.round(rect.width * dpr));
  const h = Math.max(10, Math.round(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return canvas.getContext("2d");
}

var bt = (n, pad = 2) => (n >>> 0).toString(16).toUpperCase().padStart(pad, "0"),
  Kn = (n, pad = 4) => (n >>> 0).toString(8).padStart(pad, "0");
