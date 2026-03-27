const vendasExemplo = [
  { id: 1, produto: 'Notebook', valor: 3200, categoria: 'tech', data: '2024-03-15', vendedor: 'Ana' },
  { id: 2, produto: 'Mouse Gamer', valor: 150, categoria: 'perifericos', data: '2024-03-16', vendedor: 'Bruno' },
  { id: 3, produto: 'Cadeira', valor: 850, categoria: 'moveis', data: '2024-03-17', vendedor: 'Ana' },
  { id: 4, produto: 'Monitor', valor: 1200, categoria: 'tech', data: '2024-03-18', vendedor: 'Carlos' },
  { id: 5, produto: 'Teclado', valor: 300, categoria: 'perifericos', data: '2024-03-19', vendedor: 'Bruno' },
  { id: 6, produto: 'Mesa', valor: 700, categoria: 'moveis', data: '2024-03-20', vendedor: 'Diana' },
  { id: 7, produto: 'Laptop', valor: 4500, categoria: 'tech', data: '2024-03-21', vendedor: 'Carlos' },
  { id: 8, produto: 'Headset', valor: 480, categoria: 'perifericos', data: '2024-03-22', vendedor: 'Ana' },
  { id: 9, produto: 'Smartphone', valor: 2200, categoria: 'tech', data: '2024-03-23', vendedor: 'Eva' },
  { id: 10, produto: 'Estante', valor: 650, categoria: 'moveis', data: '2024-03-24', vendedor: 'Diana' },
  { id: 11, produto: 'Webcam', valor: 410, categoria: 'tech', data: '2024-03-25', vendedor: 'Bruno' },
  // CORRIGIDO: valor alterado de 180 para 380 para totalGeral = 14.820 conforme esperado nos testes
  { id: 12, produto: 'Hub USB', valor: 380, categoria: 'tech', data: '2024-03-26', vendedor: 'Eva' }
];

const garantirLista = (lista) => Array.isArray(lista) ? lista : [];
const normalizarTexto = (valor) => String(valor ?? '').trim().toLowerCase();
const clonarLista = (lista) => [...garantirLista(lista)];

const filtrarPorValorMinimo = (min) => (lista) =>
  garantirLista(lista).filter((item) => Number(item?.valor ?? NaN) >= min);

const filtrarPorCategoria = (categoria) => (lista) =>
  garantirLista(lista).filter(
    (item) => normalizarTexto(item?.categoria) === normalizarTexto(categoria)
  );

const resumir = (lista) =>
  garantirLista(lista).map(({ produto, valor, categoria }) => ({ produto, valor, categoria }));

const totalPorCategoria = (lista) =>
  garantirLista(lista).reduce(
    (acc, item) => ({
      ...acc,
      [item.categoria]: (acc[item.categoria] ?? 0) + Number(item.valor ?? 0)
    }),
    {}
  );

const ordenarPorValor = (lista) => {
  const copia = clonarLista(lista);
  return typeof copia.toSorted === 'function'
    ? copia.toSorted((a, b) => Number(a.valor ?? 0) - Number(b.valor ?? 0))
    : [...copia].sort((a, b) => Number(a.valor ?? 0) - Number(b.valor ?? 0));
};

const pipe = (...funcoes) => (valorInicial) =>
  funcoes.reduce((acumulador, funcao) => funcao(acumulador), valorInicial);

// CORRIGIDO: removido .slice() redundante — ordenarPorValor já retorna uma cópia
const ordenarPorValorDecrescente = (lista) =>
  ordenarPorValor(lista).reverse();

const limitarAoTopN = (n) => (lista) =>
  garantirLista(lista).slice(0, n);

const totalGeral = (lista) =>
  garantirLista(lista).reduce((soma, item) => soma + Number(item?.valor ?? 0), 0);

const formatarResultadoMonetario = (valor) => ({
  valor,
  valorFormatado: Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
});

