# Sistema de Plantas 3D com Crescimento Progressivo

## 📌 Visão Geral

Um sistema completo de cultivo foi implementado, onde **plantas crescem progressivamente** de forma visual e realista, passando por fases naturais de desenvolvimento. As plantas:

✅ São objetos 3D (folhas radiais que crescem)
✅ Crescem de forma **progressiva e contínua** (não em degraus)
✅ Mudam de cor conforme amadurecem
✅ Passam por fases: semente → broto → média → madura → pronta para colheita
✅ Começam com o capim (primeira implementação)

---

## 🌱 Arquitetura do Sistema

### Arquivos Criados/Modificados

```
src/render/
├── cropGrowthSystem.js ............ [NOVO] Sistema de crescimento e modelos 3D
└── threeFarmView.js .............. [MODIFICADO] Integração de plantas 3D

src/
├── main.js ........................ [MODIFICADO] Avanço de turns e sincronização
```

---

## 🔍 Como Funciona - Explicação Detalhada

### 1️⃣ **Configuração de Plantas** (`cropGrowthSystem.js`)

```javascript
const CROP_CONFIGS = {
  capim: {
    type: "capim",
    displayName: "Capim",
    color: { young: "#7cb342", mature: "#558b2f", harvestReady: "#33691e" },
    baseHeight: 0.35,           // Altura máxima em unidades 3D
    growthDays: 15,             // Dias (turns) até ficar pronto para colheita
    leafCount: 8,               // Número de folhas
    waveAmplitude: 0.15,        // Oscilação pelo "vento"
    waveFrequency: 0.8,
    density: 1.2,
  },
  // ... trigo, milho (infraestrutura pronta para futuro)
}
```

**Cada configuração define:**
- **Cores**: Progressão de cores conforme cresce
- **Altura**: Tamanho final da planta quando madura
- **Crescimento**: Dias/turns necessários para ficar pronta
- **Visuais**: Número de folhas, movimento, densidade

---

### 2️⃣ **Cálculo de Progresso de Crescimento**

```javascript
function calculateGrowthProgress(plantedTurn, currentTurn, growthDays) {
  const ageInDays = currentTurn - plantedTurn;
  const progress = Math.min(1.0, Math.max(0.0, ageInDays / growthDays));
  return progress;  // Retorna: 0.0 (semente) até 1.0 (pronta)
}
```

**Magicamente, isso transforma:**
- Turn 0 (plantado): `progress = 0.0` → Invisível (semente)
- Turn 3-5: `progress = 0.2-0.33` → Broto pequeno emerge
- Turn 8: `progress = 0.53` → Planta média
- Turn 12: `progress = 0.8` → Quase pronta
- Turn 15: `progress = 1.0` → Pronta para colheita ✅

---

### 3️⃣ **Geração de Modelos 3D Procedurais**

A planta é criada como um **grupo de folhas dispostas radialmente**:

```javascript
function createCropModel(cropType, growthProgress, posX, posZ, seed) {
  // 1. Determina altura atual baseada no progresso
  const currentHeight = config.baseHeight * easedProgress;
  
  // 2. Interpola cor (verde claro → verde escuro)
  const currentColor = interpolateGrowthColor(growthProgress, ...);
  
  // 3. Cria folhas dispostas em círculo (radial pattern)
  for (let i = 0; i < config.leafCount; i++) {
    const leaf = createLeaf(currentHeight, currentColor);
    // Posiciona folha em ângulo: (i / leafCount) * 360°
    leaf.rotation.y = (i / leafCount) * Math.PI * 2;
    cropGroup.add(leaf);
  }
  
  return cropGroup;  // Retorna planta 3D pronta para renderizar
}
```

**Cada folha:**
- É um plano (PlaneGeometry) com material MeshStandardMaterial
- Começa invisível (scale 0) na fase semente
- Cresce suavemente até tamanho total
- Oscila levemente (animação de "vento")

---

### 4️⃣ **Integração com Renderizador** (`threeFarmView.js`)

#### Dentro da função `createThreeFarmView()`:

```javascript
// Novas variáveis:
const cropModels = new Map();      // Armazena plantas: "x:y" → {group, cropType, turn}
let cropsGroup = null;             // Container 3D para plantas
let currentGameTurn = 0;           // Turn atual (incrementa com ações)

// Container criado e adicionado à cena:
cropsGroup = new THREE.Group();
farmGroup.add(cropsGroup);
```

#### Modificação em `setCrop(x, y, cropType)`:

```javascript
function setCrop(x, y, cropType) {
  // ... código existente ...
  
  if (cropType) {
    // Cria modelo 3D quando planta é semeada
    const wp = gridToWorld(x, y, gridSize);
    const cropGroup = createCropModel(
      cropType,
      0.0,        // Começa no progresso 0 (semente)
      wp.x, wp.z,
      x * 73856093 ^ y * 19349663  // Seed único para cada posição
    );
    cropsGroup.add(cropGroup);
    
    // Armazena para atualização posterior
    cropModels.set(key, {
      group: cropGroup,
      cropType: cropType,
      plantedTurn: currentGameTurn,
    });
  }
}
```

#### Dentro do loop `render(now)`:

```javascript
// Atualiza crescimento de TODAS as plantas a cada frame
for (const [key, cropData] of cropModels.entries()) {
  const config = CROP_CONFIGS[cropData.cropType];
  
  // Calcula novo progresso baseado na turn atual
  const growthProgress = calculateGrowthProgress(
    cropData.plantedTurn,
    currentGameTurn,
    config.growthDays
  );
  
  // Atualiza altura, cor e animação da planta
  updateCropModel(cropData.group, growthProgress, now / 1000);
}
```

---

### 5️⃣ **Avanço de Turns** (`main.js`)

Modificado `performAction()` para avançar turns e sincronizar:

```javascript
async function performAction(action) {
  // ... manipulação de ação ...
  
  function advanceTurn() {
    const newTurn = world.passTurn();    // Incrementa turn no mundo
    view.updateGrowth(newTurn);          // Sincroniza com renderizador
  }
  
  // Após qualquer ação (movimento, plantio, colheita):
  advanceTurn();
}
```

**Sequência de eventos:**

```
1. Usuário clica "Executar" ou faz ação
   ↓
2. performAction() executa (movimento, plantio, etc)
   ↓
3. advanceTurn() é chamada
   ↓
4. world.passTurn() incrementa turn (world lado)
   ↓
5. view.updateGrowth(newTurn) sincroniza lado renderização
   ↓
6. render() calcula novo growthProgress para cada planta
   ↓
7. updateCropModel() muda altura/cor das folhas
   ↓
8. WebGL rerenderiza a cena com mudanças visuais
```

---

## 🎨 Fases de Crescimento Visuais

