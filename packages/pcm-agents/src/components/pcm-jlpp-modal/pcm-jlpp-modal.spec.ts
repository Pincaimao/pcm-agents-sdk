import { newSpecPage } from '@stencil/core/testing';
import { JlppModal } from './pcm-jlpp-modal';

describe('pcm-jlpp-modal', () => {
  it('renders when isOpen is true', async () => {
    const { root } = await newSpecPage({
      components: [JlppModal],
      html: '<pcm-jlpp-modal is-open="true"></pcm-jlpp-modal>',
    });
    expect(root).toBeTruthy();
  });

  it('does not render when isOpen is false', async () => {
    const { root } = await newSpecPage({
      components: [JlppModal],
      html: '<pcm-jlpp-modal is-open="false"></pcm-jlpp-modal>',
    });
    const modalOverlay = root.shadowRoot.querySelector('.modal-overlay');
    expect(modalOverlay).toBeFalsy();
  });
}); 