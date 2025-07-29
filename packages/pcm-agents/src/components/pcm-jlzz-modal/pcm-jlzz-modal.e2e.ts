import { newE2EPage } from '@stencil/core/testing';

describe('pcm-qgqjl-modal', () => {
  it('renders when isOpen is true', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-qgqjl-modal is-open="true"></pcm-qgqjl-modal>');
    
    const element = await page.find('pcm-qgqjl-modal >>> .modal-overlay');
    expect(element).not.toBeNull();
  });

  it('does not render when isOpen is false', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-qgqjl-modal is-open="false"></pcm-qgqjl-modal>');
    
    const element = await page.find('pcm-qgqjl-modal >>> .modal-overlay');
    expect(element).toBeNull();
  });
}); 