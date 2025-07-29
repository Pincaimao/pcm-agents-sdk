import { newSpecPage } from '@stencil/core/testing';
import { ChatVirtualAPPModal } from './pcm-virtual-chat-modal';

describe('pcm-virtual-chat-modal', () => {
  it('renders when isOpen is true', async () => {
    const { root } = await newSpecPage({
      components: [ChatVirtualAPPModal],
      html: '<pcm-virtual-chat-modal is-open="true"></pcm-virtual-chat-modal>',
    });
    expect(root).toBeTruthy();
  });

  it('does not render when isOpen is false', async () => {
    const { root } = await newSpecPage({
      components: [ChatVirtualAPPModal],
      html: '<pcm-virtual-chat-modal is-open="false"></pcm-virtual-chat-modal>',
    });
    const modalOverlay = root.shadowRoot.querySelector('.modal-overlay');
    expect(modalOverlay).toBeFalsy();
  });
}); 