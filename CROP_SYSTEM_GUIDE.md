# CROP_SYSTEM_GUIDE

Guia objetivo com todos os comandos de teste do sistema — versao 1.1.0-beta.

## 1. Comandos do Editor (script do bot)

Estes comandos funcionam dentro do editor de codigo do jogo:

```javascript
// Movimentacao parametrizada (padrao atual)
mover("direita");
mover("esquerda");
mover("cima");
mover("baixo");

// Acoes
plantar("capim");
plantar("trigo");
plantar("milho");
plantar("arvore");
plantar("girasol");
plantar("morango");
colher();
```

> Alias EN: `move("right")`, `move("left")`, `move("up")`, `move("down")`, `plant("tipo")`, `harvest()`.

### Exemplo rapido (editor)

```javascript
mover("direita");
plantar("capim");
mover("baixo");
plantar("trigo");
mover("baixo");
plantar("arvore");
mover("direita");
colher();
```

---

## 2. Sensores (Retornam Valores)

Sensores sao sincronos — retornam o valor imediatamente e podem ser usados em variaveis e condicionais.

| Sensor PT-BR | Sensor EN | Retorno | Descricao |
|---|---|---|---|
| `obterCultura()` | `getCrop()` | `string \| null` | Tipo de planta na celula atual ou `null` se vazia |
| `obterSolo()` | `getSoilType()` | `string` | Tipo de solo: `"loam"`, `"clay"`, `"sandy-loam"`, etc. |
| `posicaoX()` | `getPosX()` | `number` | Coordenada X do drone (0 = esquerda) |
| `posicaoY()` | `getPosY()` | `number` | Coordenada Y do drone (0 = topo) |
| `verificarMaturidade()` | `isRipe()` | `boolean` | `true` se a cultura esta pronta para colher |
| `tamanhoCampoX()` | `getWorldWidth()` | `number` | Largura do campo (colunas) |
| `tamanhoCampoY()` | `getWorldHeight()` | `number` | Altura do campo (linhas) |
| `contarItem("tipo")` | `getItemCount("tipo")` | `number` | Quantidade de um item no inventario |
| `turnoAtual()` | `getCurrentTurn()` | `number` | Numero do turno atual |

### Exemplos reais de uso de sensores

```javascript
// Ler e logar a cultura da celula atual
console.log("Cultura aqui:", obterCultura());

// Ler posicao
console.log("Posicao:", posicaoX(), posicaoY());

// Condicional com sensor
var cultura = obterCultura();
if (cultura !== null && verificarMaturidade()) {
  colher();
} else if (cultura === null) {
  plantar("capim");
}

// Tamanho do campo
console.log("Campo:", tamanhoCampoX(), "x", tamanhoCampoY());

// Inventario
console.log("Capim coletado:", contarItem("capim"));

// Solo atual
console.log("Solo:", obterSolo());
```

---

## 3. Debug In-Game (console)

O objeto `console` esta disponivel nos scripts do editor. Todas as mensagens aparecem no **Log de Execucao** da UI — nada vai para o F12 do navegador.

| Metodo | Prefixo | Cor |
|--------|---------|-----|
| `console.log(...)` | `[LOG]` | padrao |
| `console.info(...)` | `[LOG]` | azul |
| `console.warn(...)` | `[AVISO]` | amarelo |
| `console.error(...)` | `[ERRO]` | vermelho |

Aceita **multiplos argumentos** e converte objetos/arrays automaticamente.

### Exemplos de debug

```javascript
// Log basico
var x = posicaoX();
var y = posicaoY();
console.log("Posicao atual:", x, y);

// Aviso condicional
if (x > 3) {
  console.warn("Drone longe da origem!");
}

// Erro ao detectar problema
var solo = obterSolo();
if (solo === "clay") {
  console.error("Solo incompativel para esta cultura!");
}

// Logar cultura e maturidade
var c = obterCultura();
console.log("Cultura:", c, "| Madura:", verificarMaturidade());

// Ciclo com log de progresso
var largura = tamanhoCampoX();
for (var i = 0; i < largura; i = i + 1) {
  plantar("capim");
  console.info("Plantei na coluna", i);
  if (i < largura - 1) { mover("direita"); }
}
```

