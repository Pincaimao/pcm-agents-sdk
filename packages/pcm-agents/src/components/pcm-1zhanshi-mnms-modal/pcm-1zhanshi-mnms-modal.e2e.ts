import { newE2EPage } from '@stencil/core/testing';

describe('pcm-1zhanshi-mnms-modal', () => {
  it('renders when isOpen is true', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-1zhanshi-mnms-modal is-open="true"></pcm-1zhanshi-mnms-modal>');
    
    const element = await page.find('pcm-1zhanshi-mnms-modal >>> .modal-overlay');
    expect(element).not.toBeNull();
  });

  it('does not render when isOpen is false', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-1zhanshi-mnms-modal is-open="false"></pcm-1zhanshi-mnms-modal>');
    
    const element = await page.find('pcm-1zhanshi-mnms-modal >>> .modal-overlay');
    expect(element).toBeNull();
  });
}); 