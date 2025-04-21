import { newSpecPage } from '@stencil/core/testing';
import { MnmsModal } from './pcm-mnms-modal';

describe('pcm-mnms-modal', () => {
  it('renders when isOpen is true', async () => {
    const { root } = await newSpecPage({
      components: [MnmsModal],
      html: '<pcm-mnms-modal is-open="true"></pcm-mnms-modal>',
    });
    expect(root).toBeTruthy();
  });

  it('does not render when isOpen is false', async () => {
    const { root } = await newSpecPage({
      components: [MnmsModal],
      html: '<pcm-mnms-modal is-open="false"></pcm-mnms-modal>',
    });
    const modalOverlay = root.shadowRoot.querySelector('.modal-overlay');
    expect(modalOverlay).toBeFalsy();
  });
}); 