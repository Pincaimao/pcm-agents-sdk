const fs = require('fs');
const path = require('path');
const readline = require('readline');
const dotenv = require('dotenv');

// 读取 .env 文件
const envPath = path.join(__dirname, '.env');
const envConfig = dotenv.config({ path: envPath }).parsed || {};

// 从 .env 文件获取 API_DOMAIN
let apiDomain = envConfig.API_DOMAIN;

// 如果仍然没有找到，使用默认值
if (!apiDomain || apiDomain === '未找到') {
  apiDomain = '未设置.env';
}

// 创建命令行交互界面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\x1b[33m%s\x1b[0m', '==================================================');
console.log('\x1b[33m%s\x1b[0m', `当前 API_DOMAIN 设置为: \x1b[36m${apiDomain}\x1b[0m`);
console.log('\x1b[33m%s\x1b[0m', '==================================================');

rl.question('确认继续上传? (y/n): ', (answer) => {
  rl.close();
  if (answer.toLowerCase() !== 'y') {
    console.log('上传已取消');
    process.exit(1);
  }
  // 继续执行上传流程
}); 