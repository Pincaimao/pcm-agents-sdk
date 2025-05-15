import { newE2EPage } from '@stencil/core/testing';

describe('pcm-mnct-modal', () => {
  it('renders when isOpen is true', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-mnct-modal is-open="true"></pcm-mnct-modal>');
    
    const element = await page.find('pcm-mnct-modal >>> .modal-overlay');
    expect(element).not.toBeNull();
  });

  it('does not render when isOpen is false', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-mnct-modal is-open="false"></pcm-mnct-modal>');
    
    const element = await page.find('pcm-mnct-modal >>> .modal-overlay');
    expect(element).toBeNull();
  });
}); 