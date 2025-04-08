import { newSpecPage } from '@stencil/core/testing';
import { VideoChatModal } from './pcm-video-chat-modal';

describe('pcm-video-chat-modal', () => {
  it('renders when isOpen is true', async () => {
    const { root } = await newSpecPage({
      components: [VideoChatModal],
      html: '<pcm-video-chat-modal is-open="true"></pcm-video-chat-modal>',
    });
    expect(root).toBeTruthy();
  });

  it('does not render when isOpen is false', async () => {
    const { root } = await newSpecPage({
      components: [VideoChatModal],
      html: '<pcm-video-chat-modal is-open="false"></pcm-video-chat-modal>',
    });
    const modalOverlay = root.shadowRoot.querySelector('.modal-overlay');
    expect(modalOverlay).toBeFalsy();
  });
}); 