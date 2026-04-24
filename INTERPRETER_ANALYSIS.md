# Analise do Sistema de Interpretacao de Codigo JS

**Data:** 26 de marco de 2026 — Atualizado: 11 de abril de 2026 (v1.1.0-beta)
**Status:** Documento de referencia arquitetural — estado atual do sistema

---

## 1. ARQUITETURA ATUAL

### 1.1 Stack Tecnologico

| Componente | Ferramenta | Versao | Proposito |
|---|---|---|---|
| **Executor de JS** | js-interpreter | 6.0.1 | Sandbox seguro; executa JS de forma controlada |
| **Editor** | Ace Editor | 1.43.6 | Interface de edicao de codigo |
| **Renderizacao 3D** | Three.js | 0.183.2 | Visualizacao 3D da plantacao |
| **Pipeline** | ES6 Modules | - | Modularizacao do codigo |

### 1.2 Fluxo de Execucao — Dois Canais

```
[editor.getValue()]
        ↓
[createProgramRunner]
        ↓
[new Interpreter(code, initApi)]  ← js-interpreter varre o codigo
        ↓
[interpreter.step()]  ← executa uma instrucao de cada vez
        ↓
        ├── Canal 1 (void): actionQueue.push(action)
        │       ↓
        │   [await onAction(action)]  ← gameController.executeAction()
        │       ↓
        │   [world + gamePhases + view.animateMove()]
        │
        └── Canal 2 (retorno sincrono): onQuery({ type, args })
                ↓
            [gameController.queryState()]
                ↓
            [interpreter.nativeToPseudo(result)]  ← retorno para sandbox
```

---

## 2. ESTADO ATUAL: API EXPOSTA

### 2.1 Movimentacao

```javascript
mover("direita")    // Canal 1 — move +1 no eixo X
mover("esquerda")   // Canal 1 — move -1 no eixo X
mover("cima")       // Canal 1 — move -1 no eixo Y
mover("baixo")      // Canal 1 — move +1 no eixo Y
// Aliases EN: move("right"), move("left"), move("up"), move("down")
```

### 2.2 Acoes

```javascript
plantar("tipo")           // Canal 1 — planta cultura com validacoes
colher()                  // Canal 1 — colhe com verificacao de maturidade
prepararSolo("tipo")      // Canal 1 — altera tipo de solo da celula atual
prepararSuperficie("tipo") // Canal 1 — altera superficie da celula atual
// Aliases EN: plant(), harvest(), prepareSoil(), prepareSurface()
```

### 2.3 Sensores (Canal 2 — Retorno Sincrono)

Implementados via `nativeWithReturn()` + `interpreter.nativeToPseudo()`:

```javascript
obterCultura()         // → string | null  — cultura na celula atual
obterSolo()            // → string         — tipo de solo na celula atual
obterSuperficie()      // → string | null  — tipo de superfície da celula atual ("pure", "tilled" ou null)
posicaoX()             // → number         — coordenada X do drone
posicaoY()             // → number         — coordenada Y do drone
verificarMaturidade()  // → boolean        — true se cultura pronta
tamanhoCampoX()        // → number         — largura do campo
tamanhoCampoY()        // → number         — altura do campo
contarItem("tipo")     // → number         — quantidade no inventario
turnoAtual()           // → number         — turno atual
// Aliases EN: getCrop(), getSoilType(), getSurface(), getPosX(), getPosY(), isRipe(),
//             getWorldWidth(), getWorldHeight(), getItemCount(), getCurrentTurn()
```

### 2.4 console (Sandbox Isolado)

Objeto `console` criado como `interpreter.nativeToPseudo({})` — sem vinculo com `window.console`:

```javascript
console.log(...)    // → [LOG]   — saida padrao no Log de Execucao
console.info(...)   // → [LOG]   — saida em azul
console.warn(...)   // → [AVISO] — saida em amarelo
console.error(...)  // → [ERRO]  — saida em vermelho
```

