import { newSpecPage } from '@stencil/core/testing';
import { ZyghModal } from './pcm-zygh-modal';

describe('pcm-zygh-modal', () => {
  it('renders when isOpen is true', async () => {
    const page = await newSpecPage({
      components: [ZyghModal],
      html: `<pcm-zygh-modal is-open="true"></pcm-zygh-modal>`,
    });
    expect(page.root).toBeTruthy();
  });

  it('does not render when isOpen is false', async () => {
    const page = await newSpecPage({
      components: [ZyghModal],
      html: `<pcm-zygh-modal is-open="false"></pcm-zygh-modal>`,
    });
    
    // 检查渲染的内容是否为空
    expect(page.root.shadowRoot.innerHTML).toBe('');
  });

  it('renders with default title', async () => {
    const page = await newSpecPage({
      components: [ZyghModal],
      html: `<pcm-zygh-modal is-open="true"></pcm-zygh-modal>`,
    });
    
    const headerText = page.root.shadowRoot.querySelector('.header-left div').textContent;
    expect(headerText).toBe('职业规划助手');
  });

  it('renders with custom title', async () => {
    const page = await newSpecPage({
      components: [ZyghModal],
      html: `<pcm-zygh-modal is-open="true" modal-title="自定义标题"></pcm-zygh-modal>`,
    });
    
    const headerText = page.root.shadowRoot.querySelector('.header-left div').textContent;
    expect(headerText).toBe('自定义标题');
  });

  it('shows plan type options', async () => {
    const page = await newSpecPage({
      components: [ZyghModal],
      html: `<pcm-zygh-modal is-open="true"></pcm-zygh-modal>`,
    });
    
    const planTypeOptions = page.root.shadowRoot.querySelectorAll('.plan-type-option');
    expect(planTypeOptions.length).toBe(3);
  });

  it('shows long-term plan type as default selected', async () => {
    const page = await newSpecPage({
      components: [ZyghModal],
      html: `<pcm-zygh-modal is-open="true"></pcm-zygh-modal>`,
    });
    
    const selectedOption = page.root.shadowRoot.querySelector('.plan-type-option.selected .option-label');
    expect(selectedOption.textContent).toBe('长期规划');
  });

  it('shows chat modal when conversationId is provided', async () => {
    const page = await newSpecPage({
      components: [ZyghModal],
      html: `<pcm-zygh-modal is-open="true" conversation-id="test-id"></pcm-zygh-modal>`,
    });
    
    const chatModalContainer = page.root.shadowRoot.querySelector('.chat-modal-container');
    expect(chatModalContainer).toBeTruthy();
  });

  it('does not show chat modal initially without conversationId', async () => {
    const page = await newSpecPage({
      components: [ZyghModal],
      html: `<pcm-zygh-modal is-open="true"></pcm-zygh-modal>`,
    });
    
    const chatModalContainer = page.root.shadowRoot.querySelector('.chat-modal-container');
    expect(chatModalContainer).toBeFalsy();
  });

  it('shows resume upload section', async () => {
    const page = await newSpecPage({
      components: [ZyghModal],
      html: `<pcm-zygh-modal is-open="true"></pcm-zygh-modal>`,
    });
    
    const uploadSection = page.root.shadowRoot.querySelector('.resume-upload-section');
    expect(uploadSection).toBeTruthy();
  });
}); 