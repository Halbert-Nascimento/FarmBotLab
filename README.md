# FarmBot Lab

Replica didatica inspirada em **The Farmer Was Replaced** para treino de JavaScript no navegador, com visual 3D, missoes progressivas e arvore de desenvolvimento com upgrades manuais.

---

## Visao Geral

O projeto combina:

- Editor de codigo no navegador (Ace Editor)
- Execucao sandbox de scripts JavaScript (ES5)
- Simulacao de fazenda em grade 2D com visual 3D (Three.js)
- Progressao por missoes (aprendizado de logica)
- Progressao por upgrades (expansao e evolucao manual)
- Persistencia total de estado entre sessoes (localStorage)

Objetivo: praticar automacao e raciocinio algoritmico em um ambiente visual e incremental.

---

## Stack

| Tecnologia | Funcao |
|---|---|
| **HTML5 + CSS3** | Estrutura e interface (temas, paletas, acentos) |
| **JavaScript (ES Modules)** | Logica do jogo, UI, orquestracao |
| **Three.js** | Renderizacao 3D (camera ortografica, avatares, culturas animadas) |
| **Ace Editor** | Editor de codigo embutido |
| **JS-Interpreter 6.0.1** | Sandbox ES5 para execucao segura dos scripts do jogador |
| **localStorage** | Persistencia completa de estado do jogo entre sessoes |

---

## Arquitetura do Interpretador — Dois Canais Paralelos

O codigo do jogador roda dentro de uma sandbox ES5 (`js-interpreter`) e se comunica com o motor do jogo atraves de dois canais distintos:

```
Codigo do Jogador (sandbox ES5)
        |
        |-- moverDireita()  -->  Canal 1: actionQueue (void, assincrono)
        |                         programRunner --> gameController.executeAction()
        |                         Executa acao no mundo + anima no Three.js
        |
        |-- obterCultura()  -->  Canal 2: onQuery (retorna valor, sincrono)
                                  programRunner --> gameController.queryState()
                                  Retorna primitivo via interpreter.nativeToPseudo()
```

### Canal 1 — Acoes (void, assincrono)

Comandos como `moverDireita()` e `plantar("capim")` entram em uma fila (`actionQueue`). O loop principal do runner processa um comando por vez, aguardando a animacao 3D antes de continuar a execucao do script.

### Canal 2 — Sensores (retorno sincrono)

Funcoes como `obterCultura()` chamam `onQuery()` diretamente, sem passar pela fila. O retorno e imediato e convertido para o formato da sandbox via `interpreter.nativeToPseudo()`. Isso permite que o jogador escreva condicionais reais:

```javascript
var cultura = obterCultura();
if (cultura === "capim") {
  colher();
} else {
  plantar("trigo");
}
```

### Fluxo de Modulos

```
main.js (ponte UI)
  |-- createProgramRunner()    // interpreta codigo do jogador
  |     |-- onAction  -->  gameController.executeAction()  // Canal 1
  |     |-- onQuery   -->  gameController.queryState()     // Canal 2
  |
  |-- createGameController()   // orquestra world + gamePhases + view
  |     |-- farmWorld          // estado do grid, posicao, culturas, solo
  |     |-- gamePhases         // missoes, upgrades, inventario, progressao
  |     |-- threeFarmView      // renderizacao 3D, animacao
```

---

## Guia de Inicio Rapido

### Como Rodar Localmente

Pre-requisitos: navegador moderno + servidor estatico.

```powershell
# Na raiz do projeto:
python -m http.server 5500
```

Abra `http://localhost:5500` no navegador.

### Primeiro Script

```javascript
moverDireita();
plantar("capim");
moverBaixo();
colher();
```

### Script Avancado — Colheita Inteligente

Este script percorre todo o campo, planta onde esta vazio e colhe apenas culturas maduras:

```javascript
var largura = tamanhoCampoX();
var altura  = tamanhoCampoY();

for (var y = 0; y < altura; y = y + 1) {
  for (var x = 0; x < largura; x = x + 1) {
    var cultura = obterCultura();
    if (cultura !== null) {
      if (verificarMaturidade()) {
        colher();
      }
    } else {
      plantar("capim");
    }
    if (x < largura - 1) {
      moverDireita();
    }
  }
  if (y < altura - 1) {
    moverBaixo();
    for (var voltar = 0; voltar < largura - 1; voltar = voltar + 1) {
      moverEsquerda();
    }
  }
}
```

---

## API de Script

### Comandos de Acao

| PT-BR | EN | Descricao |
|---|---|---|
| `moverDireita()` | `moveRight()` | Move o drone uma celula para a direita |
| `moverEsquerda()` | `moveLeft()` | Move para a esquerda |
| `moverCima()` | `moveUp()` | Move para cima |
| `moverBaixo()` | `moveDown()` | Move para baixo |
| `plantar("tipo")` | `plant("tipo")` | Planta na celula atual (capim, trigo, milho, arvore, girasol, morango) |
| `colher()` | `harvest()` | Colhe o que esta na celula atual |

### Sensores (Retornam Valores)

| PT-BR | EN | Retorno | Descricao |
|---|---|---|---|
| `obterCultura()` | `getCrop()` | `string \| null` | Tipo de planta na celula atual |
| `obterSolo()` | `getSoilType()` | `string` | Tipo de solo na celula atual |
| `posicaoX()` | `getPosX()` | `number` | Coordenada X do drone |
| `posicaoY()` | `getPosY()` | `number` | Coordenada Y do drone |
| `verificarMaturidade()` | `isRipe()` | `boolean` | `true` se a planta esta pronta para colher |
| `tamanhoCampoX()` | `getWorldWidth()` | `number` | Largura do campo (colunas) |
| `tamanhoCampoY()` | `getWorldHeight()` | `number` | Altura do campo (linhas) |
| `contarItem("tipo")` | `getItemCount("tipo")` | `number` | Quantidade do item no inventario |
| `turnoAtual()` | `getCurrentTurn()` | `number` | Numero do turno atual |

---

## Sistema de Temas e Personalizacao

A interface e controlada por tres camadas de variaveis CSS, todas selecionaveis na aba Configuracoes:

| Camada | Atributo HTML | Opcoes |
|---|---|---|
| **Tema** | `data-theme` | `claro`, `floresta`, `noite` |
| **Paleta** | `data-palette` | `neutral-modern`, `earthy-modern`, `slate-indigo` |
| **Acento** | `data-accent` | 13 cores (amber, indigo, teal, orange, emerald, ruby, sky, violet, gold, lime, cyan, pink, carbon) |

Toggle rapido: botao na topbar alterna entre `noite` e o ultimo tema claro usado.

---

## Persistencia de Estado

O jogo salva automaticamente todo o progresso no `localStorage` ao fechar/recarregar a pagina.

### Estrutura do Snapshot (v2)

```json
{
  "version": 2,
  "savedAt": 1712100000000,
  "phases": {
    "stats": { "runs": 5, "moves": 42, "plants": 18, "harvests": 12, "plantsByCrop": {}, "itemsByType": {} },
    "unlockedNodeIds": ["n01_inicio", "n02_plantio"],
    "completedNodeIds": ["n01_inicio"],
    "completedMissionIds": ["m01", "m02", "m03"],
    "unlockedRewardFeatureIds": ["crop.capim"],
    "purchasedWorldUpgradeIds": ["upg.world.size.2x2"],
    "purchasedDevUpgradeIds": [],
    "currentWorldSize": { "width": 2, "height": 2 }
  },
  "world": {
    "dimensions": { "width": 2, "height": 2 },
    "position": { "x": 1, "y": 0 },
    "turn": 5,
    "crops": [
      { "x": 0, "y": 0, "crop": { "type": "capim", "plantedTurn": 3, "plantedAt": 1712099000000 } }
    ],
    "soils": [
      { "x": 0, "y": 0, "soil": { "type": "loam", "levels": { "water": 50, "nutrients": 50, "ph": 6.5, "organicMatter": 30, "salinity": 5, "temperature": 22 }, "extra": {} } }
    ]
  },
  "ui": {
    "theme": "floresta",
    "palette": "earthy-modern",
    "accent": "emerald"
  }
}
```

