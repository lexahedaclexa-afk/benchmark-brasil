
const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* 1. Tempo de reação */
if ($("reactionBox")) {
  let state = "idle";
  let timer = null;
  let startedAt = 0;
  let best = Number(localStorage.getItem("bb_reaction_best") || 0);
  let count = Number(localStorage.getItem("bb_reaction_count") || 0);

  const refresh = () => {
    $("reactionBest").textContent = best ? `${best} ms` : "—";
    $("reactionCount").textContent = count;
  };

  const setClass = (name) => {
    $("reactionBox").className = "playbox" + (name ? " " + name : "");
  };

  $("reactionStart").onclick = () => {
    if (timer) clearTimeout(timer);
    state = "waiting";
    setClass("waiting");
    $("reactionTitle").textContent = "Espere...";
    $("reactionMsg").textContent = "Não clique ainda.";
    $("reactionStart").disabled = true;

    timer = setTimeout(() => {
      state = "go";
      startedAt = performance.now();
      setClass("go");
      $("reactionTitle").textContent = "CLIQUE!";
      $("reactionMsg").textContent = "Agora!";
      timer = null;
    }, 1800 + Math.random() * 3200);
  };

  $("reactionBox").onclick = () => {
    if (state === "waiting") {
      clearTimeout(timer);
      timer = null;
      state = "idle";
      setClass("");
      $("reactionTitle").textContent = "Muito cedo!";
      $("reactionMsg").textContent = "Tente novamente.";
      $("reactionStart").disabled = false;
    } else if (state === "go") {
      const value = Math.round(performance.now() - startedAt);
      state = "result";
      count++;
      if (!best || value < best) best = value;

      localStorage.setItem("bb_reaction_best", String(best));
      localStorage.setItem("bb_reaction_count", String(count));

      $("reactionLast").textContent = `${value} ms`;
      setClass("result");
      $("reactionTitle").textContent = `${value} ms`;
      $("reactionMsg").textContent =
        value < 200 ? "Excelente!" : value < 280 ? "Bom resultado!" : "Tente melhorar.";
      $("reactionStart").disabled = false;
      $("reactionStart").textContent = "Tentar novamente";
      refresh();
    }
  };

  $("reactionReset").onclick = () => {
    best = 0;
    count = 0;
    localStorage.removeItem("bb_reaction_best");
    localStorage.removeItem("bb_reaction_count");
    refresh();
  };

  refresh();
}

/* 2. Digitação */
if ($("typingInput")) {
  const texts = [
    "Quanto mais você pratica, mais rápido e preciso se torna ao digitar no teclado.",
    "A concentração melhora quando você elimina distrações e mantém o foco na tarefa.",
    "Velocidade é importante, mas precisão também faz toda a diferença em um bom resultado.",
    "O cérebro aprende por repetição e melhora quando recebe desafios novos com frequência."
  ];

  let target = "";
  let startedAt = null;
  let done = false;
  let timer = null;

  function newText() {
    target = texts[Math.floor(Math.random() * texts.length)];
    $("typingText").textContent = target;
    $("typingInput").value = "";
    $("typingInput").disabled = false;
    $("typingWpm").textContent = "0";
    $("typingAcc").textContent = "100%";
    $("typingErrors").textContent = "0";
    $("typingTime").textContent = "0.0 s";
    $("typingStatus").textContent = "";
    startedAt = null;
    done = false;
    if (timer) clearInterval(timer);
  }

  function calculate() {
    const value = $("typingInput").value;
    let correct = 0;

    for (let i = 0; i < value.length; i++) {
      if (value[i] === target[i]) correct++;
    }

    const errors = Math.max(0, value.length - correct);
    const elapsed = startedAt ? (performance.now() - startedAt) / 1000 : 0;
    const minutes = Math.max(elapsed / 60, 1 / 60);
    const wpm = Math.round((correct / 5) / minutes);
    const accuracy = value.length ? Math.round((correct / value.length) * 100) : 100;

    $("typingWpm").textContent = wpm;
    $("typingAcc").textContent = `${accuracy}%`;
    $("typingErrors").textContent = errors;
    $("typingTime").textContent = `${elapsed.toFixed(1)} s`;

    if (value === target && !done) {
      done = true;
      $("typingStatus").textContent = "Concluído!";
      $("typingInput").disabled = true;
      clearInterval(timer);
    }
  }

  $("typingInput").addEventListener("input", () => {
    if (!startedAt) {
      startedAt = performance.now();
      timer = setInterval(calculate, 100);
    }
    calculate();
  });

  $("typingNew").onclick = newText;
  newText();
}

