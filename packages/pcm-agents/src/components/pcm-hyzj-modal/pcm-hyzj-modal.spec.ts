import { newSpecPage } from '@stencil/core/testing';
import { HyzjModal } from './pcm-hyzj-modal';

describe('pcm-hyzj-modal', () => {
  it('renders when isOpen is true', async () => {
    const { root } = await newSpecPage({
      components: [HyzjModal],
      html: '<pcm-hyzj-modal is-open="true"></pcm-hyzj-modal>',
    });
    expect(root).toBeTruthy();
  });

  it('does not render when isOpen is false', async () => {
    const { root } = await newSpecPage({
      components: [HyzjModal],
      html: '<pcm-hyzj-modal is-open="false"></pcm-hyzj-modal>',
    });
    const modalOverlay = root.shadowRoot.querySelector('.modal-overlay');
    expect(modalOverlay).toBeFalsy();
  });
}); 