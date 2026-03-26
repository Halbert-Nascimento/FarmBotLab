// ===== TESTES DO BÁSICO JAVASCRIPT =====
// Copie e cole cada teste NO EDITOR do FarmBot Lab e clique em Executar

// ►► TEST 1: Seu código CORRIGIDO (faltava inicializar i = 0)
// Entre as linhas 2-8 do seu original, havia `for(leti i; i< 5; i++)` 
// Deveria ser: `for(let i = 0; i < 5; i++)`

for(let i = 0; i < 5; i++){
    moverDireita();
    plantar("arvore");
    moverBaixo();
    plantar("arvore");
    moverBaixo();
    plantar("capim");
    moverDireita();
    colher();
}

// ✓ Esperado: Move direita, planta arvore, desce, planta arvore, desce, planta capim, move direita, colhe
// Repete 5 vezes


// ►► TEST 2: Variáveis Simples
let contador = 0;
let alvo = 3;
moverDireita();
moverDireita();
moverDireita();


// ►► TEST 3: Loop While com Variável
let passos = 0;
while(passos < 4){
    moverBaixo();
    passos = passos + 1;
}


// ►► TEST 4: If/Else Simples
let numero = 2;
if(numero > 1){
    plantar("arvore");
} else {
    plantar("capim");
}


// ►► TEST 5: Função Simples (sem parâmetros)
function moverDireita3(){
    for(let i = 0; i < 3; i++){
        moverDireita();
    }
}

moverDireita3();  // Chama a função


// ►► TEST 6: Função com Parâmetros
function moverNVezes(vezes){
    for(let i = 0; i < vezes; i++){
        moverDireita();
    }
}

moverNVezes(2);  // Move 2 vezes


// ►► TEST 7: Função que Planta
function plantarNVezes(tipo, vezes){
    for(let i = 0; i < vezes; i++){
        plantar(tipo);
        moverBaixo();
    }
}

plantarNVezes("capim", 3);  // Planta capim 3 vezes descendo


// ►► TEST 8: Combinado - Função + Loop + Condição
function estrategia(){
    let plantado = 0;
    while(plantado < 2){
        if(plantado === 0){
            plantar("arvore");
        } else {
            plantar("capim");
        }
        moverBaixo();
        plantado = plantado + 1;
    }
}

estrategia();  // Executa a estratégia
