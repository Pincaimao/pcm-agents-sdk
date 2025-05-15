import { newSpecPage } from '@stencil/core/testing';
import { ZhanshiMnmsModal } from './pcm-1zhanshi-mnms-modal';

describe('pcm-1zhanshi-mnms-modal', () => {
  it('renders when isOpen is true', async () => {
    const { root } = await newSpecPage({
      components: [ZhanshiMnmsModal],
      html: '<pcm-1zhanshi-mnms-modal is-open="true"></pcm-1zhanshi-mnms-modal>',
    });
    expect(root).toBeTruthy();
  });

  it('does not render when isOpen is false', async () => {
    const { root } = await newSpecPage({
      components: [ZhanshiMnmsModal],
      html: '<pcm-1zhanshi-mnms-modal is-open="false"></pcm-1zhanshi-mnms-modal>',
    });
    const modalOverlay = root.shadowRoot.querySelector('.modal-overlay');
    expect(modalOverlay).toBeFalsy();
  });
}); 