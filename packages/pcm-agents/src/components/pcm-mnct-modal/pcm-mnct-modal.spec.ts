import { newSpecPage } from '@stencil/core/testing';
import { MnctModal } from './pcm-mnct-modal';

describe('pcm-mnct-modal', () => {
  it('renders when isOpen is true', async () => {
    const { root } = await newSpecPage({
      components: [MnctModal],
      html: '<pcm-mnct-modal is-open="true"></pcm-mnct-modal>',
    });
    expect(root).toBeTruthy();
  });

  it('does not render when isOpen is false', async () => {
    const { root } = await newSpecPage({
      components: [MnctModal],
      html: '<pcm-mnct-modal is-open="false"></pcm-mnct-modal>',
    });
    const modalOverlay = root.shadowRoot.querySelector('.modal-overlay');
    expect(modalOverlay).toBeFalsy();
  });
}); 