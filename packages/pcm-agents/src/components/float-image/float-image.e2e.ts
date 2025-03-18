import { newE2EPage } from '@stencil/core/testing';

describe('float-image', () => {
  it('renders', async () => {
    const page = await newE2EPage();

    await page.setContent('<float-image></float-image>');
    const element = await page.find('float-image');
    expect(element).toHaveClass('hydrated');
  });

  it('renders with src attribute', async () => {
    const page = await newE2EPage();

    await page.setContent('<float-image src="https://example.com/image.jpg"></float-image>');
    const image = await page.find('float-image >>> img');
    
    expect(image.getAttribute('src')).toEqual('https://example.com/image.jpg');
  });

  it('renders with custom dimensions', async () => {
    const page = await newE2EPage();

    await page.setContent('<float-image width="100px" height="100px"></float-image>');
    const image = await page.find('float-image >>> img');
    
    expect(image.getAttribute('width')).toEqual('100px');
    expect(image.getAttribute('height')).toEqual('100px');
  });

  it('emits floatImageClick event when clicked', async () => {
    const page = await newE2EPage();

    await page.setContent('<float-image></float-image>');
    const floatImage = await page.find('float-image');
    
    // 设置事件监听器
    const eventSpy = await page.spyOnEvent('floatImageClick');
    
    // 点击组件
    await floatImage.click();
    
    // 验证事件是否被触发
    expect(eventSpy).toHaveReceivedEvent();
  });
}); 