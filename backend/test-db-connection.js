// 数据库连接测试脚本
// 使用方法：node test-db-connection.js

const { Client } = require('pg');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 正在测试数据库连接...\n');
  
  // 从环境变量解析数据库URL
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('❌ 错误：未找到 DATABASE_URL 环境变量');
    console.log('请确保 .env 文件存在并包含 DATABASE_URL');
    process.exit(1);
  }
  
  console.log('📋 数据库配置：');
  // 隐藏密码显示
  const safeUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
  console.log(`   ${safeUrl}\n`);
  
  const client = new Client({
    connectionString: dbUrl,
  });
  
  try {
    await client.connect();
    console.log('✅ 数据库连接成功！\n');
    
    // 测试查询
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL 版本：');
    console.log(`   ${result.rows[0].version}\n`);
    
    // 检查数据库是否存在
    const dbCheck = await client.query(`
      SELECT datname FROM pg_database WHERE datname = 'music_player'
    `);
    
    if (dbCheck.rows.length > 0) {
      console.log('✅ 数据库 "music_player" 已存在');
    } else {
      console.log('⚠️  数据库 "music_player" 不存在，请先创建');
    }
    
    console.log('\n🎉 连接测试完成！可以继续下一步了。');
    
  } catch (error) {
    console.error('❌ 数据库连接失败：\n');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('   错误：连接被拒绝');
      console.error('   可能原因：');
      console.error('   1. PostgreSQL 服务未启动');
      console.error('   2. IP地址或端口错误');
      console.error('   3. 防火墙阻止了连接\n');
    } else if (error.code === 'ENOTFOUND') {
      console.error('   错误：找不到主机');
      console.error('   请检查 IP 地址是否正确\n');
    } else if (error.code === '28P01') {
      console.error('   错误：密码认证失败');
      console.error('   请检查用户名和密码是否正确\n');
    } else {
      console.error(`   ${error.message}\n`);
    }
    
    process.exit(1);
  } finally {
    await client.end();
  }
}

testConnection();
