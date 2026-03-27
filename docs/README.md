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
- Compra manual via API de debug/prototipo:
  - `window.gamePhases.getItemInventory()`
  - `window.gamePhases.getWorldUpgrades()`
  - `window.gamePhases.buyWorldUpgrade("upg.world.expansion.t1")`

## Melhorias Planejadas (futuras)
1. Expansao real do mapa (ex.: 8x8 -> 10x10 -> 12x12).
2. Aplicar efeito real de velocidade de crescimento nas culturas.
3. Aplicar efeito real de rendimento por colheita.
4. Aplicar efeito real de velocidade do drone para acoes.
5. Painel visual dedicado para loja/evolucao de mundo na UI.
6. Sistema de dialogos orientando escolhas de upgrade.
7. Debug avancado (telemetria de script, metricas de execucao, causas de falha).

## Diretriz de implementacao
- Evoluir em passos pequenos.
- Testar a cada passo para evitar regressao.
- Manter compatibilidade com o sistema de fases/missoes existente.