/* 3. Memória de sequência */
if ($("sequenceGrid")) {
  let sequence = [];
  let userSequence = [];
  let level = 0;
  let accepting = false;
  let best = Number(localStorage.getItem("bb_memory_best") || 0);

  for (let i = 0; i < 9; i++) {
    const button = document.createElement("button");
    button.className = "seq";
    button.dataset.i = String(i);
    $("sequenceGrid").appendChild(button);
  }

  async function flashSequence() {
    accepting = false;
    $("memoryStatus").textContent = "Observe...";

    for (const index of sequence) {
      const el = document.querySelector(`.seq[data-i="${index}"]`);
      el.classList.add("flash");
      await sleep(420);
      el.classList.remove("flash");
      await sleep(180);
    }

    userSequence = [];
    accepting = true;
    $("memoryStatus").textContent = "Sua vez.";
  }

  async function nextLevel() {
    level++;
    $("memoryLevel").textContent = level;
    sequence.push(Math.floor(Math.random() * 9));
    await sleep(500);
    flashSequence();
  }

  $("memoryStart").onclick = () => {
    sequence = [];
    userSequence = [];
    level = 0;
    $("memoryLevel").textContent = "0";
    nextLevel();
  };

  document.querySelectorAll(".seq").forEach((button) => {
    button.onclick = () => {
      if (!accepting) return;

      const index = Number(button.dataset.i);
      button.classList.add("flash");
      setTimeout(() => button.classList.remove("flash"), 150);
      userSequence.push(index);

      const pos = userSequence.length - 1;

      if (userSequence[pos] !== sequence[pos]) {
        accepting = false;
        $("memoryStatus").textContent = `Fim! Você chegou ao nível ${level}.`;
        if (level > best) {
          best = level;
          localStorage.setItem("bb_memory_best", String(best));
          $("memoryBest").textContent = best;
        }
        return;
      }

      if (userSequence.length === sequence.length) {
        accepting = false;
        $("memoryStatus").textContent = "Correto!";
        setTimeout(nextLevel, 700);
      }
    };
  });

  $("memoryBest").textContent = best;
}

/* 4. Precisão do mouse */
if ($("targetArea")) {
  let running = false;
  let hits = 0;
  let accuracies = [];
  let times = [];
  let shownAt = 0;

  function spawnTarget() {
    $("targetArea").querySelectorAll(".target").forEach((x) => x.remove());

    if (hits >= 20) {
      running = false;
      $("targetMessage").textContent = "Concluído!";
      const avgAcc = accuracies.reduce((a, b) => a + b, 0) / accuracies.length;
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      $("targetAccuracy").textContent = `${Math.round(avgAcc)}%`;
      $("targetAvgTime").textContent = `${Math.round(avgTime)} ms`;
      return;
    }

    $("targetMessage").textContent = "";
    const area = $("targetArea");
    const target = document.createElement("div");
    target.className = "target";
    target.style.left = `${7 + Math.random() * 86}%`;
    target.style.top = `${10 + Math.random() * 80}%`;
    shownAt = performance.now();
    area.appendChild(target);

    target.onclick = (event) => {
      if (!running) return;
      event.stopPropagation();

      const rect = target.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(event.clientX - cx, event.clientY - cy);
      const max = rect.width / 2;

      accuracies.push(Math.max(0, 100 - (dist / max) * 100));
      times.push(performance.now() - shownAt);
      hits++;
      $("targetHits").textContent = `${hits}/20`;
      spawnTarget();
    };
  }

  $("targetStart").onclick = () => {
    running = true;
    hits = 0;
    accuracies = [];
    times = [];
    $("targetHits").textContent = "0/20";
    $("targetAccuracy").textContent = "—";
    $("targetAvgTime").textContent = "—";
    spawnTarget();
  };
}

