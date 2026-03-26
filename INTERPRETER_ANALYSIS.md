# Analise do Sistema de Interpretaçao de Código JS

**Data:** 26 de março de 2026  
**Status:** Relatório de análise para expansão de funcionalidades

---

## 1. ARQUITETURA ATUAL

### 1.1 Stack Tecnológico

| Componente | Ferramenta | Versão | Propósito |
|---|---|---|---|
| **Executor de JS** | js-interpreter | 6.0.1 | Sandbox seguro; executa JS de forma controlada |
| **Editor** | Ace Editor | 1.43.6 | Interface de edição de código |
| **Renderização 3D** | Three.js | 0.183.2 | Visualização 3D da plantação |
| **Pipeline** | ES6 Modules | - | Modularização do código |

### 1.2 Fluxo de Execução

```
[editor.getValue()]
        ↓
[createProgramRunner]
        ↓
[new Interpreter(code, initApi)]  ← js-interpreter varre o código
        ↓
[interpreter.step()]  ← executa uma instrução de cada vez
        ↓
[actionQueue.push(action)]  ← acumula ações
        ↓
[onAction(action)]  ← perfomAction() em main.js
        ↓
[result → logger, renderer]
```

---

## 2. ESTADO ATUAL: API EXPOSTA

### 2.1 Funções de Movimento (6 funções)

```javascript
moverDireita()    // move +1 no eixo X (right)
moverEsquerda()   // move -1 no eixo X (left)
moverCima()       // move -1 no eixo Y (up)
moverBaixo()      // move +1 no eixo Y (down)
plantar(cropType) // planta uma cultura no bloco atual
colher()          // colhe a cultura no bloco atual
```

**Compatibilidade:** Aliases em inglês (moveRight, moveLeft, etc.) continuam funcionando.

### 2.2 Estrutura de Ação Interna

```javascript
{
  type: "right" | "left" | "up" | "down" | "plant" | "harvest",
  args: [...]  // argumentos passados (ex: ["arvore"] para plant)
}
```

### 2.3 Fluxo de Função Nativa → Ação

1. **Definição (programRunner.js, linha 20-31):**
   ```javascript
   const native = (name, action) => {
     const fn = (...args) => {
       actionQueue.push({
         type: action,
         args,
       });
     };
     interpreter.setProperty(globalObject, name, interpreter.createNativeFunction(fn));
   };
   ```

2. **Chamada no código do usuário:**
   ```javascript
   moverDireita();  // enfileira ação { type: "right", args: [] }
   plantar("trigo");  // enfileira ação { type: "plant", args: ["trigo"] }
   ```

3. **Processamento (main.js, linha 72-135):**
   ```javascript
   if (actionType === "right") { /* executa movimento */ }
   if (actionType === "plant") { /* checa argumentos e planta */ }
   ```

---

## 3. LIMITAÇÕES ATUAIS

### 3.1 O que NÃO funciona no Sandbox

| Feature | Status | Razão |
|---|---|---|
| **console.log()** | ❌ Não exposto | Intencionalmente não exposto |
| **Math** | ⚠️ Parcial | Disponível via js-interpreter mas com restrições |
| **Arrays/Objects** | ⚠️ Parcial | Funcionam, mas sem mutação avançada |
| **Loops complexos** | ⚠️ Limitado | For/while funcionam, mas lógica inline é restrita |
| **Promises/async** | ❌ Não | js-interpreter não suporta nativamente |
| **DOM access** | ❌ Não | Nenhum acesso ao document/window |
| **Network (fetch)** | ❌ Não | Não exposto; seria segurança |
| **setTimeout/setInterval** | ❌ Não | Não exposto |
| **Closures complexas** | ⚠️ Instável | Podem não funcionar bem |
| **Variáveis globais** | ⚠️ Restrito | Apenas o que expostos via initApi |

### 3.2 Por que Essas Limitações?

**js-interpreter** é um:
- ✅ Sandbox **seguro** (sem acesso a APIs perigosas)
- ✅ **Preditível** (cada instrução é executada passo a passo)
- ✅ **Controlável** (podemos parar/pausar a qualquer momento)

