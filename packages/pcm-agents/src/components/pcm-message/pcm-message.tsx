import { Component, h, Prop, State, Element, Method } from '@stencil/core';

@Component({
  tag: 'pcm-message',
  styleUrls: ['pcm-message.css', '../../global/host.css'],
  shadow: true,
})
export class PcmMessage {
  @Element() el: HTMLElement;
  @Prop() content: string = '';
  @Prop() type: 'success' | 'error' | 'info' | 'warning' = 'info';
  @Prop() duration: number = 3000;
  @State() visible: boolean = false;

  private timer: number;

  componentWillLoad() {
    if (this.content) {
      this.visible = true;
    }
  }

  componentDidLoad() {
    if (this.visible && this.duration > 0) {
      this.timer = window.setTimeout(() => {
        this.close();
      }, this.duration);
    }
  }

  disconnectedCallback() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  @Method()
  async show() {
    this.visible = true;
    
    if (this.duration > 0) {
      this.timer = window.setTimeout(() => {
        this.close();
      }, this.duration);
    }
  }

  @Method()
  async close() {
    this.visible = false;
    
    // 等待动画结束后移除元素
    setTimeout(() => {
      if (this.el && this.el.parentNode) {
        this.el.parentNode.removeChild(this.el);
      }
    }, 300);
  }

  render() {
    return (
      <div class={{
        'pcm-message': true,
        'pcm-message-visible': this.visible,
        [`pcm-message-${this.type}`]: true
      }}>
        <div class="pcm-message-content">
          <span class="pcm-message-icon">
            {this.renderIcon()}
          </span>
          <span class="pcm-message-text">{this.content}</span>
        </div>
      </div>
    );
  }

  private renderIcon() {
    switch (this.type) {
      case 'success':
        return <svg viewBox="64 64 896 896" width="16px" height="16px" fill="currentColor"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm193.5 301.7l-210.6 292a31.8 31.8 0 01-51.7 0L318.5 484.9c-3.8-5.3 0-12.7 6.5-12.7h46.9c10.2 0 19.9 4.9 25.9 13.3l71.2 98.8 157.2-218c6-8.3 15.6-13.3 25.9-13.3H699c6.5 0 10.3 7.4 6.5 12.7z"></path></svg>;
      case 'error':
        return <svg viewBox="64 64 896 896" width="16px" height="16px" fill="currentColor"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm165.4 618.2l-66-.3L512 563.4l-99.3 118.4-66.1.3c-4.4 0-8-3.5-8-8 0-1.9.7-3.7 1.9-5.2l130.1-155L340.5 359a8.32 8.32 0 01-1.9-5.2c0-4.4 3.6-8 8-8l66.1.3L512 464.6l99.3-118.4 66-.3c4.4 0 8 3.5 8 8 0 1.9-.7 3.7-1.9 5.2L553.5 514l130 155c1.2 1.5 1.9 3.3 1.9 5.2 0 4.4-3.6 8-8 8z"></path></svg>;
      case 'warning':
        return <svg viewBox="64 64 896 896" width="16px" height="16px" fill="currentColor"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm-32 232c0-4.4 3.6-8 8-8h48c4.4 0 8 3.6 8 8v272c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8V296zm32 440a48.01 48.01 0 010-96 48.01 48.01 0 010 96z"></path></svg>;
      default: // info
        return <svg viewBox="64 64 896 896" width="16px" height="16px" fill="currentColor"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 664c-30.9 0-56-25.1-56-56 0-30.9 25.1-56 56-56s56 25.1 56 56c0 30.9-25.1 56-56 56zm32-296c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8V248c0-4.4 3.6-8 8-8h48c4.4 0 8 3.6 8 8v184z"></path></svg>;
    }
  }
} 