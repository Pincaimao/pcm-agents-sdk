import { Component, Prop, h} from '@stencil/core';

/**
 * 按钮组件
 * 一个简化版的类似于 ant-design 的按钮组件，支持自定义文字、颜色、圆角等属性
 */
@Component({
  tag: 'pcm-button',
  styleUrl: 'pcm-button.css',
  shadow: true,
})
export class PcmButton {
  /**
   * 按钮类型
   * 可选值: 'primary', 'default', 'dashed', 'text', 'link'
   */
  @Prop() type: 'primary' | 'default' | 'dashed' | 'text' | 'link' = 'default';

  /**
   * 按钮尺寸
   * 可选值: 'large', 'middle', 'small'
   */
  @Prop() size: 'large' | 'middle' | 'small' = 'middle';

  /**
   * 是否为加载状态
   */
  @Prop() loading: boolean = false;

  /**
   * 是否为禁用状态
   */
  @Prop() disabled: boolean = false;

  /**
   * 设置按钮的图标
   * 使用图标的URL或者base64字符串
   */
  @Prop() icon: string = 'https://pub.pincaimao.com/static/common/i_pcm_logo.png';


  /**
   * 自定义按钮形状
   * 可选值: 'default', 'circle', 'round'
   */
  @Prop() shape: 'default' | 'circle' | 'round' = 'default';

  /**
   * 自定义按钮背景色
   */
  @Prop() backgroundColor: string = '';

  /**
   * 自定义按钮文字颜色
   */
  @Prop() textColor: string = '';

  /**
   * 自定义按钮边框颜色
   */
  @Prop() borderColor: string = '';

  /**
   * 自定义按钮圆角大小（像素）
   */
  @Prop() borderRadius: number = null;

  /**
   * 按钮宽度（像素或百分比）
   */
  @Prop() width: string = '';

  /**
   * 是否为块级按钮（宽度撑满父元素）
   */
  @Prop() block: boolean = false;

  /**
   * 按钮边框样式
   * 可选值: 'solid', 'dashed', 'dotted', 'none'
   */
  @Prop() borderStyle: 'solid' | 'dashed' | 'dotted' | 'none' = 'solid';

  render() {
    // 计算样式类名
    const classes = {
      'pcm-button': true,
      [`pcm-button-${this.type}`]: true,
      [`pcm-button-${this.size}`]: true,
      [`pcm-button-${this.shape}`]: true,
      'pcm-button-loading': this.loading,
      'pcm-button-disabled': this.disabled,
      'pcm-button-block': this.block
    };

    // 计算自定义样式
    const customStyle = {};
    if (this.backgroundColor) {
      customStyle['backgroundColor'] = this.backgroundColor;
    }
    if (this.textColor) {
      customStyle['color'] = this.textColor;
    }
    if (this.borderColor) {
      customStyle['borderColor'] = this.borderColor;
    }
    if (this.borderRadius !== null) {
      customStyle['borderRadius'] = `${this.borderRadius}px`;
    }
    if (this.width) {
      customStyle['width'] = this.width;
    }
    if (this.borderStyle) {
      customStyle['borderStyle'] = this.borderStyle;
    }

    return (
      <button
        class={Object.keys(classes).filter(key => classes[key]).join(' ')}
        style={customStyle}
        disabled={this.disabled}
        type="button"
      >
        {this.loading && (
          <span class="loading-icon"></span>
        )}
        {this.icon && !this.loading && (
          <span class="button-icon">
            <img src={this.icon} alt="" />
          </span>
        )}
        <slot />
      </button>
    );
  }
}