- Aceita multiplos argumentos: `console.log("x:", posicaoX(), "y:", posicaoY())`
- Objetos/arrays exibidos via `JSON.stringify(valor, null, 2)`
- Nenhuma mensagem vaza para o F12 do navegador

### 2.5 Tecnica de Aliasing Bilingue

Todas as funcoes de acao seguem o mesmo padrao de compatibilidade PT/EN. A tecnica tem tres camadas:

**Camada 1 — Registro duplo em `programRunner.js`:**
```javascript
native("prepararSolo",       "setSoilType");  // PT-BR
native("prepareSoil",        "setSoilType");  // EN
native("prepararSuperficie", "setSurface");   // PT-BR
native("prepareSurface",     "setSurface");   // EN
```
Ambos os nomes de funcao enfileiram o mesmo `type` interno — zero duplicacao de logica.

**Camada 2 — `COMMAND_ALIASES` em `gameController.js`:**
```javascript
const COMMAND_ALIASES = {
  prepararSolo:       "setSoilType",
  prepareSoil:        "setSoilType",
  prepararSuperficie: "setSurface",
  prepareSurface:     "setSurface",
  // ... outros
};
```
Garante que chamadas externas (ex: `executeAction("prepararSolo")`) sejam resolvidas corretamente mesmo sem passar pelo programRunner.

**Camada 3 — Mapa de strings em `gameController.js`:**
```javascript
const SOIL_TYPE_MAP = {
  barro: "loam", argila: "clay", lama: "mud", arenoso: "sandy-loam",
  turfa: "peat", silte: "silt",
  loam: "loam", clay: "clay", mud: "mud", "sandy-loam": "sandy-loam",
  peat: "peat", silt: "silt",
};
```
O argumento do jogador (ex: `"argila"`, `"CLAY"`) e normalizado via `.trim().toLowerCase()` antes de ser consultado no mapa. Isso garante case-insensitivity sem ramificacoes de if/else.

**Resultado:** O jogador pode escrever `prepararSolo("ARGILA")`, `prepareSoil("clay")` ou `prepareSoil("Clay")` — todos resultam na mesma operacao interna sem nenhum codigo extra.

### 2.6 Estrutura de Acao Interna (Canal 1)

```javascript
// Comando move("direita") enfileira:
{ type: "move", args: ["direita"] }

// Comando plantar("trigo") enfileira:
{ type: "plant", args: ["trigo"] }

// Comando colher() enfileira:
{ type: "harvest", args: [] }
```

### 2.6 Transpilacao Automatica

`normalizeModernDeclarations()` converte `let`/`const` para `var` antes de passar ao interpretador. Arrow functions e template literals **nao** sao suportados.

---

## 3. LIMITACOES ATUAIS

### 3.1 O que NAO funciona na Sandbox

| Feature | Status | Razao / Nota |
|---|---|---|
| **Math.\* completo** | ❌ Nao injetado | `Math.floor`, `sqrt`, `random`, etc. ausentes — **P0 do roadmap** |
| **Template literals** | ❌ Nao suportado | js-interpreter ES5 nao processa backticks |
| **Promises/async** | ❌ Nao | js-interpreter nao suporta nativamente |
| **DOM access** | ❌ Nao | Nenhum acesso a document/window — por design (seguranca) |
| **Network (fetch)** | ❌ Nao | Nao exposto — por design (seguranca) |
| **setTimeout/setInterval** | ❌ Nao | Nao exposto — loops infinitos incontrolaveis |
| **eval / new Function()** | ❌ Nao | Execucao arbitraria proibida |
| **Multiplos drones** | ❌ Pendente | Upgrade existe na arvore, renderizacao nao implementada — **P1 do roadmap** |
| **Arrow functions** | ⚠️ Instavel | js-interpreter ES5 nao garante suporte |
| **Closures avancadas** | ⚠️ Limitado | Podem nao funcionar em todos os casos |

### 3.2 Por que Essas Limitacoes?

