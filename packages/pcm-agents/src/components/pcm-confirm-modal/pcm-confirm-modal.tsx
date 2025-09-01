import { Component, Prop, h, Event, EventEmitter, Watch, Method, Element, State } from '@stencil/core';
import { configStore } from '../../../store/config.store';

/**
 * 确认模态框组件
 * 通用的确认对话框组件，类似 Ant Design 的 Modal 组件
 */
@Component({
  tag: 'pcm-confirm-modal',
  styleUrls: ['pcm-confirm-modal.css', '../../global/host.css'],
  shadow: true,
})
export class PcmConfirmModal {
  /**
   * 模态框是否可见
   */
  @Prop({ mutable: true, reflect: true }) isOpen: boolean = false;

  /**
   * 模态框标题
   */
  @Prop() modalTitle: string = '确认';

  /**
   * 确认按钮文本
   */
  @Prop() okText: string = '确认';

  /**
   * 取消按钮文本
   */
  @Prop() cancelText: string = '取消';

  /**
   * 确认按钮类型
   */
  @Prop() okType: 'default' | 'primary' | 'danger' = 'primary';

  /**
   * 点击蒙层是否允许关闭
   */
  @Prop() maskClosable: boolean = true;

  /**
   * 是否显示蒙层
   */
  @Prop() mask: boolean = true;

  /**
   * 是否居中显示
   */
  @Prop() centered: boolean = true;

  /**
   * 父级模态框的z-index值，确认模态框会在此基础上增加层级
   */
  @Prop({ attribute: 'parent-z-index' }) parentZIndex?: number;

  /**
   * 确认按钮点击事件
   */
  @Event() ok: EventEmitter<void>;

  /**
   * 取消按钮点击事件
   */
  @Event() cancel: EventEmitter<void>;

  /**
   * 模态框关闭后的回调
   */
  @Event() closed: EventEmitter<void>;

  /**
   * 模态框打开后的回调
   */
  @Event() afterOpen: EventEmitter<void>;

  /**
   * 模态框关闭后的回调
   */
  @Event() afterClose: EventEmitter<void>;

  @Element() hostElement: HTMLElement;

  @State() zIndex: number = 2000;

  private bodyOverflowBeforeOpen: string = '';
  private transitionEndHandler: () => void;

  /**
   * 打开模态框
   */
  @Method()
  async open() {
    this.isOpen = true;
  }

  /**
   * 关闭模态框
   */
  @Method()
  async close() {
    this.isOpen = false;
  }

  @Watch('isOpen')
  visibleChanged(newValue: boolean) {
    if (newValue) {
      // 打开模态框时，禁止背景滚动
      this.bodyOverflowBeforeOpen = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      // 添加过渡结束事件监听器
      const modal = this.hostElement.shadowRoot.querySelector('.modal-wrapper') as HTMLElement;
      if (modal) {
        this.transitionEndHandler = () => {
          this.afterOpen.emit();
        };
        modal.addEventListener('transitionend', this.transitionEndHandler, { once: true });
      }
    } else {
      // 关闭模态框时，恢复背景滚动
      document.body.style.overflow = this.bodyOverflowBeforeOpen;
      
      // 添加过渡结束事件监听器
      const modal = this.hostElement.shadowRoot.querySelector('.modal-wrapper') as HTMLElement;
      if (modal) {
        this.transitionEndHandler = () => {
          this.afterClose.emit();
        };
        modal.addEventListener('transitionend', this.transitionEndHandler, { once: true });
      }
    }
  }

  componentWillLoad() {
    // 尝试从缓存中读取 zIndex
    const cachedZIndex = configStore.getItem<number>('modal-zIndex');
    if (cachedZIndex) {
      this.zIndex = cachedZIndex + 1000; // 确保比其他模态框更高
    }
  }

  disconnectedCallback() {
    // 组件卸载时恢复背景滚动
    if (this.isOpen) {
      document.body.style.overflow = this.bodyOverflowBeforeOpen;
    }
    
    // 移除事件监听器
    const modal = this.hostElement.shadowRoot?.querySelector('.modal-wrapper') as HTMLElement;
    if (modal && this.transitionEndHandler) {
      modal.removeEventListener('transitionend', this.transitionEndHandler);
    }
  }

  private handleMaskClick = () => {
    if (this.maskClosable) {
      this.handleCancel();
    }
  };

  private handleOk = () => {
    this.ok.emit();
  };

  private handleCancel = () => {
    this.cancel.emit();
    this.isOpen = false;
    this.closed.emit();
  };

  render() {
    const modalStyle = {
      zIndex: `${this.zIndex + 1}`,
    };

    const maskStyle = {
      zIndex: `${this.zIndex}`,
    };

    const containerClass = {
      'confirm-modal-container': true,
      'modal-open': this.isOpen
    };

    const contentClass = {
      'confirm-modal-content': true, 
      'modal-content-visible': this.isOpen,
      'centered': this.centered
    };

    const okButtonClass = {
      'modal-button': true,
      'ok-button': true,
      [`ok-${this.okType}`]: true
    };

    return (
      <div class={containerClass}>
        {this.mask && (
          <div 
            class={{ 'confirm-modal-mask': true, 'mask-visible': this.isOpen }} 
            style={maskStyle}
            onClick={this.handleMaskClick}
          ></div>
        )}
        <div 
          class={contentClass}
          style={modalStyle}
        >
          <div class="modal-wrapper">
            <div class="modal-header">
              <div class="modal-title">{this.modalTitle}</div>
            </div>
            
            <div class="modal-body">
              <slot></slot>
            </div>
            
            <div class="modal-footer">
              <button 
                class="modal-button cancel-button"
                onClick={this.handleCancel}
              >
                {this.cancelText}
              </button>
              <button 
                class={okButtonClass}
                onClick={this.handleOk}
              >
                {this.okText}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
} 