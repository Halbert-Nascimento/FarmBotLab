# FarmBot Lab

Replica didatica inspirada em The Farmer Was Replaced para treino de JavaScript no navegador, com visual 3D, missões progressivas e árvore de desenvolvimento com upgrades manuais.

## Visão Geral

O projeto combina:

- Editor de código no navegador
- Execução sandbox de scripts JavaScript
- Simulação de fazenda em grade 2D com visual 3D
- Progressão por missões (aprendizado de lógica)
- Progressão por upgrades (expansão e evolução manual)

Objetivo: praticar automação e raciocínio algorítmico em um ambiente visual e incremental.

## Funcionalidades Atuais

- Cena 3D com Three.js (câmera ortográfica)
- Controle de zoom e seleção de avatar
- Editor com Ace Editor
- Runtime de scripts com JS-Interpreter (compatibilidade ES5)
- API de automação em pt-BR com aliases legados em inglês
- HUD de inventário com modo compacto/expandido
- Árvore de missões com nós, metas e desbloqueios
- Árvore de desenvolvimento separada com cards progressivos
- Upgrades manuais por trilhas (mundo, culturas, drone e sistema)
- Mensagens de bloqueio com orientação de desbloqueio
- Hooks globais para inspeção e debug via console

## Stack

- HTML + CSS + JavaScript (ES Modules)
- Three.js (renderização)
- Ace Editor (edição de código)
- JS-Interpreter (execução segura de scripts)

## Como Rodar Localmente

Pré-requisitos:

- Navegador moderno
- Python 3 (ou outro servidor estático)

Passos:

1. Abra a pasta do projeto no VS Code.
2. Na raiz do projeto, rode um servidor local.

PowerShell:

```powershell
python -m http.server 5500
```

3. Abra no navegador:

```txt
http://localhost:5500
```

## Como Usar

1. Escreva um script no editor.
2. Clique em Executar.
3. Observe movimentação, plantio, colheita e logs.
4. Acompanhe progresso em:
   - Progresso Rápido
   - Árvore de Missões
   - Árvore de Desenvolvimento
5. Compre upgrades quando os requisitos forem atendidos.

## API de Script

Comandos principais (pt-BR):

- moverDireita()
- moverEsquerda()
- moverCima()
- moverBaixo()
- plantar(tipo)
- colher()

Compatibilidade legada:

- moveRight(), moveLeft(), moveUp(), moveDown(), plant(), harvest()

Exemplo:

```javascript
moverDireita();
plantar("capim");
moverBaixo();
colher();
```

## Progressão

O projeto possui duas camadas de progressão:

- Árvore de Missões e Desbloqueios:
  - focada em aprendizado de lógica e metas de execução
- Árvore Completa de Desenvolvimento:
  - focada em upgrades manuais e evolução do jogo

No ramo de jogo, os upgrades estão organizados visualmente em blocos:

- Expansão
- Culturas
- Drone
- Sistema

## Estrutura do Projeto

```txt
.
├─ index.html
├─ README.md
├─ src/
│  ├─ main.js
│  ├─ style.css
│  ├─ core/
│  │  ├─ farmWorld.js
│  │  ├─ gamePhases.js
│  │  └─ programRunner.js
│  ├─ render/
│  │  └─ threeFarmView.js
│  └─ ui/
│     ├─ editor.js
│     ├─ logger.js
│     └─ progressionUI.js
└─ docs/
```

## Debug e Inspeção

No console do navegador, existe a API global window.gamePhases para inspeção e prototipagem:

- getCurrent()
- getAll()
- getTree()
- getMissions()
- getActiveMissions(limit)
- getUnlockedFeatures()
- getItemInventory()
- getWorldState()
- getWorldUpgrades()
- getDevTree()
- buyWorldUpgrade(id)
- buyDevUpgrade(id)
- advance()
- setPhase(value)
- resetProgress(options)

Também há um hook para ajuste de crescimento em runtime:

- window.setCropGrowthSettings(patch)

## Limitações Conhecidas

- O runtime usa JS-Interpreter (base ES5). O projeto converte let/const para var automaticamente na execução.
- Parte dos efeitos de upgrades é estrutural/progressiva e pode depender de implementação visual/mecânica futura para impacto completo no mundo.

## Documentação Complementar

- [GAME_PROGRESSION_V1.md](GAME_PROGRESSION_V1.md)
- [CROP_SYSTEM_GUIDE.md](CROP_SYSTEM_GUIDE.md)
- [INTERPRETER_ANALYSIS.md](INTERPRETER_ANALYSIS.md)
- [docs/README.md](docs/README.md)

## Status

Projeto em evolução contínua, com foco em clareza didática, progressão incremental e experimentação rápida de automação por código.
