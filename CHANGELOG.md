# Changelog — FarmBot Lab

Todas as mudancas relevantes do projeto sao documentadas neste arquivo.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).
Versionamento segue [Semantic Versioning](https://semver.org/).

---

## [1.2.0-beta] — 2026-04-11

### Adicionado

- **API de Solo completa — ações de preparação e sensores de leitura bilíngues**

- **Ações (Canal 1):**
  - `prepararSolo()` / `prepareSoil()` e `prepararSuperficie()` / `prepareSurface()` disponíveis na sandbox
  - Aceita nomes em PT-BR e EN, case-insensitive
  - `prepararSolo("argila")` ≡ `prepareSoil("clay")`, `prepararSolo("barro")` ≡ `prepareSoil("loam")`, etc.
  - `prepararSuperficie("arado")` ≡ `prepareSurface("tilled")`
  - Mensagens de erro e log 100% em PT-BR
  - Feature `api.soil` desbloqueada no nó `n02_plantio` da árvore de missões
  - Implementado via Canal 1 (void/async) — segue exatamente o padrão de `mover()`

- **Sensores (Canal 2):**
  - `obterSuperficie()` / `getSurface()` — retorna tipo de superfície da célula atual (`"pure"`, `"tilled"` ou `null`)
  - Registrados via `nativeWithReturn()` em `programRunner.js`, resolvido em `queryState` de `gameController.js`
  - Lê `soil.extra.surface` do snapshot do `farmWorld`

- **Mapeamentos internos** em `gameController.js`:
  - `SOIL_TYPE_MAP`: barro→loam, argila→clay, lama→mud, arenoso→sandy-loam, turfa→peat, silte→silt (+ aliases EN)
  - `SURFACE_MAP`: puro→pure, arado→tilled (+ aliases EN)

---

## [1.1.0-beta] — 2026-04-11

### Adicionado

- **console sandbox** — objeto `console` isolado disponivel nos scripts do jogador
  - Metodos `.log()`, `.info()`, `.warn()`, `.error()` com suporte a multiplos argumentos
  - Mensagens redirecionadas ao Log de Execucao da UI (nunca ao F12 do navegador)
  - Diferenciacao visual por nivel: `[LOG]` padrao, `[AVISO]` amarelo, `[ERRO]` vermelho
  - Objetos e arrays exibidos via `JSON.stringify` formatado
  - Implementado em `programRunner.js` + `logger.js` + `game.css`

- **Canal 2 — Sensores com retorno sincrono** — nova arquitetura de dois canais no interpretador
  - `nativeWithReturn()` chama `onQuery()` sincronamente e retorna via `interpreter.nativeToPseudo()`
  - Permite condicionais e loops baseados em leitura de estado real do mundo
  - 9 sensores PT-BR + 9 aliases EN disponíveis na sandbox

- **Sensores funcionais na sandbox**:
  - `obterCultura()` / `getCrop()` — tipo de planta ou `null`
  - `obterSolo()` / `getSoilType()` — tipo de solo da celula
  - `posicaoX()` / `getPosX()` — coordenada X do drone
  - `posicaoY()` / `getPosY()` — coordenada Y do drone
  - `verificarMaturidade()` / `isRipe()` — maturidade da cultura atual
  - `tamanhoCampoX()` / `getWorldWidth()` — largura do grid
  - `tamanhoCampoY()` / `getWorldHeight()` — altura do grid
  - `contarItem("tipo")` / `getItemCount("tipo")` — inventario
  - `turnoAtual()` / `getCurrentTurn()` — numero do turno

- **Validacao de maturidade na colheita** — colheita imatura descarta semente e exibe tempo restante em segundos

- **Validacao de desbloqueio de cultura** — `plantar("trigo")` e bloqueado se feature `crop.trigo` nao foi desbloqueada na arvore de missoes

- **Compatibilidade de solo** — cada cultura verifica solos aceitos antes de plantar; incompatibilidade logada com solos validos

- **Efeitos reais de upgrades** via `getModifiers()` em `gameController.js`:
  - `upg.drone.move.speed.t{N}` → reduz duracao da animacao de movimento (20% por tier)
  - `upg.crop.{id}.growth.speed.t{N}` → reduz tempo de maturidade (15% por tier)
  - `upg.crop.{id}.yield.t{N}` → aumenta itens por colheita (N itens)

- **gameController.js** — camada de orquestracao dedicada separando logica de jogo de UI binding

- **Persistencia total (localStorage)** — salva e restaura ao fechar/recarregar:
  - Posicao do drone, culturas com `plantedAt`, estado do solo
  - Progressao (missoes, features, upgrades, inventario)
  - UI (tema, paleta, acento)
  - Formato snapshot v2

### Alterado

- **mover() parametrizado** — substituicao definitiva de `moverDireita/Esquerda/Cima/Baixo()` por `mover("direita")` / `move("right")`; aliases individuais removidos da sandbox
- **Logger** — migrado de `textContent +=` para `appendChild` com spans coloridos por nivel
- Todos os exemplos de codigo em tutoriais, missoes e documentacao atualizados para `mover("direcao")`
- `COMMAND_ALIASES` em `gameController.js` simplificado; entradas de direcao avulsas removidas

### Corrigido

- `CROP_MATURITY_MS` declarado antes dos handlers que o usam (correcao de hoisting com `const`)
- Variavel `key` desnecessaria removida de `queryState`

---

## [1.0.0-beta] — 2026-04-03

### Adicionado

- **Sistema de versao centralizado** em `src/version.js` com `VERSION.toString()` e `VERSION.full()`
- **Badge de versao** na topbar (`#appVersion`)
- **Sistema de fases e missoes** — 12 nos + 20 missoes com curva tutorial → maestria
- **Arvore de Desenvolvimento** — 20 upgrades em duas trilhas: `game` (expansao + culturas) e `code` (linguagem)
- **World Upgrades** — 160+ upgrades: expansao de grid, velocidade/yield de 6 culturas, velocidade de drone
- **Inventario com HUD flutuante** — 6 itens com icones e quantidades
- **Sistema de temas** — 3 temas (claro/floresta/noite), 3 paletas, 13 cores accent; toggle rapido 🌙/☀️
- **Sistema de solo** — estrutura completa por tile: `water`, `nutrients`, `ph`, `organicMatter`, `salinity`, `temperature`
- **Divisor redimensionavel** entre painel de codigo e cena
- **Multiplos avatares** de drone: Drone, Trator, Robo
- **Abas no painel de codigo**: Editor, Referencia API, Configuracoes de aparencia
- **Progresso Rapido** (modal) e **Arvores** (paginas fullscreen)
- **Estatisticas na cena**: movimentos, plantios, colheitas, missao ativa
- **Renderizacao 3D** com Three.js: camera ortografica, crescimento animado de culturas, animacao de movimento

### Alterado

- `programRunner.js` refatorado para arquitetura de dois canais (Canal 1 void + Canal 2 sincrono)
- `normalizeModernDeclarations()` converte `let/const` → `var` antes de passar ao interpretador

---

## [0.x] — Marco 2026

### Adicionado

- Estrutura inicial: grid 2D, farmWorld, renderizacao Three.js basica
- Editor de codigo embutido (Ace Editor)
- Loop de execucao com `requestAnimationFrame`
- Movimentacao basica e plantio/colheita sem validacao
- Missoes e fases iniciais