---

## 4. Comandos de Terras (console do navegador)

Tipos de terra e superficie sao ajustados via API de visualizacao (`view`), no console do navegador (F12).

### 4.1 Tipos de terra disponiveis

- `loam` — aceito pela maioria das culturas
- `clay` — aceito por trigo, milho, girasol
- `sandy-loam` — aceito por milho, girasol, morango
- `peat`
- `silt`

### 4.2 Superficies disponiveis

- `pure`
- `tilled`

### 4.3 Comandos de teste de terra

```javascript
// Mudar tipo de terra em uma celula (x, y)
view.setSoilType(0, 0, "clay");
view.setSoilType(1, 0, "sandy-loam");
view.setSoilType(2, 0, "peat");
view.setSoilType(3, 0, "silt");
view.setSoilType(4, 0, "loam");

// Mudar superficie em uma celula (x, y)
view.setSoilSurface(0, 1, "pure");
view.setSoilSurface(1, 1, "tilled");
```

---

## 5. Comandos de Plantas (console do navegador)

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

---

## 6. Ajuste de Crescimento (tempo real)

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
```

Tempos de maturidade base (sem upgrades): capim 15s, trigo 20s, girasol 18s, morango 22s, milho 25s, arvore 40s.

---

## 7. Pacotes de Teste Prontos

### 7.1 Teste de movimentos + plantio + sensores (editor)

```javascript
mover("direita");
plantar("capim");
console.log("Plantei:", obterCultura());
mover("direita");
plantar("trigo");
mover("direita");
plantar("milho");
mover("direita");
plantar("arvore");
mover("direita");
plantar("girasol");
mover("direita");
plantar("morango");
```

### 7.2 Varredura com sensores e debug

```javascript
var largura = tamanhoCampoX();
var altura = tamanhoCampoY();
console.log("Campo:", largura, "x", altura);

for (var y = 0; y < altura; y = y + 1) {
  for (var x = 0; x < largura; x = x + 1) {
    var c = obterCultura();
    if (c === null) {
      plantar("capim");
      console.info("Plantei capim em", x, y);
    } else if (verificarMaturidade()) {
      colher();
      console.log("Colhi", c, "em", x, y);
    } else {
      console.warn("Imatura:", c, "em", x, y);
    }
    if (x < largura - 1) { mover("direita"); }
  }
  if (y < altura - 1) {
    mover("baixo");
    for (var v = 0; v < largura - 1; v = v + 1) {
      mover("esquerda");
    }
  }
}
console.log("Capim coletado:", contarItem("capim"));
```

### 7.3 Teste de terrenos variados (console do navegador)

```javascript
view.setSoilType(0, 0, "loam");
view.setSoilType(1, 0, "clay");
view.setSoilType(2, 0, "sandy-loam");
view.setSoilType(3, 0, "peat");
view.setSoilType(4, 0, "silt");

view.setCrop(0, 0, "capim");
view.setCrop(1, 0, "trigo");
view.setCrop(2, 0, "milho");
view.setCrop(3, 0, "arvore");
view.setCrop(4, 0, "girasol");
view.setCrop(5, 0, "morango");
```

---

## 8. Regra de manutencao deste arquivo

Sempre que um novo objeto/cultura for criado, adicionar neste arquivo:

1. Comando de plantio no editor (se existir)
2. Sensor de leitura relacionado (se houver)
3. Exemplo com console.log() mostrando o comportamento esperado
4. Comando de plantio via console (`view.setCrop`)
5. Ajuste de crescimento (se houver parametros novos)
