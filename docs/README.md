# FarmBot Lab — Documentacao Tecnica

**Versao:** 1.1.0-beta | **Atualizado:** 2026-04-11

Referencia completa da API do jogador, arquitetura interna e sistemas do projeto.

---

## Indice

1. [Arquitetura Geral](#arquitetura-geral)
2. [API do Jogador — Comandos de Acao](#api-do-jogador--comandos-de-acao)
3. [API do Jogador — Sensores](#api-do-jogador--sensores)
4. [Console no Script do Jogador](#console-no-script-do-jogador-sandbox)
5. [Sistema de Culturas e Maturidade](#sistema-de-culturas-e-maturidade)
6. [Persistencia (Save/Load)](#persistencia-saveload)
7. [Sistema de Temas, Paletas e Acentos](#sistema-de-temas-paletas-e-acentos)
8. [Progressao e Upgrades](#progressao-e-upgrades)
9. [API de Debug (Console do Navegador)](#api-de-debug-console-do-navegador)
10. [Referencia de Arquivos](#referencia-de-arquivos)

---

## Arquitetura Geral

### Dois Canais Paralelos

O codigo do jogador roda dentro de uma sandbox ES5 (`js-interpreter 6.0.1`). A comunicacao com o motor do jogo acontece por dois canais:

| Canal | Tipo | Fluxo | Exemplo |
|---|---|---|---|
| **Canal 1 — Acoes** | void, assincrono | `sandbox -> actionQueue -> onAction -> gameController.executeAction()` | `mover("direita")`, `plantar("capim")` |
| **Canal 2 — Sensores** | retorna valor, sincrono | `sandbox -> onQuery -> gameController.queryState() -> nativeToPseudo()` | `obterCultura()`, `posicaoX()` |

### Diagrama de Modulos

```
programRunner.js
  |-- native()           --> actionQueue.push()     --> await onAction()
  |-- nativeWithReturn() --> onQuery() sincrono      --> return nativeToPseudo()
  |
  v
gameController.js
  |-- executeAction()  --> farmWorld + gamePhases + threeFarmView (animacao)
  |-- queryState()     --> farmWorld.getSnapshot() (leitura imediata)
  |
  v
main.js
  |-- Ponte UI: conecta runner/controller + DOM + temas + persistencia
```

### Compatibilidade ES5

O `programRunner.js` inclui um transpilador leve (`normalizeModernDeclarations`) que converte `let` e `const` para `var` antes de passar o codigo ao interpretador. Arrow functions e template literals **nao** sao suportados.

---

## API do Jogador — Comandos de Acao

Comandos entram na fila de acoes. Cada um espera a animacao 3D completar antes do proximo passo do script.

### Movimentacao

| Comando (PT-BR) | Alias (EN) | Descricao |
|---|---|---|
| `mover("direita")` | `move("right")` | Move o drone uma celula para a direita (+X) |
| `mover("esquerda")` | `move("left")` | Move uma celula para a esquerda (-X) |
| `mover("cima")` | `move("up")` | Move uma celula para cima (-Y) |
| `mover("baixo")` | `move("down")` | Move uma celula para baixo (+Y) |

**Comportamento de borda**: ao tentar sair do grid, o drone nao se move e o log exibe "Bateu na borda da fazenda".

### Interacao

| Comando (PT-BR) | Alias (EN) | Argumentos | Descricao |
|---|---|---|---|
| `plantar("tipo")` | `plant("tipo")` | `string`: tipo de cultura | Planta na celula atual do drone |
| `colher()` | `harvest()` | nenhum | Colhe a cultura da celula atual |

**Tipos de cultura aceitos**: `capim`, `trigo`, `milho`, `arvore`, `girasol`, `morango`.

Se nenhum tipo for passado a `plantar()`, o padrao e `"generic"`.

---

## API do Jogador — Sensores

Sensores retornam valores imediatamente (Canal 2 — sincrono). Podem ser usados em variaveis e condicionais.

### Tabela Completa

| Funcao (PT-BR) | Funcao (EN) | Retorno | Descricao |
|---|---|---|---|
| `obterCultura()` | `getCrop()` | `string \| null` | Tipo de planta na celula onde o drone esta. Retorna `null` se vazio. |
| `obterSolo()` | `getSoilType()` | `string` | Tipo de solo na celula atual (`"loam"`, `"clay"`, `"sand"`, etc.) |
| `posicaoX()` | `getPosX()` | `number` | Coordenada X atual do drone (0 = esquerda) |
| `posicaoY()` | `getPosY()` | `number` | Coordenada Y atual do drone (0 = topo) |
| `verificarMaturidade()` | `isRipe()` | `boolean` | `true` se a planta na celula atual atingiu o tempo de maturidade |
| `tamanhoCampoX()` | `getWorldWidth()` | `number` | Largura do campo em colunas |
| `tamanhoCampoY()` | `getWorldHeight()` | `number` | Altura do campo em linhas |
| `contarItem("tipo")` | `getItemCount("tipo")` | `number` | Quantidade de um item especifico no inventario |
| `turnoAtual()` | `getCurrentTurn()` | `number` | Numero do turno atual da simulacao |

### Exemplo — Condicional com Sensor

```javascript
var cultura = obterCultura();
if (cultura === "capim") {
  if (verificarMaturidade()) {
    colher();
  }
} else if (cultura === null) {
  plantar("capim");
}
```

### Exemplo — Loop com Posicao

```javascript
var largura = tamanhoCampoX();
for (var x = 0; x < largura - 1; x = x + 1) {
  plantar("trigo");
  mover("direita");
}
plantar("trigo");
```

### Exemplo — Inventario

```javascript
var capimColetado = contarItem("capim");
if (capimColetado > 10) {
  plantar("trigo");
} else {
  plantar("capim");
}
```

---

## Sistema de Culturas e Maturidade

### Tempos de Maturidade

Cada cultura tem um tempo minimo (em milissegundos reais) entre plantio e colheita. O sensor `verificarMaturidade()` / `isRipe()` compara `Date.now() - plantedAt` com esses valores.

| Cultura | Tempo de Maturidade | Em Segundos |
|---|---|---|
| `capim` | 15.000 ms | 15s |
| `trigo` | 20.000 ms | 20s |
| `milho` | 25.000 ms | 25s |
| `arvore` | 40.000 ms | 40s |
| `girasol` | 18.000 ms | 18s |
| `morango` | 22.000 ms | 22s |

**Origem**: `CROP_MATURITY_MS` em `src/core/gameController.js`.

### Estrutura de uma Cultura no Grid

```javascript
{
  type: "capim",         // Tipo da cultura
  plantedTurn: 3,        // Turno em que foi plantada
  plantedAt: 1712099000  // Timestamp real (Date.now()) para calculo de maturidade
}
```

---

## Persistencia (Save/Load)

### Visao Geral

O jogo salva automaticamente **todo** o estado no `localStorage` ao evento `beforeunload` (fechar/recarregar). Na inicializacao, `restoreGameState()` restaura o estado completo.

**Chave**: `farmbot.gamestate`
**Formato**: JSON v2

### Estrutura do Snapshot

```javascript
{
  version: 2,                    // Versao do formato (compatibilidade futura)
  savedAt: 1712100000000,        // Timestamp do salvamento

  // ── Progressao (gamePhases) ──────────────────
  phases: {
    stats: {
      runs: 5,                   // Total de execucoes
      moves: 42,                 // Total de movimentos
      plants: 18,                // Total de plantios
      harvests: 12,              // Total de colheitas
      plantsByCrop: { capim: 10, trigo: 8 },
      itemsByType: { capim: 8, trigo: 5 }
    },
    unlockedNodeIds: [...],      // Nos da arvore de missoes desbloqueados
    completedNodeIds: [...],     // Nos concluidos
    completedMissionIds: [...],  // Missoes concluidas
    unlockedRewardFeatureIds: [...],   // Features desbloqueadas por missoes
    purchasedWorldUpgradeIds: [...],   // Upgrades de mundo comprados
    purchasedDevUpgradeIds: [...],     // Upgrades de desenvolvimento comprados
    currentWorldSize: { width: 2, height: 2 }
  },

  // ── Mundo (farmWorld snapshot) ───────────────
  world: {
    dimensions: { width: 2, height: 2 },
    position: { x: 1, y: 0 },   // Posicao do drone
    turn: 5,                     // Turno atual
    crops: [                     // Culturas plantadas
      {
        x: 0, y: 0,
        crop: { type: "capim", plantedTurn: 3, plantedAt: 1712099000000 }
      }
    ],
    soils: [                     // Estado do solo por tile
      {
        x: 0, y: 0,
        soil: {
          type: "loam",
          levels: { water: 50, nutrients: 50, ph: 6.5, organicMatter: 30, salinity: 5, temperature: 22 },
          extra: {}
        }
      }
    ]
  },

  // ── Interface ────────────────────────────────
  ui: {
    theme: "floresta",           // Tema ativo
    palette: "earthy-modern",    // Paleta ativa
    accent: "emerald"            // Cor de acento ativa
  }
}
```

### Fluxo de Restauracao

Ao carregar a pagina, `restoreGameState()` executa na sequencia:

1. **Progressao**: `gamePhases.restoreState(saved.phases)` — restaura missoes, upgrades, inventario, stats
2. **Mundo**: `world.restoreSnapshot(saved.world)` — restaura grid, posicao, culturas com timestamps, solo
3. **Renderizacao**: `view.reset(world.getSnapshot())` — reconstroi o cenario 3D com plantas nos estagios corretos (crescimento calculado por `plantedAt` vs `Date.now()`)
4. **UI**: aplica tema, paleta e acento via `applyTheme()`, `applyPalette()`, `applyAccent()`
5. **HUD**: atualiza inventario, stats e arvore de missoes

### Compatibilidade

Saves no formato v1 (sem campo `version`) sao detectados automaticamente — os dados de progressao sao lidos diretamente da raiz do objeto.

---

## Sistema de Temas, Paletas e Acentos

A aparencia do jogo e controlada por tres camadas independentes de variaveis CSS aplicadas ao `<html>`:

### Temas

| Valor (`data-theme`) | Descricao |
|---|---|
| `claro` | Fundo claro, texto escuro (padrao) |
| `floresta` | Tons verdes suaves |
| `noite` | Modo escuro |

### Paletas

| Valor (`data-palette`) | Descricao |
|---|---|
| `neutral-modern` | Cinzas neutros (padrao) |
| `earthy-modern` | Tons terrosos |
| `slate-indigo` | Azul-acinzentado |

### Cores de Acento

13 opcoes: `amber`, `indigo`, `teal` (padrao), `orange`, `emerald`, `ruby`, `sky`, `violet`, `gold`, `lime`, `cyan`, `pink`, `carbon`.

### Como Funciona

```css
/* O seletor composto aplica as variaveis corretas */
[data-theme="noite"][data-palette="earthy-modern"] {
  --color-bg-base: #1a1612;
  --color-bg-gradient-b: #2d261f;
}

[data-accent="emerald"] {
  --color-accent: #10b981;
  --color-accent-hover: #059669;
}
```

As variaveis propagam para todos os componentes (topbar, paineis, modais, botoes) sem necessidade de classes adicionais. Subpaginas (Arvore de Missoes, Desenvolvimento) herdam automaticamente.

### Armazenamento

| Chave localStorage | Valor |
|---|---|
| `farmbot.theme` | Nome do tema |
| `farmbot.palette` | Nome da paleta |
| `farmbot.accent` | Nome do acento |

Tambem salvos no snapshot geral (`ui.theme`, `ui.palette`, `ui.accent`).

---

## Progressao e Upgrades

### Arvore de Missoes

- **12 nos** com dependencias (grafo direcionado)
- **20 missoes** distribuidas pelos nos
- Cada missao tem requisitos baseados em metricas (`moves >= 5`, `plants >= 3`, etc.)
- Ao completar todas as missoes de um no, o no seguinte e desbloqueado
- Missoes concedem features que habilitam novas culturas e mecanicas

### Arvore de Desenvolvimento

Dois ramos:

| Ramo | Conteudo | Niveis |
|---|---|---|
| **Jogo** | Expansao do mundo, culturas, drone, sistema | Variavel |
| **Codigo** | if, while, for, var, functions, params, arrays, Math, async, mastery | 10 |

### World Upgrades (160+)

| Categoria | Exemplo | Tiers |
|---|---|---|
| **Expansao** | `upg.world.size.2x2` a `32x32` | 11 |
| **Culturas (por tipo)** | `upg.crop.capim.growth.speed.t1` | 10 cada |
| **Culturas (yield)** | `upg.crop.trigo.yield.t1` | 10 cada |
| **Drone (movimento)** | `upg.drone.move.speed.t1` | 10 |
| **Drone (trabalho)** | `upg.drone.work.speed.t1` | 10 |

Cada upgrade consome itens do inventario e pode exigir upgrades anteriores como pre-requisito.

### Escala de Expansao do Mundo

```
1x2 -> 2x2 -> 3x3 -> 4x4 -> 6x6 -> 9x9 -> 12x12 -> 16x16 -> 20x20 -> 24x24 -> 28x28 -> 32x32
```

---

## Console no Script do Jogador (Sandbox)

O objeto `console` esta disponivel dentro dos scripts ES5. Todas as mensagens sao redirecionadas ao **Log de Execucao** da UI — nada vai para o F12 do navegador.

| Metodo | Prefixo | Cor no Log |
|--------|---------|-----------|
| `console.log(...)` | `[LOG]` | Padrao |
| `console.info(...)` | `[LOG]` | Azul |
| `console.warn(...)` | `[AVISO]` | Amarelo |
| `console.error(...)` | `[ERRO]` | Vermelho |

- Aceita multiplos argumentos: `console.log("x:", posicaoX(), "y:", posicaoY())`
- Objetos e arrays sao exibidos como JSON formatado (`JSON.stringify`, 2 espacos)
- Implementado via `interpreter.nativeToPseudo({})` em `programRunner.js` — sem vinculo com `window.console`

```javascript
// Exemplo de uso no script do jogador:
var largura = tamanhoCampoX();
console.log("Campo:", largura, "x", tamanhoCampoY());

for (var x = 0; x < largura; x = x + 1) {
  var c = obterCultura();
  if (c === null) {
    plantar("capim");
  } else if (verificarMaturidade()) {
    console.info("Colhendo", c, "em x=" + x);
    colher();
  } else {
    console.warn("Imatura:", c);
  }
  if (x < largura - 1) { mover("direita"); }
}
```

---

## API de Debug (Console do Navegador)

Disponivel via `window.gamePhases` no console do navegador (F12):

| Metodo | Descricao |
|---|---|
| `getCurrent()` | Fase/no atual com stats |
| `getAll()` | Todas as fases |
| `getTree()` | Arvore de missoes completa |
| `getMissions()` | Lista de missoes com status |
| `getActiveMissions(limit)` | Missoes ativas (com limite) |
| `getUnlockedFeatures()` | Features desbloqueadas |
| `getItemInventory()` | Inventario de itens |
| `getWorldState()` | Dimensoes do mundo |
| `getWorldUpgrades()` | Catalogo de upgrades com status |
| `getDevTree()` | Arvore de desenvolvimento |
| `buyWorldUpgrade(id)` | Compra upgrade de mundo |
| `buyDevUpgrade(id)` | Compra upgrade de desenvolvimento |
| `advance()` | Avanca fase manualmente |
| `setPhase(value)` | Define fase especifica |
| `resetProgress(options)` | Reseta progresso |

Hook de crescimento em runtime:

```javascript
window.setCropGrowthSettings({
  globalTimeScale: 2,
  perCropDurationSeconds: { capim: 8 }
})
```

---

## Referencia de Arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/main.js` | Ponte UI: temas, persistencia, eventos DOM, conexao runner/controller |
| `src/core/programRunner.js` | Sandbox ES5: transpilacao let/const, dois canais (native + nativeWithReturn) |
| `src/core/gameController.js` | Orquestracao: executeAction (acoes), queryState (sensores), maturidade |
| `src/core/farmWorld.js` | Estado do mundo: grid, posicao, culturas, solo, turn, snapshot/restore |
| `src/core/gamePhases.js` | Progressao: missoes, upgrades, inventario, features, save/restore |
| `src/render/threeFarmView.js` | Three.js: tiles, avatares (drone/trator/robo), animacao de culturas |
| `src/ui/editor.js` | Wrapper do Ace Editor com suporte a temas |
| `src/ui/logger.js` | Log de execucao — `append()` texto simples, `appendStyled(text, level)` colorido |
| `src/ui/progressionUI.js` | Renderizacao das arvores de missoes e desenvolvimento |
| `src/style.css` | Variaveis CSS de tema/paleta/acento, layout principal |
| `src/game.css` | Estilos do painel de jogo e inventario HUD |
