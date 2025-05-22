import { newE2EPage } from '@stencil/core/testing';

describe('pcm-drawer', () => {
  it('renders with visible property', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-drawer visible="true"></pcm-drawer>');
    
    const element = await page.find('pcm-drawer >>> .drawer-content-visible');
    expect(element).not.toBeNull();
  });

  it('closes when close button is clicked', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-drawer visible="true" closable="true"></pcm-drawer>');
    
    const closeButton = await page.find('pcm-drawer >>> .drawer-close');
    await closeButton.click();
    
    await page.waitForChanges();
    
    const visibleDrawer = await page.find('pcm-drawer >>> .drawer-content-visible');
    expect(visibleDrawer).toBeNull();
  });

  it('closes when mask is clicked and maskClosable is true', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-drawer visible="true" mask-closable="true"></pcm-drawer>');
    
    const mask = await page.find('pcm-drawer >>> .drawer-mask');
    await mask.click();
    
    await page.waitForChanges();
    
    const visibleDrawer = await page.find('pcm-drawer >>> .drawer-content-visible');
    expect(visibleDrawer).toBeNull();
  });

  it('does not close when mask is clicked and maskClosable is false', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-drawer visible="true" mask-closable="false"></pcm-drawer>');
    
    const mask = await page.find('pcm-drawer >>> .drawer-mask');
    await mask.click();
    
    await page.waitForChanges();
    
    const visibleDrawer = await page.find('pcm-drawer >>> .drawer-content-visible');
    expect(visibleDrawer).not.toBeNull();
  });
}); 