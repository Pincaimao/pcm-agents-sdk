import { newSpecPage } from '@stencil/core/testing';
import { PcmButton } from './pcm-button';

describe('pcm-button', () => {
  it('renders with default properties', async () => {
    const { root } = await newSpecPage({
      components: [PcmButton],
      html: '<pcm-button></pcm-button>',
    });
    expect(root).toBeTruthy();
    
    const button = root.shadowRoot.querySelector('button');
    expect(button).toHaveClass('pcm-button');
    expect(button).toHaveClass('pcm-button-default');
    expect(button).toHaveClass('pcm-button-middle');
  });

  it('renders with custom text', async () => {
    const { root } = await newSpecPage({
      components: [PcmButton],
      html: '<pcm-button text="提交"></pcm-button>',
    });
    expect(root).toBeTruthy();
    
    const buttonText = root.shadowRoot.querySelector('.button-text');
    expect(buttonText.textContent).toBe('提交');
  });

  it('renders with primary type', async () => {
    const { root } = await newSpecPage({
      components: [PcmButton],
      html: '<pcm-button type="primary"></pcm-button>',
    });
    expect(root).toBeTruthy();
    
    const button = root.shadowRoot.querySelector('button');
    expect(button).toHaveClass('pcm-button-primary');
  });

  it('renders as disabled', async () => {
    const { root } = await newSpecPage({
      components: [PcmButton],
      html: '<pcm-button disabled></pcm-button>',
    });
    expect(root).toBeTruthy();
    
    const button = root.shadowRoot.querySelector('button');
    expect(button).toHaveClass('pcm-button-disabled');
    expect(button).toHaveAttribute('disabled');
  });

  it('emits buttonClick event when clicked', async () => {
    const page = await newSpecPage({
      components: [PcmButton],
      html: '<pcm-button></pcm-button>',
    });
    
    const button = page.root;
    const buttonElement = button.shadowRoot.querySelector('button');
    
    const buttonClickSpy = jest.fn();
    button.addEventListener('buttonClick', buttonClickSpy);
    
    buttonElement.click();
    await page.waitForChanges();
    
    expect(buttonClickSpy).toHaveBeenCalled();
  });

  it('does not emit buttonClick event when disabled', async () => {
    const page = await newSpecPage({
      components: [PcmButton],
      html: '<pcm-button disabled></pcm-button>',
    });
    
    const button = page.root;
    const buttonElement = button.shadowRoot.querySelector('button');
    
    const buttonClickSpy = jest.fn();
    button.addEventListener('buttonClick', buttonClickSpy);
    
    buttonElement.click();
    await page.waitForChanges();
    
    expect(buttonClickSpy).not.toHaveBeenCalled();
  });

  it('renders with custom styles', async () => {
    const { root } = await newSpecPage({
      components: [PcmButton],
      html: '<pcm-button background-color="#ff0000" text-color="#ffffff" border-radius="8"></pcm-button>',
    });
    expect(root).toBeTruthy();
    
    const button = root.shadowRoot.querySelector('button');
    expect(button.style.backgroundColor).toBe('rgb(255, 0, 0)');
    expect(button.style.color).toBe('rgb(255, 255, 255)');
    expect(button.style.borderRadius).toBe('8px');
  });
});
