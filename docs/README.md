# Evolucao do Mundo (Roadmap Incremental)

## Objetivo
Implementar evolucao do mundo por escolha do jogador, sem desbloqueio automatico.
O jogador cumpre requisitos, coleta itens e decide quando/qual melhoria comprar.

## Estado Atual (implementado)
- Desbloqueio final da campanha: ao concluir `m20`, sao liberadas as features:
  - `world.expansion.available`
  - `world.evolution.tier1`
- Inventario simples por itens de colheita (baseado em tipos de cultura colhida).
- Catalogo de melhorias manuais com custo em itens.
- Expansao real de mapa integrada no runtime (mundo + visual 3D), com escala:
  - 1x2 (inicial)
  - 2x2
  - 3x3
  - 4x4
  - 6x6
  - 9x9
  - 12x12
  - 16x16
  - 20x20
  - 24x24
  - 28x28
  - 32x32 (final do primeiro mundo)
- Compra manual via API de debug/prototipo:
  - `window.gamePhases.getItemInventory()`
  - `window.gamePhases.getWorldState()`
  - `window.gamePhases.getWorldUpgrades()`
  - `window.gamePhases.buyWorldUpgrade("upg.world.size.2x2")`

## Regras de desbloqueio e consumo (atual)
- Expansao de mundo (primeiros testes):
  - `2x2`, `3x3` e `4x4` desbloqueiam ao menos com movimentacao do drone (`moves >= 1`).
  - Continuam exigindo compra manual e consumo de itens.
  - `3x3` exige `2x2` comprado; `4x4` exige `3x3` comprado.
- Expansao de mundo (demais niveis):
  - De `6x6` em diante exige feature `world.expansion.available` (liberada ao concluir `m20`).
  - Mantem cadeia sequencial de compra (cada nivel exige o anterior).
  - Mantem custo crescente em itens de colheita.
- Consumo de itens:
  - Itens sao gerados ao colher cultura (`harvest`).
  - Ao comprar upgrade, os itens de custo sao debitados do inventario.
- Demais upgrades (`crop.growth`, `harvest.yield`, `drone.speed`, `debug`, `dialog`):
  - Exigem feature `world.evolution.tier1`.
  - Tambem sao compra manual com consumo de itens.
  - Efeitos reais ainda entram em etapas futuras (por enquanto base de progressao + economia).

## Melhorias Planejadas (futuras)
1. Aplicar efeito real de velocidade de crescimento nas culturas.
2. Aplicar efeito real de rendimento por colheita.
3. Aplicar efeito real de velocidade do drone para acoes.
4. Painel visual dedicado para loja/evolucao de mundo na UI.
5. Sistema de dialogos orientando escolhas de upgrade.
6. Debug avancado (telemetria de script, metricas de execucao, causas de falha).

## Diretriz de implementacao
- Evoluir em passos pequenos.
- Testar a cada passo para evitar regressao.
- Manter compatibilidade com o sistema de fases/missoes existente.
