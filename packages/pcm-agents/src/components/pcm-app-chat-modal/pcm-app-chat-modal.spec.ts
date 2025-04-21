import { newSpecPage } from '@stencil/core/testing';
import { ChatAPPModal } from './pcm-app-chat-modal';

describe('pcm-app-chat-modal', () => {
  it('renders when isOpen is true', async () => {
    const { root } = await newSpecPage({
      components: [ChatAPPModal],
      html: '<pcm-app-chat-modal is-open="true"></pcm-app-chat-modal>',
    });
    expect(root).toBeTruthy();
  });

  it('does not render when isOpen is false', async () => {
    const { root } = await newSpecPage({
      components: [ChatAPPModal],
      html: '<pcm-app-chat-modal is-open="false"></pcm-app-chat-modal>',
    });
    const modalOverlay = root.shadowRoot.querySelector('.modal-overlay');
    expect(modalOverlay).toBeFalsy();
  });
}); 