Mas é:
- ❌ **Lento** (passo a passo é mais lento que JS nativo)
- ❌ **Limitado** (não tem acesso ao runtime completo do JS)
- ❌ Sem suporte a **async/await** nativo

---

## 4. O QUE FUNCIONA BEM ATUALMENTE

### 4.1 Código Simples (Sequencial)

```javascript
moverDireita();
plantar("arvore");
moverBaixo();
colher();
```
✅ Funciona perfeitamente - é o caso de uso ideal.

### 4.2 Variáveis e Condições Básicas

```javascript
let x = 5;
if (x > 0) {
  moverDireita();
}
```
✅ Funciona - js-interpreter suporta.

### 4.3 Loops Simples

```javascript
for (let i = 0; i < 3; i++) {
  moverDireita();
  plantar("capim");
}
```
✅ Funciona - loops são suportados.

### 4.4 Funções Básicas

```javascript
function plantar3x() {
  for (let i = 0; i < 3; i++) {
    plantar("trigo");
    moverBaixo();
  }
}
plantar3x();
```
✅ Funciona - funções são suportadas.

---

## 5. ANÁLISE DE OPORTUNIDADES DE EXPANSÃO

### 5.1 Sem Quebrar Segurança (RECOMENDADO)

#### A. Expor mais funções da API do Game

**Proposta:** Adicionar acesso leitura a estado do mundo

```javascript
// Adicionar ao initApi:
function lerPosicao() { return { x: state.x, y: state.y }; }
function lerCultura(x, y) { return /* crop no (x,y) */; }
function lerTerra(x, y) { return /* soil info */; }
function lerTamanhoMundo() { return GRID_SIZE; }
```

**Impacto:**
- ✅ Permite scripts mais inteligentes (condicionais baseadas em estado)
- ✅ Mantém segurança (apenas leitura)
- ⚠️ Pequeno aumento de complexidade

#### B. Expor Math.random()

**Proposta:** Permitir aleatoriedade controlada

```javascript
function aleatorio() { return Math.random(); }
function aleatorioEntre(min, max) { return min + Math.random() * (max - min); }
```

**Impacto:**
- ✅ Permite scripts com comportamento não-determinístico
- ✅ Seguro (usa Math.random() nativo)
- ⚠️ Scripts se tornam menos previsíveis (difícil debugar)

#### C. Expor Data.now() para timers

**Proposta:** Permitir esperar/delay baseado em tempo real

```javascript
function aguardar(ms) { /* pausa por ms milissegundos */ }
function tempoDecorrido() { return Date.now(); }
```

**Impacto:**
- ✅ Permite timing e delays
- ✅ Compatível com sistema de crescimento real
- ⚠️ Pode ser abusado (loops infinitos com delay zero)

#### D. Expor console.log() para debug

**Proposta:** Mostrar logs do código do usuário no logger

```javascript
function log(...args) { 
  onLog("[Script] " + args.join(" ")); 
}
```

**Impacto:**
- ✅ Facilita debugging
- ✅ Seguro (apenas string output)
- ✅ Muito útil para aprendizado

---

### 5.2 Mudanças Moderadas (POSSIVELMENTE)

#### E. Suporte a Arrays/Objects mais rico

**Proposta:** Expor métodos de array

```javascript
// Já funciona:
let arr = [1, 2, 3];
arr.push(4);

// Mas não funciona em js-interpreter:
arr.map(x => x * 2);  // Arrow functions limitadas
```

**Impacto:**
- ⚠️ Arrays funcionam, mas funcionalidades avançadas não
- ⚠️ Aumentaria complexidade de debug
- ⚠️ js-interpreter suporta, mas pode ter bugs

#### F. Suporte a Classes Simples

**Proposta:** Permitir class syntax

```javascript
class Movimento {
  constructor(dx, dy) { this.dx = dx; this.dy = dy; }
}
```

**Impacto:**
- ⚠️ js-interpreter suporta syntax básica
- ⚠️ Mas herança e métodos avançados podem falhar
- ⚠️ Aumenta complexidade de erro

---

### 5.3 NÃO RECOMENDADO (Quebraria Segurança)

#### ❌ Acesso ao window/document
- Permitiria manipular a página
- Risco de malware

#### ❌ Fetch/Network
- Permitiria requisições externas
- Risco de exfiltração de dados

