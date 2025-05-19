import { newE2EPage } from '@stencil/core/testing';

describe('pcm-mnms-video-modal', () => {
  it('renders when isOpen is true', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-mnms-video-modal is-open="true"></pcm-mnms-video-modal>');
    
    const element = await page.find('pcm-mnms-video-modal >>> .modal-overlay');
    expect(element).not.toBeNull();
  });

  it('does not render when isOpen is false', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-mnms-video-modal is-open="false"></pcm-mnms-video-modal>');
    
    const element = await page.find('pcm-mnms-video-modal >>> .modal-overlay');
    expect(element).toBeNull();
  });
}); 