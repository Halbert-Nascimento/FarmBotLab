export function createLogger(logElement) {
  function _addLine(text, cssClass) {
    const t = new Date().toLocaleTimeString("pt-BR", { hour12: false });
    const line = document.createElement("span");
    if (cssClass) line.className = cssClass;
    line.textContent = `[${t}] ${text}\n`;
    logElement.appendChild(line);
    logElement.scrollTop = logElement.scrollHeight;
  }

  function append(message) {
    _addLine(message, null);
  }

  // level: "log" | "info" | "warn" | "error"
  function appendStyled(text, level) {
    const cssClass =
      level === "warn"  ? "log-warn"  :
      level === "error" ? "log-error" :
      level === "info"  ? "log-info"  :
      "log-debug";
    _addLine(text, cssClass);
  }

  function clear() {
    logElement.textContent = "";
  }

  return {
    append,
    appendStyled,
    clear,
  };
}
