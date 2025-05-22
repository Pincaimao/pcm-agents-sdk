import { newSpecPage } from '@stencil/core/testing';
import { QgqjlModal } from './pcm-qgqjl-modal';

describe('pcm-qgqjl-modal', () => {
  it('renders when isOpen is true', async () => {
    const { root } = await newSpecPage({
      components: [QgqjlModal],
      html: '<pcm-qgqjl-modal is-open="true"></pcm-qgqjl-modal>',
    });
    expect(root).toBeTruthy();
  });

  it('does not render when isOpen is false', async () => {
    const { root } = await newSpecPage({
      components: [QgqjlModal],
      html: '<pcm-qgqjl-modal is-open="false"></pcm-qgqjl-modal>',
    });
    const modalOverlay = root.shadowRoot.querySelector('.modal-overlay');
    expect(modalOverlay).toBeFalsy();
  });
}); 