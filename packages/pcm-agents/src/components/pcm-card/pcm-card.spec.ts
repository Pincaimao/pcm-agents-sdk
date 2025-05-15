import { newSpecPage } from '@stencil/core/testing';
import { PcmCard } from './pcm-card';

describe('pcm-card', () => {
  it('renders with title and description', async () => {
    const { root } = await newSpecPage({
      components: [PcmCard],
      html: '<pcm-card title="JD助手" description="帮助您快速生成职位描述"></pcm-card>',
    });
    expect(root).toBeTruthy();
    
    const title = root.shadowRoot.querySelector('.card-title');
    const description = root.shadowRoot.querySelector('.card-description');
    
    expect(title.textContent).toBe('JD助手');
    expect(description.textContent).toBe('帮助您快速生成职位描述');
  });

  it('emits cardClick event when clicked', async () => {
    const page = await newSpecPage({
      components: [PcmCard],
      html: '<pcm-card></pcm-card>',
    });
    
    const card = page.root;
    const cardContainer = card.shadowRoot.querySelector('.card-container') as HTMLElement;
    
    const cardClickSpy = jest.fn();
    card.addEventListener('cardClick', cardClickSpy);
    
    cardContainer.click();
    await page.waitForChanges();
    
    expect(cardClickSpy).toHaveBeenCalled();
  });
}); 