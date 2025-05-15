import { Component, Prop, h, Event, EventEmitter, Watch, Method, Element } from '@stencil/core';

/**
 * 抽屉组件
 * 从屏幕边缘滑出的浮层面板，类似 Ant Design 的 Drawer 组件
 */
@Component({
  tag: 'pcm-drawer',
  styleUrl: 'pcm-drawer.css',
  shadow: true,
})
export class PcmDrawer {
  /**
   * 抽屉是否可见
   */
  @Prop({ mutable: true, reflect: true }) isOpen: boolean = false;

  /**
   * 抽屉标题
   */
  @Prop() drawerTitle: string = '';

  /**
   * 宽度，可以是像素值或百分比
   */
  @Prop() width: string = '378px';

  /**
   * 高度，在 placement 为 top 或 bottom 时使用
   */
  @Prop() height: string = '378px';

  /**
   * 设置 z-index
   */
  @Prop() zIndex: number = 1000;

  /**
   * 是否显示关闭按钮
   */
  @Prop() closable: boolean = true;

  /**
   * 点击蒙层是否允许关闭
   */
  @Prop() maskClosable: boolean = true;

  /**
   * 是否显示蒙层
   */
  @Prop() mask: boolean = true;

  /**
   * 抽屉关闭后的回调
   */
  @Event() closed: EventEmitter<void>;

  /**
   * 抽屉打开后的回调
   */
  @Event() afterOpen: EventEmitter<void>;

  /**
   * 抽屉关闭后的回调
   */
  @Event() afterClose: EventEmitter<void>;

  @Element() hostElement: HTMLElement;

  private bodyOverflowBeforeOpen: string = '';
  private transitionEndHandler: () => void;

  /**
   * 打开抽屉
   */
  @Method()
  async open() {
    this.isOpen = true;
  }

  /**
   * 关闭抽屉
   */
  @Method()
  async close() {
    this.isOpen = false;
  }

  @Watch('isOpen')
  visibleChanged(newValue: boolean) {
    if (newValue) {
      // 打开抽屉时，禁止背景滚动
      this.bodyOverflowBeforeOpen = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      // 添加过渡结束事件监听器
      const drawer = this.hostElement.shadowRoot.querySelector('.drawer-content') as HTMLElement;
      if (drawer) {
        this.transitionEndHandler = () => {
          this.afterOpen.emit();
        };
        drawer.addEventListener('transitionend', this.transitionEndHandler, { once: true });
      }
    } else {
      // 关闭抽屉时，恢复背景滚动
      document.body.style.overflow = this.bodyOverflowBeforeOpen;
      
      // 添加过渡结束事件监听器
      const drawer = this.hostElement.shadowRoot.querySelector('.drawer-content') as HTMLElement;
      if (drawer) {
        this.transitionEndHandler = () => {
          this.afterClose.emit();
        };
        drawer.addEventListener('transitionend', this.transitionEndHandler, { once: true });
      }
    }
  }

  disconnectedCallback() {
    // 组件卸载时恢复背景滚动
    if (this.isOpen) {
      document.body.style.overflow = this.bodyOverflowBeforeOpen;
    }
    
    // 移除事件监听器
    const drawer = this.hostElement.shadowRoot?.querySelector('.drawer-content') as HTMLElement;
    if (drawer && this.transitionEndHandler) {
      drawer.removeEventListener('transitionend', this.transitionEndHandler);
    }
  }

  private handleMaskClick = () => {
    if (this.maskClosable) {
      this.handleClose();
    }
  };

  private handleClose = () => {
    this.isOpen = false;
    this.closed.emit();
  };

  render() {
    const drawerStyle = {
      width: this.width,
      zIndex: `${this.zIndex + 1}`,
    };

    const maskStyle = {
      zIndex: `${this.zIndex}`,
    };

    return (
      <div class={{ 'drawer-container': true, 'drawer-open': this.isOpen }}>
        {this.mask && (
          <div 
            class={{ 'drawer-mask': true, 'mask-visible': this.isOpen }} 
            style={maskStyle}
            onClick={this.handleMaskClick}
          ></div>
        )}
        <div 
          class={{ 'drawer-content': true, 'drawer-content-visible': this.isOpen }} 
          style={drawerStyle}
        >
          <div class="drawer-header">
            {this.drawerTitle && <div class="drawer-title">{this.drawerTitle}</div>}
            {this.closable && (
              <button class="drawer-close" onClick={this.handleClose}>
                <svg viewBox="64 64 896 896" focusable="false" data-icon="close" width="1em" height="1em" fill="currentColor" aria-hidden="true">
                  <path d="M563.8 512l262.5-312.9c4.4-5.2.7-13.1-6.1-13.1h-79.8c-4.7 0-9.2 2.1-12.3 5.7L511.6 449.8 295.1 191.7c-3-3.6-7.5-5.7-12.3-5.7H203c-6.8 0-10.5 7.9-6.1 13.1L459.4 512 196.9 824.9A7.95 7.95 0 00203 838h79.8c4.7 0 9.2-2.1 12.3-5.7l216.5-258.1 216.5 258.1c3 3.6 7.5 5.7 12.3 5.7h79.8c6.8 0 10.5-7.9 6.1-13.1L563.8 512z"></path>
                </svg>
              </button>
            )}
          </div>
          <div class="drawer-body">
            <slot></slot>
          </div>
        </div>
      </div>
    );
  }
} 