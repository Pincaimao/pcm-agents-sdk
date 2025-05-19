import { newSpecPage } from '@stencil/core/testing';
import { MnmsVideoModal } from './pcm-mnms-video-modal';

describe('pcm-mnms-video-modal', () => {
  it('renders when isOpen is true', async () => {
    const { root } = await newSpecPage({
      components: [MnmsVideoModal],
      html: '<pcm-mnms-video-modal is-open="true"></pcm-mnms-video-modal>',
    });
    expect(root).toBeTruthy();
  });

  it('does not render when isOpen is false', async () => {
    const { root } = await newSpecPage({
      components: [MnmsVideoModal],
      html: '<pcm-mnms-video-modal is-open="false"></pcm-mnms-video-modal>',
    });
    const modalOverlay = root.shadowRoot.querySelector('.modal-overlay');
    expect(modalOverlay).toBeFalsy();
  });
}); 