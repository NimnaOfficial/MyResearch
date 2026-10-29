import { checkDatabaseConnection } from './src/utils/checkDb';

async function main() {
  console.log('⚡ [CSx CORE] Probing database connection...');
  const res = await checkDatabaseConnection(5000);
  if (res.ok) {
    console.log('✅ ' + res.message);
    process.exit(0);
  } else {
    console.error('❌ ' + res.message);
    process.exit(1);
  }
}

main();
