// ===== JAVASCRIPT COMPATÍVEL COM JS-INTERPRETER 6.0.1 =====
// Este arquivo contém CODE PATTERNS que funcionam no sandbox

// ► RULE 1: Use `var` em loops, não `let`

// ❌ NÃO FAÇA ISTO:
// for(let i = 0; i < 5; i++){ }

// ✅ FAÇA ISTO:
for(var i = 0; i < 5; i++){
    moverDireita();
}

// ═════════════════════════════════════════════════════

// ► RULE 2: Variáveis Simples

var x = 10;
var y = 20;
var resultado = x + y;
// ✅ Funciona com var


// ═════════════════════════════════════════════════════

// ► RULE 3: For Loop - Padrão Correto

for(var i = 0; i < 3; i++){
    moverBaixo();
}


// ═════════════════════════════════════════════════════

// ► RULE 4: While Loop - Sempre Funciona

var contador = 0;
while(contador < 3){
    moverDireita();
    contador = contador + 1;  // Não pode usar contador++; em alguns casos
}


// ═════════════════════════════════════════════════════

// ► RULE 5: If/Else

var numero = 5;
if(numero > 3){
    plantar("arvore");
} else {
    plantar("capim");
}


// ═════════════════════════════════════════════════════

// ► RULE 6: Funções Simples

function mover3x(){
    for(var i = 0; i < 3; i++){
        moverDireita();
    }
}

mover3x();


// ═════════════════════════════════════════════════════

// ► RULE 7: Funções com Parâmetros

function repetirMover(vezes){
    for(var i = 0; i < vezes; i++){
        moverDireita();
    }
}

repetirMover(5);


// ═════════════════════════════════════════════════════

// ► RULE 8: Funções que Plantam

function plantarComPasso(tipo, passos){
    for(var i = 0; i < passos; i++){
        plantar(tipo);
        moverBaixo();
    }
}

plantarComPasso("capim", 3);


// ═════════════════════════════════════════════════════

// ► RULE 9: Arrays (básico)

var plantas = ["capim", "trigo", "arvore"];
var primeira = plantas[0];  // "capim"


// ═════════════════════════════════════════════════════

// ► RULE 10: Objetos (básico)

var posicao = { x: 2, y: 3 };
var x = posicao.x;  // 2


// ═════════════════════════════════════════════════════

// ► RULE 11: For Loop sobre Array

var culturas = ["capim", "trigo", "arvore"];
for(var i = 0; i < culturas.length; i++){
    var tipo = culturas[i];
    plantar(tipo);
    moverBaixo();
}


// ═════════════════════════════════════════════════════

// ► RULE 12: Padrão Sequencial (mais comum)

// Bloco 1: Ir para local
for(var i = 0; i < 2; i++){
    moverDireita();
}

// Bloco 2: Perform ação
for(var i = 0; i < 3; i++){
    plantar("capim");
    moverBaixo();
}

// Bloco 3: Limpar
colher();


// ═════════════════════════════════════════════════════

// TODO IMPORTANTE: Padrões que NÃO funcionam bem

// ❌ Não use:
// - let em for loops (usa var)
// - const (pode não funcionar)
// - Arrow functions (`=> { }`)
// - Destructuring (`let [x, y] = arr`)
// - Template strings (`` ` `` podem não funcionar bem)
// - Async/await (não suportado)

// ═════════════════════════════════════════════════════
