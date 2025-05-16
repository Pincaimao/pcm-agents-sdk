import { createStore } from '@stencil/store';

// 定义配置数据的类型
export interface ConfigData {
  [key: string]: any;
}

// 从localStorage获取初始配置
const getInitialConfig = (): ConfigData => {
  try {
    const storedConfig = localStorage.getItem('pcm-config-data');
    return storedConfig ? JSON.parse(storedConfig) : {};
  } catch (error) {
    console.error('Error parsing stored config:', error);
    return {};
  }
};

// 创建配置存储
export const { state: configState, onChange } = createStore<{
  data: ConfigData;
}>({
  data: getInitialConfig()
});

// 配置存储的辅助方法
export const configStore = {
  // 获取整个配置对象
  getConfig: (): ConfigData => configState.data,
  
  // 获取特定配置项
  getItem: <T>(key: string, defaultValue?: T): T => {
    return configState.data[key] !== undefined ? configState.data[key] : defaultValue;
  },
  
  // 设置特定配置项
  setItem: <T>(key: string, value: T): void => {
    configState.data = {
      ...configState.data,
      [key]: value
    };
  },
  
  // 移除特定配置项
  removeItem: (key: string): void => {
    const newConfig = { ...configState.data };
    delete newConfig[key];
    configState.data = newConfig;
  },
  
  // 清除所有配置
  clear: (): void => {
    configState.data = {};
  },
  
  // 批量更新配置
  updateConfig: (newConfig: Partial<ConfigData>): void => {
    configState.data = {
      ...configState.data,
      ...newConfig
    };
  }
};

// 自动保存到localStorage
onChange('data', value => {
  try {
    if (Object.keys(value).length > 0) {
      localStorage.setItem('pcm-config-data', JSON.stringify(value));
    } else {
      localStorage.removeItem('pcm-config-data');
    }
  } catch (error) {
    console.error('Error saving config to localStorage:', error);
  }
}); 