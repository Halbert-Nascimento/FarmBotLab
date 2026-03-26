const Interpreter = window.Interpreter;

function nextFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

// js-interpreter 6.0.1 é baseado em ES5 e não entende let/const.
// Esta função converte apenas tokens de código (não toca em strings/comentários).
function normalizeModernDeclarations(sourceCode) {
  const len = sourceCode.length;
  let i = 0;
  let out = "";
  let state = "code";

  const isIdentChar = (ch) => /[A-Za-z0-9_$]/.test(ch);

  while (i < len) {
    const ch = sourceCode[i];
    const next = i + 1 < len ? sourceCode[i + 1] : "";

    if (state === "code") {
      if (ch === "'" ) {
        state = "single";
        out += ch;
        i += 1;
        continue;
      }
      if (ch === '"') {
        state = "double";
        out += ch;
        i += 1;
        continue;
      }
      if (ch === "`") {
        state = "template";
        out += ch;
        i += 1;
        continue;
      }
      if (ch === "/" && next === "/") {
        state = "lineComment";
        out += ch + next;
        i += 2;
        continue;
      }
      if (ch === "/" && next === "*") {
        state = "blockComment";
        out += ch + next;
        i += 2;
        continue;
      }

      if (isIdentChar(ch)) {
        let j = i + 1;
        while (j < len && isIdentChar(sourceCode[j])) j += 1;
        const token = sourceCode.slice(i, j);
        out += token === "let" || token === "const" ? "var" : token;
        i = j;
        continue;
      }

      out += ch;
      i += 1;
      continue;
    }

    if (state === "single") {
      out += ch;
      i += 1;
      if (ch === "\\" && i < len) {
        out += sourceCode[i];
        i += 1;
        continue;
      }
      if (ch === "'") state = "code";
      continue;
    }

    if (state === "double") {
      out += ch;
      i += 1;
      if (ch === "\\" && i < len) {
        out += sourceCode[i];
        i += 1;
        continue;
      }
      if (ch === '"') state = "code";
      continue;
    }

    if (state === "template") {
      out += ch;
      i += 1;
      if (ch === "\\" && i < len) {
        out += sourceCode[i];
        i += 1;
        continue;
      }
      if (ch === "`") state = "code";
      continue;
    }

    if (state === "lineComment") {
      out += ch;
      i += 1;
      if (ch === "\n") state = "code";
      continue;
    }

    if (state === "blockComment") {
      out += ch;
      i += 1;
      if (ch === "*" && i < len && sourceCode[i] === "/") {
        out += "/";
        i += 1;
        state = "code";
      }
    }
  }

  return out;
}

export function createProgramRunner({ getCode, onAction, onLog, onDebugError }) {
  const actionQueue = [];
  let isExecuting = false;
  let stopRequested = false;

  function initApi(interpreter, globalObject) {
    const native = (name, action) => {
      const fn = (...args) => {
        actionQueue.push({
          type: action,
          args,
        });
      };
      interpreter.setProperty(globalObject, name, interpreter.createNativeFunction(fn));
    };

    // API principal em pt-BR
    native("moverDireita", "right");
    native("moverEsquerda", "left");
    native("moverCima", "up");
    native("moverBaixo", "down");
    native("plantar", "plant");
    native("colher", "harvest");

    // Aliases legados (compatibilidade com scripts antigos)
    native("moveRight", "right");
    native("moveLeft", "left");
    native("moveUp", "up");
    native("moveDown", "down");
    native("plant", "plant");
    native("harvest", "harvest");
  }

  async function run() {
    if (isExecuting) return;

    if (!Interpreter) {
      const msg = "Falha ao carregar JS-Interpreter. Recarregue a pagina e confira a internet/CDN.";
      onLog(msg);
      onDebugError("JS-Interpreter indisponivel (CDN nao carregou).");
      return;
    }

    stopRequested = false;
    isExecuting = true;
    actionQueue.length = 0;

    let interpreter;
    try {
      const rawCode = getCode();
      const normalizedCode = normalizeModernDeclarations(rawCode);
      if (normalizedCode !== rawCode) {
        onLog("Compatibilidade: let/const foram convertidos para var no runtime.");
      }
      interpreter = new Interpreter(normalizedCode, initApi);
      onLog("Execucao iniciada");
    } catch (error) {
      const msg = `Erro de sintaxe: ${error.message}`;
      onLog(msg);
      onDebugError(msg);
      isExecuting = false;
      return;
    }

    while (isExecuting) {
      if (stopRequested) {
        onLog("Execucao interrompida");
        break;
      }

      if (actionQueue.length > 0) {
        const action = actionQueue.shift();
        try {
          await onAction(action);
        } catch (error) {
          const msg = `Erro ao processar acao: ${error.message}`;
          onLog(msg);
          onDebugError(msg);
          break;
        }
        continue;
      }

      let hasMore = false;
      try {
        hasMore = interpreter.step();
      } catch (error) {
        const msg = `Erro em runtime: ${error.message}`;
        onLog(msg);
        onDebugError(msg);
        break;
      }

      if (!hasMore) {
        onLog("Execucao finalizada");
        break;
      }

      await nextFrame();
    }

    isExecuting = false;
  }

  function stop() {
    stopRequested = true;
  }

  function reset() {
    stopRequested = true;
    isExecuting = false;
    actionQueue.length = 0;
  }

  return {
    run,
    stop,
    reset,
    isExecuting: () => isExecuting,
  };
}
