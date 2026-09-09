import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_gLrD2FTUz3WR@ep-lingering-forest-as72i5ev-pooler.c-4.eu-central-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require";

const sql = postgres(databaseUrl, { max: 1 });

try {
  const products = await sql`
    SELECT id, title, category, composition, full_description, image_url
    FROM catalog_products
    WHERE status = 'published'
    ORDER BY updated_at DESC
  `;
  
  console.log(JSON.stringify(products, null, 2));
} catch (error) {
  console.error("Error:", error.message);
} finally {
  await sql.end();
}
