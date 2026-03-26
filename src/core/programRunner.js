const Interpreter = window.Interpreter;

function nextFrame() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
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
      interpreter = new Interpreter(getCode(), initApi);
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
