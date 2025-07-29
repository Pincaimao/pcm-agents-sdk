import { newSpecPage } from '@stencil/core/testing';
import { JlzzModal } from './pcm-jlzz-modal';

describe('pcm-jlzz-modal', () => {
  it('renders when isOpen is true', async () => {
    const { root } = await newSpecPage({
      components: [JlzzModal],
      html: '<pcm-jlzz-modal is-open="true"></pcm-jlzz-modal>',
    });
    expect(root).toBeTruthy();
  });

  it('does not render when isOpen is false', async () => {
    const { root } = await newSpecPage({
      components: [JlzzModal],
      html: '<pcm-jlzz-modal is-open="false"></pcm-jlzz-modal>',
    });
    const modalOverlay = root.shadowRoot.querySelector('.modal-overlay');
    expect(modalOverlay).toBeFalsy();
  });
});
