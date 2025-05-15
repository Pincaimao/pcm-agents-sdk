import { newSpecPage } from '@stencil/core/testing';
import { HtwsModal } from './pcm-htws-modal';

describe('pcm-htws-modal', () => {
  it('renders when isOpen is true', async () => {
    const { root } = await newSpecPage({
      components: [HtwsModal],
      html: '<pcm-htws-modal is-open="true"></pcm-htws-modal>',
    });
    expect(root).toBeTruthy();
  });

  it('does not render when isOpen is false', async () => {
    const { root } = await newSpecPage({
      components: [HtwsModal],
      html: '<pcm-htws-modal is-open="false"></pcm-htws-modal>',
    });
    const modalOverlay = root.shadowRoot.querySelector('.modal-overlay');
    expect(modalOverlay).toBeFalsy();
  });
}); 