# CROP_SYSTEM_GUIDE

Guia objetivo com todos os comandos de teste do sistema atual.

## 1. Comandos do Editor (script do bot)

Estes comandos funcionam dentro do editor de codigo do jogo:

```javascript
moveRight();
moveLeft();
moveUp();
moveDown();
plant("capim");
plant("trigo");
plant("milho");
plant("arvore");
plant("girasol");
plant("morango");
harvest();
```

### Exemplo rapido (editor)

```javascript
moveRight();
plant("capim");
moveDown();
plant("trigo");
moveDown();
plant("arvore");
moveRight();
harvest();
```

## 2. Comandos de Terras (console do navegador)

Hoje, tipos de terra e superficie sao ajustados via API de visualizacao (`view`), no console do navegador.

### 2.1 Tipos de terra disponiveis

- `loam`
- `clay`
- `sandy`
- `peat`
- `silt`

### 2.2 Superficies disponiveis

- `pure`
- `tilled`

### 2.3 Comandos de teste de terra

```javascript
// Mudar tipo de terra em uma celula (x, y)
view.setSoilType(0, 0, "clay");
view.setSoilType(1, 0, "sandy");
view.setSoilType(2, 0, "peat");
view.setSoilType(3, 0, "silt");
view.setSoilType(4, 0, "loam");

// Mudar superficie em uma celula (x, y)
view.setSoilSurface(0, 1, "pure");
view.setSoilSurface(1, 1, "tilled");
```

## 3. Comandos de Plantas (console do navegador)

Tambem e possivel testar plantio direto via API (`view`):

```javascript
// Plantar visualmente em uma celula (x, y)
view.setCrop(0, 2, "capim");
view.setCrop(1, 2, "trigo");
view.setCrop(2, 2, "milho");
view.setCrop(3, 2, "arvore");
view.setCrop(4, 2, "girasol");
view.setCrop(5, 2, "morango");

// Remover cultura (simula colheita visual)
view.setCrop(0, 2, null);
```

## 4. Ajuste de Crescimento (tempo real)

O crescimento e em tempo real e pode ser ajustado em runtime:

```javascript
// Ajuste global (maior que 1 acelera, menor que 1 desacelera)
window.setCropGrowthSettings({ globalTimeScale: 1.5 });

// Ajuste por tipo de planta (tempo em segundos ate maturar)
window.setCropGrowthSettings({
  perCropDurationSeconds: {
    capim: 12,
    trigo: 20,
    milho: 25,
    arvore: 30,
    girasol: 24,
    morango: 18
  }
});

// Combinado
window.setCropGrowthSettings({
  globalTimeScale: 1.2,
  perCropDurationSeconds: {
    capim: 10,
    trigo: 18,
    arvore: 28,
    girasol: 20,
    morango: 14
  }
});
```

## 5. Pacotes de Teste Prontos

### 5.1 Teste de movimentos + plantio (editor)

```javascript
moveRight();
plant("capim");
moveRight();
plant("trigo");
moveRight();
plant("milho");
moveRight();
plant("arvore");
moveRight();
plant("girasol");
moveRight();
plant("morango");
```

### 5.2 Teste de terrenos variados (console)

```javascript
view.setSoilType(0, 0, "loam");
view.setSoilType(1, 0, "clay");
view.setSoilType(2, 0, "sandy");
view.setSoilType(3, 0, "peat");
view.setSoilType(4, 0, "silt");

view.setCrop(0, 0, "capim");
view.setCrop(1, 0, "trigo");
view.setCrop(2, 0, "milho");
view.setCrop(3, 0, "arvore");
view.setCrop(4, 0, "girasol");
view.setCrop(5, 0, "morango");
```

### 5.3 Teste de superficie (console)

```javascript
view.setSoilSurface(0, 1, "pure");
view.setSoilSurface(1, 1, "tilled");
view.setCrop(0, 1, "capim");
view.setCrop(1, 1, "trigo");
```

## 6. Regra de manutencao deste arquivo

Sempre que um novo objeto/cultura for criado, adicionar neste arquivo:

1. Comando de plantio no editor (se existir)
2. Comando de plantio via console (`view.setCrop`)
3. Exemplo de teste rapido completo
4. Ajuste de crescimento (se houver parametros novos)