/* 5. Stroop */
if ($("stroopChoices")) {
  const colors = [
    ["VERMELHO", "#ff4d5a"],
    ["AZUL", "#2da9ff"],
    ["VERDE", "#20c979"],
    ["AMARELO", "#ffd84d"]
  ];

  let round = 0;
  let good = 0;
  let bad = 0;
  let answer = "";
  let startedAt = 0;
  let times = [];
  let running = false;

  function nextRound() {
    if (round >= 15) {
      running = false;
      $("stroopStatus").textContent = "Concluído!";
      $("stroopAvg").textContent =
        `${Math.round(times.reduce((a, b) => a + b, 0) / times.length)} ms`;
      return;
    }

    round++;
    const word = colors[Math.floor(Math.random() * colors.length)];
    const ink = colors[Math.floor(Math.random() * colors.length)];
    answer = ink[0];

    $("stroopWord").textContent = word[0];
    $("stroopWord").style.color = ink[1];
    $("stroopStatus").textContent = `Rodada ${round}/15`;
    startedAt = performance.now();
  }

  colors.forEach((color) => {
    const button = document.createElement("button");
    button.className = "color-choice";
    button.textContent = color[0];

    button.onclick = () => {
      if (!running) return;
      times.push(performance.now() - startedAt);

      if (color[0] === answer) {
        good++;
        $("stroopCorrect").textContent = good;
      } else {
        bad++;
        $("stroopWrong").textContent = bad;
      }

      nextRound();
    };

    $("stroopChoices").appendChild(button);
  });

  $("stroopStart").onclick = () => {
    round = 0;
    good = 0;
    bad = 0;
    times = [];
    running = true;
    $("stroopCorrect").textContent = "0";
    $("stroopWrong").textContent = "0";
    $("stroopAvg").textContent = "—";
    nextRound();
  };
}

/* 6. Velocidade de clique */
if ($("clickBox")) {
  let running = false;
  let count = 0;
  let startedAt = 0;
  let timer = null;
  let best = Number(localStorage.getItem("bb_click_best") || 0);

  const showBest = () => {
    $("clickBest").textContent = best ? `${best.toFixed(2)} CPS` : "—";
  };

  $("clickStart").onclick = () => {
    running = true;
    count = 0;
    startedAt = performance.now();
    $("clickTotal").textContent = "0";
    $("clickStart").disabled = true;
    $("clickBox").className = "playbox go";
    $("clickTitle").textContent = "CLIQUE!";
    $("clickMsg").textContent = "Continue clicando.";

    timer = setInterval(() => {
      const elapsed = (performance.now() - startedAt) / 1000;
      const remaining = Math.max(0, 10 - elapsed);
      $("clickTime").textContent = `${remaining.toFixed(1)} s`;
      $("clickCps").textContent = (elapsed ? count / elapsed : 0).toFixed(2);

      if (remaining <= 0) {
        clearInterval(timer);
        running = false;
        const cps = count / 10;

        if (cps > best) {
          best = cps;
          localStorage.setItem("bb_click_best", String(best));
        }

        showBest();
        $("clickBox").className = "playbox result";
        $("clickTitle").textContent = `${cps.toFixed(2)} CPS`;
        $("clickMsg").textContent = `${count} cliques em 10 segundos.`;
        $("clickStart").disabled = false;
        $("clickStart").textContent = "Tentar novamente";
      }
    }, 50);
  };

  $("clickBox").onclick = () => {
    if (!running) return;
    count++;
    $("clickTotal").textContent = count;
  };

  $("clickReset").onclick = () => {
    best = 0;
    localStorage.removeItem("bb_click_best");
    showBest();
  };

  showBest();
}