| Faze | Progress | Turn (Capim) | Aparência | Visibilidade |
|------|----------|--------------|-----------|--------------|
| **Semente** | 0.00 | 0 | Enterrada, invisível | (0%  0.3 | Broto pequeno emerge | Verde claro, pequeno | 30% |
| **Média** | 0.35-0.65 | 5-10 | Verde médio, crescendo | 50-75% |
| **Madura** | 0.65-0.85 | 10-13 | Verde escuro, quase pronta | 85% |
| **Pronta** | 0.85-1.00 | 13-15 | Verde muito escuro, máximo | 100% ✅ |

---

## 🔧 Técnicas de Programação Utilizadas

### 1. **Easing Function (Suavização)**

```javascript
function easeGrowthProgress(linearProgress) {
  const t = linearProgress;
  return t * t * (3 - 2 * t);  // Cubic easing
}
```

Faz crescimento parecer mais natural (rápido no início, desaceleração no final).

### 2. **Interpolação de Cores**

```javascript
function interpolateGrowthColor(progress, colorYoung, colorMature, colorHarvest) {
  if (progress < 0.5) {
    return colorYoung.lerp(colorMature, progress * 2);
  } else {
    return colorMature.lerp(colorHarvest, (progress - 0.5) * 2);
  }
}
```

Cria transição suave de verde claro → verde escuro.

### 3. **Seed Determinístico**

```javascript
seed = x * 73856093 ^ y * 19349663  // Geradores de números pseudo-aleatórios perlin-like
```

Mesma posição sempre gera mesma "aleatória" disposição de folhas (consistente).

### 4. **Geometria Procedural**

```javascript
for (let i = 0; i < config.leafCount; i++) {
  const angle = (i / config.leafCount) * Math.PI * 2;  // 360° dividido
  leaf.rotation.y = angle;  // Dispõe radialmente
}
```

Em vez de pré-modelar, gera folhas em código!

---

## 🚀 Como Testar

### Teste 1: Observar Crescimento Automático

```javascript
// Console do navegador:

// 1. Planta capim em (0,0)
world.plant("capim");
view.setCrop(0, 0, "capim");

// 2. Avança turns manualmente
view.updateGrowth(0);   // Semente
view.updateGrowth(3);   // Broto
view.updateGrowth(8);   // Média
view.updateGrowth(15);  // Pronta
```

Você verá a planta crescer de forma progressiva!

### Teste 2: Ver Cores Mudando

```javascript
// As cores mudam conforme age:
// - Verde claro (#7cb342) → broto
// - Verde médio (#558b2f) → média
// - Verde escuro (#33691e) → pronta
```

### Teste 3: Programa com Plantio

```javascript
// No editor de código, escreva:
moveRight();
plant("capim");    // ← Planta capim
moveDown();
moveDown();
moveDown();
moveDown();
moveDown();
moveDown();
moveDown();
moveDown();
moveDown();
moveDown();
moveDown();
moveDown();
moveDown();
moveDown();
harvest();         // ← Espera 15 turns e colhe!
```

Conforme as ações executam, a planta vai crescer visualmente!

---

## 🌾 Estrutura de Dados

### Armazenamento de Plantas 3D

```javascript
cropModels: Map {
  "0:0" → {
    group: THREE.Group,       // Objeto 3D com folhas
    cropType: "capim",
    plantedTurn: 2,           // Turn em que foi plantada
  },
  "2:3" → { ... },
}
```

Cada entrada compactamente armazena:
- Referência 3D (para rendering)
- Tipo de planta (para configurações)
- Quando foi plantada (para cálculo de idade)

---

## 📊 Fluxo de Renderização

```
Frame de Renderização:
  ├─ render(now) chamada
  │
  ├─ Atualizar animação de movimento
  │
  ├─► NOVO: Atualizar crescimento de plantas
  │   ├─ Para cada planta em cropModels:
  │   │  ├─ Calcular progresso = (currentTurn - plantedTurn) / growthDays
  │   │  ├─ updateCropModel(group, progresso)
  │   │  │  ├─ Recalcular altura das folhas
  │   │  │  ├─ Interpolar cor
  │   │  │  └─ Atualizar geometria + material
  │
  ├─ Atualizar rotação da câmera
  │
  ├─ Renderizar cena com WebGL
  │
  └─ Solicitar próximo frame (RAF)
```

---

## 🎯 Próximos Passos Possíveis

1. **Adicionar mais plantas:**
   ```javascript
   CROP_CONFIGS.trigo = { ... }
   CROP_CONFIGS.milho = { ... }
   ```

2. **Efeitos de água/nutrientes:**
   - Se solo tem pouca água, planta cresce mais lentamente
   - Cor muda para amarelo se faltar nutrientes

3. **Doenças/pragas:** 
   - Manchas nas folhas conforme envelhece sem cuidados

4. **Simulação de vento:**
   - Folhas balançando mais realistas

5. **Sistema de colheita com recompensa:**
   - Primeiro colhê-lo cedo = produção menor
   - Esperar até madura = maior colheita

6. **Composição de plantas:**
   - Modelo mais complexo com flores/sementes no topo quando pronta

---

## 🧮 Matemática por Trás

### Interpolação Linear (Lerp)

```
newValue = start + (end - start) * t
onde t = 0.0 → 1.0
```

Usado para cores e altura.

### Easing Cubic

```
easedProgress = t² × (3 - 2t)
```

Faz curva suave: rápido no início, desaceleração no final.

```
Progress: 0.0 ──────→ 0.5 ││ ──────→ 1.0
Linear:   ────────── ────║──── ──────
Eased:    ════════ ════║  ║════
          (rápido)  (medio) (lento)
```

---

## ✅ Checklist de Implementação

- ✅ Criar file `cropGrowthSystem.js` com configurações de plantas
- ✅ Implementar `createCropModel()` com folhas radiais
- ✅ Implementar `updateCropModel()` para animação contínua
- ✅ Integrar modelos 3D ao `threeFarmView.js`
- ✅ Criar `cropModels` Map para armazenar plantas
- ✅ Adicionar container `cropsGroup` na hierarquia 3D
- ✅ Modificar `setCrop()` para criar modelos 3D
- ✅ Atualizar loop `render()` para recalcular crescimento
- ✅ Implementar `updateGrowth()` API pública
- ✅ Integrar avanço de turns em `main.js`
- ✅ Testar sem erros de compilação

---

## 📝 Resumo

O sistema de crescimento de plantas é uma **simulação progressiva e visual** onde:

1. **Criação**: Quando plantado, cria modelo 3D procedural com folhas
2. **Armazenamento**: Referência armazenada em `cropModels` Map
3. **Tempo**: Turns avançam com cada ação, plantas envelhecem
4. **Cálculo**: Cada frame calcula progresso baseado em idade/dias
5. **Easing**: Transições suaves através de interpolação matemática
6. **Visual**: Altura, cor e detalhes mudam conforme envelhece
7. **Ciclo**: Quando completa 1.0 (100%), pronta para colheita

**Resultado final**: Uma planta que **cresce visualmente de forma realista**, sem aparência de "saltos" ou "degraus", passando por todas as fases de forma contínua e suave! 🌱→🌾