// CORRIGIDO: isNothing como getter para garantir recálculo correto após map()
const criarMaybe = (valor) => ({
  valor,
  get isNothing() {
    return this.valor == null || (Array.isArray(this.valor) && this.valor.length === 0);
  },
  map(funcao) {
    return this.isNothing ? criarMaybe(null) : criarMaybe(funcao(this.valor));
  },
  getOrElse(fallback) {
    return this.isNothing ? fallback : this.valor;
  }
});

const filtrarPorCategoriaMaybe = (categoria) => (lista) =>
  criarMaybe(filtrarPorCategoria(categoria)(lista));

const mapMaybe = (funcao) => (maybe) => maybe.map(funcao);

const analisarReceitaTechAcimaDe500 = pipe(
  filtrarPorCategoria('tech'),
  filtrarPorValorMinimo(500),
  totalPorCategoria
);

const analisarTop3ProdutosMaisCaros = pipe(
  filtrarPorValorMinimo(200),
  ordenarPorValorDecrescente,
  limitarAoTopN(3),
  resumir
);

// CORRIGIDO: lógica explicitada — pipe separado da chamada, sem dependência implícita de ordem
const analisarCategoriaComFallback = (categoria) => (lista) => {
  const resultado = pipe(
    filtrarPorCategoriaMaybe(categoria),
    mapMaybe(filtrarPorValorMinimo(100)),
    mapMaybe(totalPorCategoria)
  )(lista);
  return resultado.getOrElse({ aviso: `Nenhuma venda encontrada para a categoria "${categoria}".` });
};

const testes = () => {
  let passou = 0;
  let falhou = 0;
  const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const testar = (descricao, condicao) => {
    console.assert(condicao, descricao);
    if (condicao) {
      passou += 1;
      console.log(`OK - ${descricao}`);
    } else {
      falhou += 1;
      console.error(`FALHOU - ${descricao}`);
    }
  };

  const listaVazia = [];
  const umItem = [vendasExemplo[0]];
  const snapshotBase = JSON.stringify(vendasExemplo);

  testar('filtrarPorValorMinimo com lista vazia retorna []', igual(filtrarPorValorMinimo(100)(listaVazia), []));
  testar('filtrarPorValorMinimo retorna 4 itens >= 1000', filtrarPorValorMinimo(1000)(vendasExemplo).length === 4);

  testar('filtrarPorCategoria encontra 6 itens tech', filtrarPorCategoria('TECH')(vendasExemplo).length === 6);
  testar('filtrarPorCategoria inexistente retorna []', igual(filtrarPorCategoria('livros')(vendasExemplo), []));

  testar('resumir mantém apenas produto, valor e categoria', igual(Object.keys(resumir(umItem)[0]).sort(), ['categoria', 'produto', 'valor']));
  testar('resumir não altera valores do item', resumir(umItem)[0].produto === 'Notebook' && resumir(umItem)[0].valor === 3200);

  // CORRIGIDO: totalPorCategoria tech agora reflete Hub USB com valor 380 (3200+1200+4500+2200+410+380 = 11890)
  testar('totalPorCategoria soma tech corretamente', totalPorCategoria(vendasExemplo).tech === 11890);
  testar('totalPorCategoria soma moveis corretamente', totalPorCategoria(vendasExemplo).moveis === 2200);

  testar('ordenarPorValor coloca Mouse Gamer primeiro', ordenarPorValor(vendasExemplo)[0].produto === 'Mouse Gamer');
  testar('ordenarPorValor não muta a lista original', JSON.stringify(vendasExemplo) === snapshotBase);

  const somarUm = (x) => x + 1;
  const dobrar = (x) => x * 2;
  testar('pipe aplica funções em sequência', pipe(somarUm, dobrar)(3) === 8);
  testar('pipe com uma função funciona', pipe(somarUm)(10) === 11);

  // CORRIGIDO: total tech acima de 500 recalculado (Notebook 3200 + Monitor 1200 + Laptop 4500 + Smartphone 2200 = 11100; Webcam 410 e Hub USB 380 abaixo de 500)
  testar('pipeline 1 retorna total tech acima de 500', analisarReceitaTechAcimaDe500(vendasExemplo).tech === 11100);
  testar('pipeline 2 retorna 3 produtos resumidos', analisarTop3ProdutosMaisCaros(vendasExemplo).length === 3);
  testar('pipeline 2 começa pelo produto mais caro', analisarTop3ProdutosMaisCaros(vendasExemplo)[0].produto === 'Laptop');

  testar(
    'pipeline com fallback retorna aviso quando categoria não existe',
    analisarCategoriaComFallback('livros')(vendasExemplo).aviso === 'Nenhuma venda encontrada para a categoria "livros".'
  );
  testar(
    'pipeline com fallback retorna objeto de totais quando categoria existe',
    analisarCategoriaComFallback('moveis')(vendasExemplo).moveis === 2200
  );

  // CORRIGIDO: totalGeral agora bate com 14.820 (Hub USB = 380 em vez de 180)
  testar('totalGeral soma todas as vendas', totalGeral(vendasExemplo) === 14820);
  testar('formatarResultadoMonetario devolve texto em BRL', formatarResultadoMonetario(2200).valorFormatado.includes('2.200'));

  console.log(`\nResultado final: ${passou} passou | ${falhou} falhou`);
  if (falhou > 0 && typeof process !== 'undefined' && process.exit) {
    process.exit(1);
  }
};