#### ❌ setTimeout/setInterval
- Poderia fazer loops infinitos difíceis de parar
- Efeito colateral fora do controle

#### ❌ Dynamic eval/Function()
```javascript
eval("código arbitrário")  // ❌ NÃO
new Function("código")     // ❌ NÃO
```

---

## 6. PRÓXIMAS MELHORIAS PROPOSTAS (ROADMAP)

### **Fase 1: Sem Risco (Recomendado iniciar)**
- ✅ Expor `log()` para debug (facilita muito)
- ✅ Expor `lerPosicao()` e `lerCultura()` (queries básicas)
- ✅ Expor `Math.random()`

### **Fase 2: Moderado**
- ⚠️ Melhorar suporte a Arrays avançados
- ⚠️ Testar classe simples

### **Fase 3: Futuro (Explorativo)**
- ? Considerar migrar para outro sandbox mais poderoso?
  - **worker-threads** (se Node.js backend)
  - **WebWorker sandbox** (se ficar browser)
  - **V8 isolate** (mais complexo, mais poderoso)

---

## 7. RECOMENDAÇÕES CONCRETAS

### Para começar HOJE (Low risk, High value):

1. **Adicionar `log()`** em `programRunner.js`
   - Linhas: ~31 (após outros natives)
   - Impacto: Imediato no debugging

2. **Adicionar `ler*()` functions** em `programRunner.js`
   - `lerPosicao()` - retorna {x, y}
   - `lerTamanho()` - retorna GRID_SIZE
   - Impacto: Scripts podem ser inteligentes

3. **Testar code samples** com as novas funções
   - Loops com lógica condicional
   - Scripts adaptativos

### Teste de Prova de Conceito (POC):

```javascript
// Exemplo: padrão em zigue-zague
let pos = lerPosicao();
while (pos.x < 7) {
  moverDireita();
  pos = lerPosicao();
  if (pos.x % 2 === 0) {
    plantar("capim");
  }
}
log("Terminei!");
```

---

## 8. ESTRUTURA DO CÓDIGO A MODIFICAR

### Arquivo: `src/core/programRunner.js`

**Seção a modificar:** Função `initApi()` ~linhas 14-31

```javascript
function initApi(interpreter, globalObject) {
  const native = (name, action) => {
    // ... definição ...
  };

  // AQUI: adicionar novas funções
  // native("log", "log");  ← NOVO
  // native("lerPosicao", "readPosition");  ← NOVO
}
```

### Arquivo: `src/main.js`

**Seção a modificar:** Função `performAction()` ~linhas 72-135

```javascript
async function performAction(action) {
  const command = typeof action === "string" ? { type: action, args: [] } : action;
  const actionType = command.type;

  // AQUI: adicionar casos para "log", "readPosition", etc.
  if (actionType === "log") {
    logger.append("[Script] " + (command.args[0] || ""));
    return;
  }
}
```

---

## 9. QUESTÕES ABERTAS (Para Discussão com User)

1. **Prioridade:**
   - Qual é a order de importância? Logging? Query de estado? Ambos?

2. **Complexidade:**
   - Quer suporte a estruturas mais complexas (classes, async)?
   - Ou manter simples por agora?

3. **Documentação:**
   - Como documentar as novas funções aos usuários?
   - Exemplos no editor? Guia expandido?

4. **Testing:**
   - Quer incluir suite de testes automatizados?
   - Ou testar manualmente?

---

## 10. RESUMO EXECUTIVO

| Aspecto | Status | Nota |
|---|---|---|
| **Segurança Atual** | ✅ Excelente | js-interpreter é sandbox confiável |
| **Funcionalidades** | ⚠️ Limitadas | Apenas 6 ações + movimentação |
| **Potencial de Expansão** | ✅ Alto | Muitas oportunidades seguras |
| **Complexidade** | ✅ Baixa | Mudanças simples e incrementais |
| **Risco** | ✅ Baixo | Se seguir Stage 1 |

---

## Próximo Passo

**Aguardando feedback do usuário:**
- Qual funcionalidade começar?
- Qual é o nível desejado de complexidade?
- Há exemplos de scripts que gostaria de rodar?

