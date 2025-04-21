import { newE2EPage } from '@stencil/core/testing';

describe('pcm-jlpp-modal', () => {
  it('renders when isOpen is true', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-jlpp-modal is-open="true"></pcm-jlpp-modal>');
    
    const element = await page.find('pcm-jlpp-modal >>> .modal-overlay');
    expect(element).not.toBeNull();
  });

  it('does not render when isOpen is false', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-jlpp-modal is-open="false"></pcm-jlpp-modal>');
    
    const element = await page.find('pcm-jlpp-modal >>> .modal-overlay');
    expect(element).toBeNull();
  });
}); 