import { newE2EPage } from '@stencil/core/testing';

describe('pcm-hyzj-modal', () => {
  it('renders when isOpen is true', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-hyzj-modal is-open="true"></pcm-hyzj-modal>');
    
    const element = await page.find('pcm-hyzj-modal >>> .modal-overlay');
    expect(element).not.toBeNull();
  });

  it('does not render when isOpen is false', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-hyzj-modal is-open="false"></pcm-hyzj-modal>');
    
    const element = await page.find('pcm-hyzj-modal >>> .modal-overlay');
    expect(element).toBeNull();
  });
}); 