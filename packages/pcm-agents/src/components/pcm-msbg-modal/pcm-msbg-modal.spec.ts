import { newSpecPage } from '@stencil/core/testing';
import { MsbgModal } from './pcm-msbg-modal';

describe('pcm-msbg-modal', () => {
  it('renders when isOpen is true', async () => {
    const { root } = await newSpecPage({
      components: [MsbgModal],
      html: '<pcm-msbg-modal is-open="true"></pcm-msbg-modal>',
    });
    expect(root).toBeTruthy();
  });

  it('does not render when isOpen is false', async () => {
    const { root } = await newSpecPage({
      components: [MsbgModal],
      html: '<pcm-msbg-modal is-open="false"></pcm-msbg-modal>',
    });
    const modalOverlay = root.shadowRoot.querySelector('.modal-overlay');
    expect(modalOverlay).toBeFalsy();
  });
}); 