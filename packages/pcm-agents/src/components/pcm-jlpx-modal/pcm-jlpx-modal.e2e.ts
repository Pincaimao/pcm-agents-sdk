import { newE2EPage } from '@stencil/core/testing';

describe('pcm-jlpx-modal', () => {
  it('renders when isOpen is true', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-jlpx-modal is-open="true"></pcm-jlpx-modal>');
    
    const element = await page.find('pcm-jlpx-modal >>> .modal-overlay');
    expect(element).not.toBeNull();
  });

  it('does not render when isOpen is false', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-jlpx-modal is-open="false"></pcm-jlpx-modal>');
    
    const element = await page.find('pcm-jlpx-modal >>> .modal-overlay');
    expect(element).toBeNull();
  });
}); 