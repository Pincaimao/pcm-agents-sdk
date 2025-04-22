import { newSpecPage } from '@stencil/core/testing';
import { ChatKBModal } from './pcm-zsk-chat-modal';

describe('pcm-zsk-chat-modal', () => {
  it('renders when isOpen is true', async () => {
    const { root } = await newSpecPage({
      components: [ChatKBModal],
      html: '<pcm-zsk-chat-modal is-open="true"></pcm-zsk-chat-modal>',
    });
    expect(root).toBeTruthy();
  });

  it('does not render when isOpen is false', async () => {
    const { root } = await newSpecPage({
      components: [ChatKBModal],
      html: '<pcm-zsk-chat-modal is-open="false"></pcm-zsk-chat-modal>',
    });
    const modalOverlay = root.shadowRoot.querySelector('.modal-overlay');
    expect(modalOverlay).toBeFalsy();
  });
}); 