/* 7. Memória numérica */
if ($("numberDisplay")) {
  let level = 0;
  let answer = "";
  let best = Number(localStorage.getItem("bb_number_best") || 0);
  let running = false;

  function randomDigits(len) {
    let value = String(Math.floor(Math.random() * 9) + 1);
    for (let i = 1; i < len; i++) value += Math.floor(Math.random() * 10);
    return value;
  }

  async function round() {
    running = true;
    answer = randomDigits(Math.max(1, level + 2));
    $("numberDisplay").textContent = answer;
    $("numberEntryWrap").style.display = "none";
    $("numberStatus").textContent = "Memorize...";

    await sleep(Math.min(1200 + level * 220, 3500));
    if (!running) return;

    $("numberDisplay").textContent = "•••";
    $("numberEntryWrap").style.display = "block";
    $("numberInput").value = "";
    $("numberInput").focus();
    $("numberStatus").textContent = "Digite o número.";
  }

  $("numberStart").onclick = () => {
    level = 1;
    $("numberLevel").textContent = level;
    round();
  };

  function submit() {
    if (!running) return;
    const value = $("numberInput").value.trim();

    if (value === answer) {
      $("numberStatus").textContent = "Correto!";
      if (level > best) {
        best = level;
        localStorage.setItem("bb_number_best", String(best));
        $("numberBest").textContent = best;
      }
      level++;
      $("numberLevel").textContent = level;
      setTimeout(round, 700);
    } else {
      running = false;
      $("numberDisplay").textContent = answer;
      $("numberEntryWrap").style.display = "none";
      $("numberStatus").textContent =
        `Errou. O número era ${answer}. Você chegou ao nível ${level}.`;
    }
  }

  $("numberSubmit").onclick = submit;
  $("numberInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") submit();
  });

  $("numberBest").textContent = best;
}

/* 8. Memória visual */
if ($("visualGrid")) {
  let level = 0;
  let best = Number(localStorage.getItem("bb_visual_best") || 0);
  let targets = [];
  let selected = [];
  let accepting = false;

  function build(size) {
    const grid = $("visualGrid");
    grid.innerHTML = "";
    grid.style.setProperty("--grid", size);

    for (let i = 0; i < size * size; i++) {
      const cell = document.createElement("button");
      cell.className = "visual-cell";
      cell.dataset.i = String(i);
      cell.onclick = () => pick(cell);
      grid.appendChild(cell);
    }
  }

  async function round() {
    accepting = false;
    const size = Math.min(6, 4 + Math.floor((level - 1) / 3));
    build(size);

    const total = size * size;
    const count = Math.min(total - 1, 2 + level);
    const set = new Set();

    while (set.size < count) set.add(Math.floor(Math.random() * total));

    targets = [...set];
    selected = [];
    $("visualStatus").textContent = "Memorize...";

    targets.forEach((i) => $("visualGrid").children[i].classList.add("active"));
    await sleep(Math.min(1400 + level * 120, 2800));
    targets.forEach((i) => $("visualGrid").children[i].classList.remove("active"));

    accepting = true;
    $("visualStatus").textContent = `Selecione ${targets.length} quadrados.`;
  }

  function pick(cell) {
    if (!accepting) return;

    const index = Number(cell.dataset.i);
    if (selected.includes(index)) return;

    selected.push(index);
    cell.classList.add("selected");

    if (!targets.includes(index)) {
      accepting = false;
      $("visualStatus").textContent = `Errou. Você chegou ao nível ${level}.`;
      return;
    }

    if (selected.length === targets.length) {
      accepting = false;
      $("visualStatus").textContent = "Correto!";

      if (level > best) {
        best = level;
        localStorage.setItem("bb_visual_best", String(best));
        $("visualBest").textContent = best;
      }

      level++;
      $("visualLevel").textContent = level;
      setTimeout(round, 700);
    }
  }

  $("visualStart").onclick = () => {
    level = 1;
    $("visualLevel").textContent = level;
    round();
  };

  $("visualBest").textContent = best;
  build(4);
}
