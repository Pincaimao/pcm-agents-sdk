import { newSpecPage } from '@stencil/core/testing';
import { ChatHRModal } from './pcm-hr-chat-modal';

describe('pcm-hr-chat-modal', () => {
  it('renders when isOpen is true', async () => {
    const { root } = await newSpecPage({
      components: [ChatHRModal],
      html: '<pcm-hr-chat-modal is-open="true"></pcm-hr-chat-modal>',
    });
    expect(root).toBeTruthy();
  });

  it('does not render when isOpen is false', async () => {
    const { root } = await newSpecPage({
      components: [ChatHRModal],
      html: '<pcm-hr-chat-modal is-open="false"></pcm-hr-chat-modal>',
    });
    const modalOverlay = root.shadowRoot.querySelector('.modal-overlay');
    expect(modalOverlay).toBeFalsy();
  });
}); 