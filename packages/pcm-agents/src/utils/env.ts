// 默认 API 域名
const DEFAULT_API_DOMAIN = 'https://api.pincaimao.com/agents/platform';
const DEFAULT_PCM_DOMAIN = 'https://www.pincaimao.com';


// 从环境变量获取 API 域名，如果未设置则使用默认值
export const API_DOMAIN = process.env.API_DOMAIN || DEFAULT_API_DOMAIN;
export const PCM_DOMAIN = process.env.PCM_DOMAIN || DEFAULT_PCM_DOMAIN;

// 导出其他环境变量
export const ENV = {
  API_DOMAIN,
  PCM_DOMAIN,
  // 可以添加其他环境变量
}; 