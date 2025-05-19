import { newSpecPage } from '@stencil/core/testing';
import { MnmsZpModal } from './pcm-mnms-zp-modal';

describe('pcm-mnms-zp-modal', () => {
  it('renders when isOpen is true', async () => {
    const { root } = await newSpecPage({
      components: [MnmsZpModal],
      html: '<pcm-mnms-zp-modal is-open="true"></pcm-mnms-zp-modal>',
    });
    expect(root).toBeTruthy();
  });

  it('does not render when isOpen is false', async () => {
    const { root } = await newSpecPage({
      components: [MnmsZpModal],
      html: '<pcm-mnms-zp-modal is-open="false"></pcm-mnms-zp-modal>',
    });
    const modalOverlay = root.shadowRoot.querySelector('.modal-overlay');
    expect(modalOverlay).toBeFalsy();
  });
}); 