### O que e restaurado

| Dado | Restaurado |
|---|---|
| Posicao do drone (X, Y) | Sim |
| Culturas plantadas com timestamps | Sim |
| Estagio de crescimento visual | Sim (recalculado pelo `plantedAt` vs `Date.now()`) |
| Estado do solo por tile | Sim |
| Missoes, nos e features desbloqueadas | Sim |
| Upgrades comprados (mundo + dev) | Sim |
| Inventario de itens | Sim |
| Tema, paleta e cor de acento | Sim |
| Dimensoes do grid | Sim |

---

## Progressao

O projeto possui duas camadas de progressao:

- **Arvore de Missoes e Desbloqueios**: focada em aprendizado de logica e metas de execucao (12 nos, 20 missoes)
- **Arvore de Desenvolvimento**: focada em upgrades manuais e evolucao do jogo

### Upgrades organizados por trilha

- **Expansao**: grid de 1x2 ate 32x32
- **Culturas**: velocidade de crescimento, rendimento por colheita (10 tiers por cultura)
- **Drone**: velocidade de movimento e trabalho (10 tiers cada)
- **Sistema**: debug e dialogos

---

## Estrutura do Projeto

```
.
├── index.html
├── README.md
├── src/
│   ├── main.js                    # Ponte UI, temas, persistencia
│   ├── style.css                  # Estilos, variaveis de tema/paleta/acento
│   ├── game.css                   # Estilos do painel de jogo e inventario
│   ├── core/
│   │   ├── farmWorld.js           # Estado do grid, posicao, culturas, solo
│   │   ├── gameController.js      # Orquestracao: acao + progressao + sensores
│   │   ├── gamePhases.js          # Missoes, upgrades, inventario, persistencia
│   │   └── programRunner.js       # Sandbox ES5, dois canais (acao + query)
│   ├── render/
│   │   └── threeFarmView.js       # Three.js, avatares, animacao de culturas
│   └── ui/
│       ├── editor.js              # Ace Editor wrapper
│       ├── logger.js              # Log de execucao
│       └── progressionUI.js       # Arvores de missoes e desenvolvimento
└── docs/
    ├── README.md                  # Documentacao tecnica / API detalhada
    ├── auditoria.md               # Auditoria de paridade vs. jogo original
    └── RELATORIO_V1.md
```

---

## Debug e Inspecao

No console do navegador, a API global `window.gamePhases` permite inspecao e prototipagem:

```javascript
window.gamePhases.getCurrent()
window.gamePhases.getItemInventory()
window.gamePhases.getWorldUpgrades()
window.gamePhases.buyWorldUpgrade("upg.world.size.2x2")
window.gamePhases.getDevTree()
window.gamePhases.buyDevUpgrade(id)
window.gamePhases.resetProgress()
```

Hook de crescimento em runtime:

```javascript
window.setCropGrowthSettings({ globalTimeScale: 2, perCropDurationSeconds: { capim: 8 } })
```

---

## Limitacoes Conhecidas

- O runtime usa JS-Interpreter (base ES5). `let/const` sao convertidos para `var` automaticamente.
- Parte dos efeitos de upgrades (velocidade de crescimento, yield, velocidade de drone) esta estruturada mas ainda nao conectada ao runtime — consulte [docs/auditoria.md](docs/auditoria.md) para o plano de implementacao.
- Template literals (backticks) nao sao suportados na sandbox.

---

## Documentacao Complementar

- [docs/README.md](docs/README.md) — Documentacao tecnica e API detalhada
- [docs/auditoria.md](docs/auditoria.md) — Auditoria de paridade vs. The Farmer Was Replaced

---

## Status

Projeto em evolucao continua, com foco em clareza didatica, progressao incremental e experimentacao rapida de automacao por codigo.
