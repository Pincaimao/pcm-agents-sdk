import { newSpecPage } from '@stencil/core/testing';
import { JlpxModal } from './pcm-jlpx-modal';

describe('pcm-jlpx-modal', () => {
  it('renders when isOpen is true', async () => {
    const { root } = await newSpecPage({
      components: [JlpxModal],
      html: '<pcm-jlpx-modal is-open="true"></pcm-jlpx-modal>',
    });
    expect(root).toBeTruthy();
  });

  it('does not render when isOpen is false', async () => {
    const { root } = await newSpecPage({
      components: [JlpxModal],
      html: '<pcm-jlpx-modal is-open="false"></pcm-jlpx-modal>',
    });
    const modalOverlay = root.shadowRoot.querySelector('.modal-overlay');
    expect(modalOverlay).toBeFalsy();
  });
}); 