import { newSpecPage } from '@stencil/core/testing';
import { JlsxModal } from './pcm-jlsx-modal';

describe('pcm-jlsx-modal', () => {
  it('renders when isOpen is true', async () => {
    const { root } = await newSpecPage({
      components: [JlsxModal],
      html: '<pcm-jlsx-modal is-open="true"></pcm-jlsx-modal>',
    });
    expect(root).toBeTruthy();
  });

  it('does not render when isOpen is false', async () => {
    const { root } = await newSpecPage({
      components: [JlsxModal],
      html: '<pcm-jlsx-modal is-open="false"></pcm-jlsx-modal>',
    });
    const modalOverlay = root.shadowRoot.querySelector('.modal-overlay');
    expect(modalOverlay).toBeFalsy();
  });
}); 