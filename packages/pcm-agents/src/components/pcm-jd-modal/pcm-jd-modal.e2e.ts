import { newE2EPage } from '@stencil/core/testing';

describe('pcm-jd-modal', () => {
  it('renders when isOpen is true', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-jd-modal is-open="true"></pcm-jd-modal>');
    
    const element = await page.find('pcm-jd-modal >>> .modal-overlay');
    expect(element).not.toBeNull();
  });

  it('does not render when isOpen is false', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-jd-modal is-open="false"></pcm-jd-modal>');
    
    const element = await page.find('pcm-jd-modal >>> .modal-overlay');
    expect(element).toBeNull();
  });
}); 