**js-interpreter** e um:
- ✅ Sandbox **seguro** (sem acesso a APIs perigosas)
- ✅ **Preditivel** (cada instrucao executada passo a passo)
- ✅ **Controlavel** (pode pausar/parar a qualquer momento)

Mas e:
- ❌ **Lento** (passo a passo e mais lento que JS nativo)
- ❌ **Limitado** (nao tem acesso ao runtime completo do JS)
- ❌ Sem suporte a **async/await** nativo

---

## 4. O QUE FUNCIONA BEM ATUALMENTE

### 4.1 Codigo Sequencial

```javascript
mover("direita");
plantar("arvore");
mover("baixo");
colher();
```
✅ Funciona perfeitamente.

### 4.2 Variaveis e Condicoes

```javascript
var x = posicaoX();
if (x > 0) {
  mover("esquerda");
}
```
✅ Funciona — sensores retornam valores reais.

### 4.3 Loops com Sensores

```javascript
for (var i = 0; i < tamanhoCampoX(); i = i + 1) {
  var c = obterCultura();
  if (c === null) {
    plantar("capim");
  } else if (verificarMaturidade()) {
    colher();
  }
  if (i < tamanhoCampoX() - 1) { mover("direita"); }
}
```
✅ Funciona — loops com leitura de estado real do mundo.

### 4.4 Funcoes com Debug

```javascript
function plantarLinha(tipo, n) {
  for (var i = 0; i < n; i = i + 1) {
    plantar(tipo);
    console.log("Plantei", tipo, "na coluna", posicaoX());
    if (i < n - 1) { mover("direita"); }
  }
}
plantarLinha("trigo", 4);
```
✅ Funciona — funcoes, loops, sensores e console integrados.

---

## 5. ROADMAP DE EXPANSAO

### P0 — Math.\* na Sandbox (Baixo risco, Alto valor)

Adicionar em `initApi()` de `programRunner.js`:

```javascript
var mathObj = interpreter.nativeToPseudo({
  floor:  Math.floor,
  ceil:   Math.ceil,
  round:  Math.round,
  abs:    Math.abs,
  sqrt:   Math.sqrt,
  min:    Math.min,
  max:    Math.max,
  pow:    Math.pow,
  PI:     Math.PI,
});
interpreter.setProperty(globalObject, "Math", mathObj);
```

**Impacto:** Desbloqueia calculos numericos nos scripts do jogador.

### P1 — Segundo Drone

- `farmWorld.js`: array `positions[]` com posicao por drone
- `gameController.js`: dispatcher por `droneId`
- `threeFarmView.js`: instancia adicional de avatar por drone

### Nao Recomendado (Quebraria Seguranca)

| Proposta | Razao da Recusa |
|----------|----------------|
| Acesso ao `window/document` | Manipulacao da pagina / XSS |
| `fetch` / Network | Exfiltracao de dados |
| `setTimeout/setInterval` | Loops infinitos incontrolaveis |
| `eval` / `new Function()` | Execucao de codigo arbitrario |

---

## 6. RESUMO EXECUTIVO

| Aspecto | Status | Nota |
|---|---|---|
| **Seguranca** | ✅ Excelente | js-interpreter sandbox confiavel, sem vinculo window.console |
| **Movimentacao** | ✅ Completa | `mover("direcao")` parametrizado + aliases EN |
| **Sensores (Canal 2)** | ✅ Completos | 10 sensores PT-BR + 10 aliases EN funcionais |
| **Console debug** | ✅ Completo | 4 niveis, multiplos args, JSON formatado |
| **Validacoes de jogo** | ✅ Completas | Maturidade, feature lock, compatibilidade de solo |
| **Efeitos de upgrades** | ✅ Parcial | Drone/crescimento/yield aplicados; Math.\* pendente |
| **Math.\*** | ❌ Pendente | **P0 do roadmap** |
| **Multiplos drones** | ❌ Pendente | **P1 do roadmap** |
