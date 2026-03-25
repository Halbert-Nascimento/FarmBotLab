export function createLogger(logElement) {
  function append(message) {
    const t = new Date().toLocaleTimeString("pt-BR", { hour12: false });
    logElement.textContent += `[${t}] ${message}\n`;
    logElement.scrollTop = logElement.scrollHeight;
  }

  function clear() {
    logElement.textContent = "";
  }

  return {
    append,
    clear,
  };
}