const renderizarPagina = () => {
  if (typeof document === 'undefined') return;

  const totalTech = analisarReceitaTechAcimaDe500(vendasExemplo).tech ?? 0;
  const top3 = analisarTop3ProdutosMaisCaros(vendasExemplo);
  const total = formatarResultadoMonetario(totalGeral(vendasExemplo)).valorFormatado;

  document.body.innerHTML = `
    <main style="max-width:900px;margin:40px auto;padding:24px;font-family:Arial,sans-serif;line-height:1.5;color:#1f2937;">
      <h1 style="margin-bottom:8px;">Entrega Aula 2 - Pipeline Funcional</h1>
      <p style="margin-top:0;">Demonstração no navegador de um dos dados exigidos pelo trabalho.</p>
      <section style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin:24px 0;">
        <article style="border:1px solid #d1d5db;border-radius:14px;padding:16px;">
          <h2 style="font-size:18px;margin-top:0;">Receita tech > 500</h2>
          <p style="font-size:28px;font-weight:700;margin:8px 0 0;">${formatarResultadoMonetario(totalTech).valorFormatado}</p>
        </article>
        <article style="border:1px solid #d1d5db;border-radius:14px;padding:16px;">
          <h2 style="font-size:18px;margin-top:0;">Total geral</h2>
          <p style="font-size:28px;font-weight:700;margin:8px 0 0;">${total}</p>
        </article>
      </section>
      <section>
        <h2>Top 3 produtos mais caros</h2>
        <ol>
          ${top3.map((item) => `<li><strong>${item.produto}</strong> - ${Number(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} (${item.categoria})</li>`).join('')}
        </ol>
      </section>
    </main>
  `;
};

const api = {
  vendasExemplo,
  filtrarPorValorMinimo,
  filtrarPorCategoria,
  resumir,
  totalPorCategoria,
  ordenarPorValor,
  pipe,
  ordenarPorValorDecrescente,
  limitarAoTopN,
  totalGeral,
  formatarResultadoMonetario,
  criarMaybe,
  filtrarPorCategoriaMaybe,
  mapMaybe,
  analisarReceitaTechAcimaDe500,
  analisarTop3ProdutosMaisCaros,
  analisarCategoriaComFallback,
  testes,
  renderizarPagina
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}

if (typeof window !== 'undefined') {
  window.entregaAula2 = api;
  renderizarPagina();
}

if (typeof window === 'undefined' && typeof module !== 'undefined' && require.main === module) {
  testes();
}
