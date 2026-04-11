// ===== TESTES DO BÁSICO JAVASCRIPT — FarmBot Lab v1.1.0-beta =====
// Copie e cole cada teste NO EDITOR do FarmBot Lab e clique em Executar.
// Todos os testes usam mover("direcao") e console.log() para debug.

// ►► TESTE 1: Loop For — Varredura basica com log
// Percorre 5 ciclos: move, planta arvore, desce, planta arvore, desce, planta capim, move, colhe

for (var i = 0; i < 5; i = i + 1) {
  console.log("Ciclo:", i, "| Posicao:", posicaoX(), posicaoY());
  mover("direita");
  plantar("arvore");
  mover("baixo");
  plantar("arvore");
  mover("baixo");
  plantar("capim");
  mover("direita");
  colher();
}
console.log("Teste 1 concluido. Capim coletado:", contarItem("capim"));


// ►► TESTE 2: Variaveis e Sensores
// Demonstra leitura de posicao e dimensoes do campo

var posX = posicaoX();
var posY = posicaoY();
var largura = tamanhoCampoX();
var altura = tamanhoCampoY();

console.log("Posicao inicial: x=" + posX + " y=" + posY);
console.log("Campo:", largura, "x", altura);

mover("direita");
mover("direita");
mover("direita");

console.log("Posicao final: x=" + posicaoX() + " y=" + posicaoY());


// ►► TESTE 3: Loop While com Sensor de Posicao
// Desce ate atingir y=3 ou bater na borda

var passos = 0;
while (passos < 4) {
  mover("baixo");
  passos = passos + 1;
  console.log("Desceu para y=" + posicaoY());
}
console.log("Teste 3 finalizado. Posicao:", posicaoX(), posicaoY());


// ►► TESTE 4: If/Else com Sensor de Cultura
// Planta ou colhe dependendo do que esta na celula

var cultura = obterCultura();
console.log("Cultura na celula atual:", cultura);

if (cultura !== null && verificarMaturidade()) {
  colher();
  console.log("Colhido!");
} else if (cultura === null) {
  plantar("arvore");
  console.log("Plantou arvore.");
} else {
  console.warn("Cultura imatura, aguardando:", cultura);
}


// ►► TESTE 5: Funcao Simples com Debug
// Define e chama uma funcao que move 3 vezes para a direita logando cada passo

function moverDireita3() {
  for (var i = 0; i < 3; i = i + 1) {
    mover("direita");
    console.info("Passo", i + 1, "| x=" + posicaoX());
  }
}

moverDireita3();
console.log("Teste 5 concluido. Posicao final x=" + posicaoX());


// ►► TESTE 6: Funcao com Parametros e Sensor
// Funcao que move N vezes em qualquer direcao e loga o trajeto

function moverNVezes(direcao, vezes) {
  console.log("Movendo", vezes, "vezes para:", direcao);
  for (var i = 0; i < vezes; i = i + 1) {
    mover(direcao);
  }
  console.log("Chegou em:", posicaoX(), posicaoY());
}

moverNVezes("direita", 2);
moverNVezes("baixo", 2);


// ►► TESTE 7: Funcao que Planta com Log de Solo
// Planta N vezes descendo e loga o solo de cada celula

function plantarNVezes(tipo, vezes) {
  for (var i = 0; i < vezes; i = i + 1) {
    var solo = obterSolo();
    console.log("Celula", i, "| Solo:", solo, "| Plantando:", tipo);
    plantar(tipo);
    if (i < vezes - 1) { mover("baixo"); }
  }
}

plantarNVezes("capim", 3);
console.log("Inventario capim:", contarItem("capim"));


// ►► TESTE 8: Combinado — Funcao + Loop + Condicional + Sensores
// Estrategia adaptativa: planta arvore na primeira celula, capim nas demais;
// se ja houver cultura madura, colhe em vez de plantar

function estrategia() {
  var plantado = 0;
  var largura = tamanhoCampoX();

  console.log("Iniciando estrategia. Campo:", largura, "colunas");

  while (plantado < largura) {
    var c = obterCultura();
    var x = posicaoX();

    if (c !== null && verificarMaturidade()) {
      colher();
      console.log("Colheu", c, "em x=" + x);
    } else if (c === null) {
      if (plantado === 0) {
        plantar("arvore");
        console.log("Plantou arvore em x=" + x);
      } else {
        plantar("capim");
        console.log("Plantou capim em x=" + x);
      }
    } else {
      console.warn("Imatura em x=" + x + ":", c);
    }

    plantado = plantado + 1;
    if (plantado < largura) { mover("direita"); }
  }

  console.log("Estrategia concluida.");
  console.log("Capim:", contarItem("capim"), "| Arvore:", contarItem("arvore"));
}

estrategia();


// ►► TESTE 9: API de Solo — Script Híbrido PT/EN
// Demonstra prepararSolo() (PT) e prepareSurface() (EN) em loops separados.
// Primeira linha: prepara solo com alias PT-BR em um loop for.
// Segunda linha: prepara superficie com alias EN em outro loop while.

console.log("=== Teste 9: API de Solo Bilíngue ===");

// Loop 1 (PT-BR): prepara cada celula da linha 0 com solo alternado
var larguraCampo = tamanhoCampoX();
for (var col = 0; col < larguraCampo; col = col + 1) {
  var tipoSolo = col % 2 === 0 ? "barro" : "argila";
  prepararSolo(tipoSolo);
  console.log("Solo preparado:", obterSolo(), "em x=" + posicaoX());
  plantar("capim");
  if (col < larguraCampo - 1) { mover("direita"); }
}

// Volta para o inicio
for (var v = 0; v < larguraCampo - 1; v = v + 1) {
  mover("esquerda");
}
mover("baixo");

// Loop 2 (EN): prepara superficie alternando pure/tilled
var colAtual = 0;
while (colAtual < larguraCampo) {
  var sup = colAtual % 2 === 0 ? "pure" : "tilled";
  prepareSurface(sup);
  console.info("Superficie:", sup, "em x=" + posicaoX());
  if (colAtual < larguraCampo - 1) { mover("direita"); }
  colAtual = colAtual + 1;
}

console.log("Teste 9 concluido. Capim plantado na linha 0.");
