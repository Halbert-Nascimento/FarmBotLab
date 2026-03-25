# FarmBot Lab (MVP)

Replica didatica inspirada em The Farmer Was Replaced para treinar JavaScript no navegador.

## Como rodar

1. Abra a pasta do projeto no VS Code.
2. Rode um servidor local simples na raiz do projeto.

PowerShell:

```powershell
python -m http.server 5500
```

3. Abra no navegador:

```txt
http://localhost:5500
```

## O que ja tem

- Cena 3D com Three.js em camera ortografica (estilo isometrico)
- Zoom por slider
- Editor de codigo com CodeMirror 6
- Execucao segura de JavaScript com JS-Interpreter
- API basica para controlar o bot:
  - moveRight()
  - moveLeft()
  - moveUp()
  - moveDown()
  - plant()
  - harvest()
- Log de execucao

## Proximos passos recomendados

- Adicionar energia/combustivel e custo por acao
- Criar objetivos por fase
- Implementar inventario e tipos de planta
- Salvar progresso em LocalStorage
- Migrar para React + Zustand quando a base de mecanicas estiver estavel
