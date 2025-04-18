import { newE2EPage } from '@stencil/core/testing';

describe('pcm-zygh-modal', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-zygh-modal is-open="true"></pcm-zygh-modal>');

    const element = await page.find('pcm-zygh-modal');
    expect(element).toHaveClass('hydrated');
  });

  it('displays modal when isOpen is true', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-zygh-modal is-open="true"></pcm-zygh-modal>');

    const modalContainer = await page.find('pcm-zygh-modal >>> .modal-container');
    expect(modalContainer).not.toBeNull();
  });

  it('does not display modal when isOpen is false', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-zygh-modal is-open="false"></pcm-zygh-modal>');

    const modalContainer = await page.find('pcm-zygh-modal >>> .modal-container');
    expect(modalContainer).toBeNull();
  });

  it('emits modalClosed event when close button is clicked', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-zygh-modal is-open="true"></pcm-zygh-modal>');

    const closeButton = await page.find('pcm-zygh-modal >>> .close-button');
    
    const modalClosedEvent = await page.spyOnEvent('modalClosed');
    
    await closeButton.click();
    
    expect(modalClosedEvent).toHaveReceivedEvent();
  });

  it('displays plan type options', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-zygh-modal is-open="true"></pcm-zygh-modal>');

    const planTypeOptions = await page.findAll('pcm-zygh-modal >>> .plan-type-option');
    expect(planTypeOptions.length).toBe(3);
  });

  it('changes selected plan type when option is clicked', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-zygh-modal is-open="true"></pcm-zygh-modal>');

    const careerChangeOption = await page.find('pcm-zygh-modal >>> .plan-type-option:nth-child(2)');
    await careerChangeOption.click();

    const selectedOption = await page.find('pcm-zygh-modal >>> .plan-type-option.selected');
    expect(selectedOption.textContent).toContain('转行建议');
  });

  it('shows chat modal when conversationId is provided', async () => {
    const page = await newE2EPage();
    await page.setContent('<pcm-zygh-modal is-open="true" conversation-id="test-id"></pcm-zygh-modal>');

    const chatModalContainer = await page.find('pcm-zygh-modal >>> .chat-modal-container');
    expect(chatModalContainer).not.toBeNull();
  });
}); 