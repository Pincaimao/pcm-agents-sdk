import { newSpecPage } from '@stencil/core/testing';
import { PcmJdModal } from './pcm-jd-modal';

describe('pcm-jd-modal', () => {
  it('renders when isOpen is true', async () => {
    const { root } = await newSpecPage({
      components: [PcmJdModal],
      html: '<pcm-jd-modal is-open="true"></pcm-jd-modal>',
    });
    expect(root).toBeTruthy();
  });

  it('does not render when isOpen is false', async () => {
    const { root } = await newSpecPage({
      components: [PcmJdModal],
      html: '<pcm-jd-modal is-open="false"></pcm-jd-modal>',
    });
    const modalOverlay = root.shadowRoot.querySelector('.modal-overlay');
    expect(modalOverlay).toBeFalsy();
  });
}); 