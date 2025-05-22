import { newE2EPage } from '@stencil/core/testing';

describe('pcm-mnms-zp-modal', () => {
  it('renders when isOpen is true', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-mnms-zp-modal is-open="true"></pcm-mnms-zp-modal>');
    
    const element = await page.find('pcm-mnms-zp-modal >>> .modal-overlay');
    expect(element).not.toBeNull();
  });

  it('does not render when isOpen is false', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-mnms-zp-modal is-open="false"></pcm-mnms-zp-modal>');
    
    const element = await page.find('pcm-mnms-zp-modal >>> .modal-overlay');
    expect(element).toBeNull();
  });
}); 