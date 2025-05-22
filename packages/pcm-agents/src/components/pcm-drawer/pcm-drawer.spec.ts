import { newSpecPage } from '@stencil/core/testing';
import { PcmDrawer } from './pcm-drawer';

describe('pcm-drawer', () => {
  it('renders with default properties', async () => {
    const { root } = await newSpecPage({
      components: [PcmDrawer],
      html: '<pcm-drawer></pcm-drawer>',
    });
    expect(root).toBeTruthy();
    
    const drawerContent = root.shadowRoot.querySelector('.drawer-content');
    expect(drawerContent).toBeTruthy();
    expect(drawerContent).not.toHaveClass('drawer-content-visible');
  });

  it('renders with visible property', async () => {
    const { root } = await newSpecPage({
      components: [PcmDrawer],
      html: '<pcm-drawer is-open="true"></pcm-drawer>',
    });
    
    const drawerContent = root.shadowRoot.querySelector('.drawer-content');
    expect(drawerContent).toHaveClass('drawer-content-visible');
  });

  it('renders with title', async () => {
    const { root } = await newSpecPage({
      components: [PcmDrawer],
      html: '<pcm-drawer drawer-title="测试标题"></pcm-drawer>',
    });
    
    const title = root.shadowRoot.querySelector('.drawer-title');
    expect(title.textContent).toBe('测试标题');
  });

  it('emits close event when close button is clicked', async () => {
    const page = await newSpecPage({
      components: [PcmDrawer],
      html: '<pcm-drawer is-open="true" closable="true"></pcm-drawer>',
    });
    
    const drawer = page.root;
    const closeButton = drawer.shadowRoot.querySelector('.drawer-close') as HTMLElement;
    
    const closeSpy = jest.fn();
    drawer.addEventListener('closed', closeSpy);
    
    closeButton.click();
    await page.waitForChanges();
    
    expect(closeSpy).toHaveBeenCalled();
  });

  it('emits close event when mask is clicked and maskClosable is true', async () => {
    const page = await newSpecPage({
      components: [PcmDrawer],
      html: '<pcm-drawer is-open="true" mask-closable="true"></pcm-drawer>',
    });
    
    const drawer = page.root;
    const mask = drawer.shadowRoot.querySelector('.drawer-mask') as HTMLElement;
    
    const closeSpy = jest.fn();
    drawer.addEventListener('closed', closeSpy);
    
    mask.click();
    await page.waitForChanges();
    
    expect(closeSpy).toHaveBeenCalled();
  });

  it('does not emit close event when mask is clicked and maskClosable is false', async () => {
    const page = await newSpecPage({
      components: [PcmDrawer],
      html: '<pcm-drawer is-open="true" mask-closable="false"></pcm-drawer>',
    });
    
    const drawer = page.root;
    const mask = drawer.shadowRoot.querySelector('.drawer-mask') as HTMLElement;
    
    const closeSpy = jest.fn();
    drawer.addEventListener('closed', closeSpy);
    
    mask.click();
    await page.waitForChanges();
    
    expect(closeSpy).not.toHaveBeenCalled();
  });
}); 