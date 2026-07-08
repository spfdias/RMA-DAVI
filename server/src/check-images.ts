import { initDatabase, queryAll } from './database';
initDatabase().then(async () => {
  const imgs = await queryAll('SELECT id, relatorio_id, categoria, filename, original_name, created_at FROM imagens_atividades ORDER BY id');
  console.log('Total imagens:', imgs.length);
  imgs.forEach(i => console.log(JSON.stringify(i)));
  if (imgs.length > 0) {
    const cats = await queryAll('SELECT value, label FROM categorias');
    console.log('Categorias disponiveis:', cats.map((c: any) => c.value).join(', '));
    const valoresImagem = [...new Set(imgs.map((i: any) => i.categoria))];
    console.log('Categorias usadas nas imagens:', valoresImagem.join(', '));
  }
  const rels = await queryAll('SELECT id, mes, ano FROM relatorios ORDER BY ano, mes');
  console.log('Relatorios:', rels.length);
  rels.forEach((r: any) => console.log('  mes:', r.mes, 'ano:', r.ano, 'id:', r.id));
}).catch(e => console.error(e));
