import { Component, Prop, Event, EventEmitter, h } from '@stencil/core';

@Component({
  tag: 'float-image',
  styleUrl: 'float-image.css',
  shadow: true,
})
export class FloatImage {
  /**
   * 图片的URL地址
   */
  @Prop() src: string;

  /**
   * 图片的替代文本
   */
  @Prop() alt: string = '浮窗图片';

  /**
   * 图片的宽度
   */
  @Prop() width: string = '60px';

  /**
   * 图片的高度
   */
  @Prop() height: string = '60px';

  /**
   * 点击图片时触发的事件
   */
  @Event() floatImageClick: EventEmitter<void>;

  private handleClick = () => {
    console.log('图片被点击了，正在触发事件...');
    this.floatImageClick.emit();
  }

  render() {
    return (
      <div class="float-container" onClick={this.handleClick}>
        <img 
          src={this.src} 
          alt={this.alt} 
          width={this.width} 
          height={this.height}
        />
      </div>
    );
  }
} 