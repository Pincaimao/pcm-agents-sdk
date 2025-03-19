import { newSpecPage } from '@stencil/core/testing';
import { ChatModal } from './pcm-chat-modal';

describe('chat-modal', () => {
  it('renders when isOpen is true', async () => {
    const { root } = await newSpecPage({
      components: [ChatModal],
      html: '<chat-modal is-open="true"></chat-modal>',
    });
    expect(root).toBeTruthy();
  });

  it('does not render when isOpen is false', async () => {
    const { root } = await newSpecPage({
      components: [ChatModal],
      html: '<chat-modal is-open="false"></chat-modal>',
    });
    const modalOverlay = root.shadowRoot.querySelector('.modal-overlay');
    expect(modalOverlay).toBeFalsy();
  });
}); 