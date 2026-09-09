import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 1,
});

async function detectCorrectCategory(product) {
  const title = (product.title || '').toLowerCase();
  const desc = (product.full_description || '').toLowerCase();
  const comp = (product.composition || '').toLowerCase();
  const text = `${title} ${desc} ${comp}`;

  // Check presentation type first (highest priority)
  if (text.includes('коробк') || text.includes('box')) return { cat: 'Коробки', reason: 'box/коробка' };
  if (text.includes('корзин') || text.includes('basket')) return { cat: 'Корзины', reason: 'basket/корзина' };

  // Check for mixed compositions (multiple flower types OR explicit composition marker)
  const flowerTypes = [];
  if (text.includes('роз')) flowerTypes.push('розы');
  if (text.includes('пион')) flowerTypes.push('пионы');
  if (text.includes('гортензи')) flowerTypes.push('гортензии');
  if (text.includes('орхидей')) flowerTypes.push('орхидеи');

  const isMixedFloral = flowerTypes.length > 1;
  const hasCompositionWord = text.includes('композиц') || text.includes('arrangement');
  
  if ((isMixedFloral || hasCompositionWord) && flowerTypes.length > 1) {
    return { cat: 'Композиции', reason: `mixed: ${flowerTypes.join('+')}` };
  }

  // Check flower types
  if (text.includes('орхидей') || text.includes('orchid')) return { cat: 'Авторские', reason: 'orchids' };
  if (text.includes('авторск')) return { cat: 'Авторские', reason: 'авторский' };
  if (text.includes('пион')) return { cat: 'Пионы', reason: 'peonies' };
  if (text.includes('гортензи')) return { cat: 'Гортензии', reason: 'hydrangeas' };
  if (text.includes('роз')) return { cat: 'Розы', reason: 'roses' };

  // Default to current category
  return { cat: product.category || 'Розы', reason: 'default' };
}

async function run() {
  try {
    const products = await sql`
      SELECT id, title, category, composition, full_description
      FROM catalog_products
      WHERE status = 'published'
      ORDER BY id
    `;

    console.log(`\n📊 FULL AUDIT OF ${products.length} PUBLISHED PRODUCTS\n`);

    const analysis = {};
    const movements = [];

    for (const p of products) {
      const detection = await detectCorrectCategory(p);
      const correct = detection.cat;
      const current = p.category;

      if (!analysis[correct]) analysis[correct] = 0;
      analysis[correct]++;

      if (current !== correct) {
        movements.push({
          id: p.id,
          title: p.title?.substring(0, 60),
          from: current,
          to: correct,
          reason: detection.reason
        });
      }
    }

    console.log('=== CURRENT DISTRIBUTION ===\n');
    const currentDist = {};
    products.forEach(p => {
      const cat = p.category || 'UNKNOWN';
      currentDist[cat] = (currentDist[cat] || 0) + 1;
    });
    Object.entries(currentDist).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
      const isValid = ['Розы', 'Пионы', 'Гортензии', 'Коробки', 'Корзины', 'Композиции', 'Авторские', 'Новинки'].includes(cat);
      console.log(`${isValid ? '✓' : '❌'} ${cat.padEnd(15)} ${count.toString().padStart(3)} products`);
    });

    console.log('\n=== MOVEMENTS NEEDED ===\n');
    console.log(`Total products to move: ${movements.length}\n`);

    const byDestination = {};
    movements.forEach(m => {
      if (!byDestination[m.to]) byDestination[m.to] = [];
      byDestination[m.to].push(m);
    });

    Object.entries(byDestination).sort().forEach(([dest, items]) => {
      console.log(`→ TO ${dest} (${items.length}):`);
      const grouped = {};
      items.forEach(m => {
        grouped[m.from] = (grouped[m.from] || 0) + 1;
      });
      Object.entries(grouped).forEach(([from, count]) => {
        console.log(`  ← from "${from}": ${count} products`);
      });
      console.log();
    });

    console.log('=== FINAL DISTRIBUTION (AFTER FIX) ===\n');
    const finalDist = {};
    Object.entries(analysis).forEach(([cat, count]) => {
      finalDist[cat] = count;
    });
    
    const validCats = ['Розы', 'Пионы', 'Гортензии', 'Коробки', 'Корзины', 'Композиции', 'Авторские', 'Новинки'];
    validCats.forEach(cat => {
      const count = finalDist[cat] || 0;
      console.log(`${cat.padEnd(15)} ${count.toString().padStart(3)} products`);
    });

    console.log('\n=== DETAILED MOVEMENTS ===\n');
    console.log(JSON.stringify(movements, null, 2));

    await sql.end();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

run();
