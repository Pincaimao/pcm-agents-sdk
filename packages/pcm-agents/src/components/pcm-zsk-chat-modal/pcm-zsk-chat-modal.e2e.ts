import { newE2EPage } from '@stencil/core/testing';

describe('pcm-zsk-chat-modal', () => {
  it('renders when isOpen is true', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-zsk-chat-modal is-open="true"></pcm-zsk-chat-modal>');
    
    const element = await page.find('pcm-zsk-chat-modal >>> .modal-overlay');
    expect(element).not.toBeNull();
  });

  it('does not render when isOpen is false', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-zsk-chat-modal is-open="false"></pcm-zsk-chat-modal>');
    
    const element = await page.find('pcm-zsk-chat-modal >>> .modal-overlay');
    expect(element).toBeNull();
  });

  it('sends a message when clicking send button', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-zsk-chat-modal is-open="true"></pcm-zsk-chat-modal>');
    
    const input = await page.find('pcm-zsk-chat-modal >>> input');
    await input.type('你好');
    
    const sendButton = await page.find('pcm-zsk-chat-modal >>> .send-button');
    await sendButton.click();
    
    // 等待消息显示 - 使用 waitForChanges 替代 waitForTimeout
    await page.waitForChanges();
    
    const userMessage = await page.find('pcm-zsk-chat-modal >>> .user-message');
    expect(userMessage).not.toBeNull();
  });
}); 