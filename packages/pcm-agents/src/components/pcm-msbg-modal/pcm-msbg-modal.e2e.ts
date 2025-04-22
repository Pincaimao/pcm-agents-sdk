import { newE2EPage } from '@stencil/core/testing';

describe('pcm-msbg-modal', () => {
  it('renders when isOpen is true', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-msbg-modal is-open="true"></pcm-msbg-modal>');
    
    const element = await page.find('pcm-msbg-modal >>> .modal-overlay');
    expect(element).not.toBeNull();
  });

  it('does not render when isOpen is false', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-msbg-modal is-open="false"></pcm-msbg-modal>');
    
    const element = await page.find('pcm-msbg-modal >>> .modal-overlay');
    expect(element).toBeNull();
  });
}); 