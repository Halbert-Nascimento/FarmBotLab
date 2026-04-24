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

export function createProgramRunner({ getCode, onAction, onQuery, onLog, onConsoleLog, onDebugError }) {
  const actionQueue = [];
  let isExecuting = false;
  let stopRequested = false;

  function initApi(interpreter, globalObject) {
    // ── Canal 1: Comandos void (unidirecional — fila de ações) ──────────────
    var native = function (name, action) {
      var fn = function () {
        var args = [];
        for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
        actionQueue.push({ type: action, args: args });
      };
      interpreter.setProperty(
        globalObject, name, interpreter.createNativeFunction(fn)
      );
    };

    // ── Canal 2: Sensores com retorno (síncrono) ────────────────────────────
    // Chama onQuery({ type, args }) → valor JS nativo, converte para sandbox.
    var nativeWithReturn = function (name, action) {
      var fn = function () {
        var args = [];
        for (var i = 0; i < arguments.length; i++) args.push(arguments[i]);
        var result = onQuery({ type: action, args: args });
        return interpreter.nativeToPseudo(result);
      };
      interpreter.setProperty(
        globalObject, name, interpreter.createNativeFunction(fn)
      );
    };

    // ── mover(direcao) — função parametrizada ──────────────────────────────
    var fnMover = function (direcao) {
      var dir = direcao && typeof direcao === "object" ? direcao.data : direcao;
      actionQueue.push({ type: "move", args: [String(dir == null ? "" : dir)] });
    };
    interpreter.setProperty(
      globalObject, "mover", interpreter.createNativeFunction(fnMover)
    );
    interpreter.setProperty(
      globalObject, "move", interpreter.createNativeFunction(fnMover)
    );

    // ── API de comando em pt-BR ─────────────────────────────────────────────
    native("plantar", "plant");
    native("colher", "harvest");
    native("prepararSolo", "setSoilType");
    native("prepararSuperficie", "setSurface");

    // ── API de comando — aliases EN ─────────────────────────────────────────
    native("plant", "plant");
    native("harvest", "harvest");
    native("prepareSoil", "setSoilType");
    native("prepareSurface", "setSurface");

    // ── Sensores pt-BR ──────────────────────────────────────────────────────
    nativeWithReturn("obterCultura", "getCrop");
    nativeWithReturn("obterSolo", "getSoilType");
    nativeWithReturn("obterSuperficie", "getSurface");
    nativeWithReturn("posicaoX", "getPosX");
    nativeWithReturn("posicaoY", "getPosY");
    nativeWithReturn("verificarMaturidade", "isRipe");
    nativeWithReturn("tamanhoCampoX", "getWorldWidth");
    nativeWithReturn("tamanhoCampoY", "getWorldHeight");
    nativeWithReturn("contarItem", "getItemCount");
    nativeWithReturn("turnoAtual", "getCurrentTurn");

    // ── Sensores EN ─────────────────────────────────────────────────────────
    nativeWithReturn("getCrop", "getCrop");
    nativeWithReturn("getSoilType", "getSoilType");
    nativeWithReturn("getSurface", "getSurface");
    nativeWithReturn("getPosX", "getPosX");
    nativeWithReturn("getPosY", "getPosY");
    nativeWithReturn("isRipe", "isRipe");
    nativeWithReturn("getWorldWidth", "getWorldWidth");
    nativeWithReturn("getWorldHeight", "getWorldHeight");
    nativeWithReturn("getItemCount", "getItemCount");
    nativeWithReturn("getCurrentTurn", "getCurrentTurn");

    // ── console sandbox — redireciona para o Log de Execução da UI ──────────
    // Isolado do window.console: é um pseudo-objeto novo criado dentro da sandbox.
    // Os métodos aceitam múltiplos argumentos; objetos/arrays são exibidos via JSON.
    var consoleObj = interpreter.nativeToPseudo({});

    var CONSOLE_LEVELS = ["log", "info", "warn", "error"];
    for (var ci = 0; ci < CONSOLE_LEVELS.length; ci++) {
      (function (level) {
        var prefix =
          level === "warn"  ? "[AVISO] " :
          level === "error" ? "[ERRO] "  :
          level === "info" ? "[INFO] "  :
          "[LOG] ";

        var fn = interpreter.createNativeFunction(function () {
          var parts = [];
          for (var i = 0; i < arguments.length; i++) {
            var native = interpreter.pseudoToNative(arguments[i]);
            if (native !== null && typeof native === "object") {
              try {
                parts.push(JSON.stringify(native, null, 2));
              } catch (_) {
                parts.push(String(native));
              }
            } else {
              parts.push(String(native == null ? "" : native));
            }
          }
          var msg = prefix + parts.join(" ");
          if (typeof onConsoleLog === "function") {
            onConsoleLog(msg, level);
          } else {
            onLog(msg);
          }
        });

        interpreter.setProperty(consoleObj, level, fn);
      })(CONSOLE_LEVELS[ci]);
    }

    interpreter.setProperty(globalObject, "console", consoleObj);
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
