import { newE2EPage } from '@stencil/core/testing';

describe('pcm-jlsx-modal', () => {
  it('renders when isOpen is true', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-jlsx-modal is-open="true"></pcm-jlsx-modal>');
    
    const element = await page.find('pcm-jlsx-modal >>> .modal-overlay');
    expect(element).not.toBeNull();
  });

  it('does not render when isOpen is false', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-jlsx-modal is-open="false"></pcm-jlsx-modal>');
    
    const element = await page.find('pcm-jlsx-modal >>> .modal-overlay');
    expect(element).toBeNull();
  });
}); 