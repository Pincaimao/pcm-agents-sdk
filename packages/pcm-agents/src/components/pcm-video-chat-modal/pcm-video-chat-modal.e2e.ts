import { newE2EPage } from '@stencil/core/testing';

describe('pcm-video-chat-modal', () => {
  it('renders when isOpen is true', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-video-chat-modal is-open="true"></pcm-video-chat-modal>');
    
    const element = await page.find('pcm-video-chat-modal >>> .modal-overlay');
    expect(element).not.toBeNull();
  });

  it('does not render when isOpen is false', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-video-chat-modal is-open="false"></pcm-video-chat-modal>');
    
    const element = await page.find('pcm-video-chat-modal >>> .modal-overlay');
    expect(element).toBeNull();
  });

  it('sends a message when clicking send button', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-video-chat-modal is-open="true"></pcm-video-chat-modal>');
    
    const input = await page.find('pcm-video-chat-modal >>> input');
    await input.type('你好');
    
    const sendButton = await page.find('pcm-video-chat-modal >>> .send-button');
    await sendButton.click();
    
    await page.waitForChanges();
    
    const userMessage = await page.find('pcm-video-chat-modal >>> .user-message');
    expect(userMessage).not.toBeNull();
  });
}); 