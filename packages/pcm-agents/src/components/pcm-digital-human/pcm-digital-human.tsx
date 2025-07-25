import { Component, Prop, h, State } from '@stencil/core';

@Component({
  tag: 'pcm-digital-human',
  styleUrl: 'pcm-digital-human.css',
  shadow: true,
})
export class PcmDigitalHuman {

  /**
   * 头像URL
   */
  @Prop() avatar: string = 'https://i.postimg.cc/pX01n0zS/image.png';

  /**
   * 拖拽的边界容器元素
   */
  @Prop() containerElement: HTMLElement;

  @State() position = { x: 20, y: 80 };
  @State() isDragging = false;
  private dragStart = { x: 0, y: 0 };
  private elementStart = { x: 0, y: 0 };
  private draggableElement: HTMLElement;

  private handleMouseDown = (e: MouseEvent) => {
    this.isDragging = true;
    this.dragStart = { x: e.clientX, y: e.clientY };
    this.elementStart = { ...this.position };
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isDragging) return;
    const dx = e.clientX - this.dragStart.x;
    const dy = e.clientY - this.dragStart.y;
    let newX = this.elementStart.x + dx;
    let newY = this.elementStart.y + dy;

    if (this.containerElement && this.draggableElement) {
      const containerWidth = this.containerElement.clientWidth;
      const containerHeight = this.containerElement.clientHeight;
      const digitalHumanWidth = this.draggableElement.offsetWidth;
      const digitalHumanHeight = this.draggableElement.offsetHeight;

      const minX = 0;
      const maxX = containerWidth - digitalHumanWidth;
      const minY = 0;
      const maxY = containerHeight - digitalHumanHeight;

      newX = Math.max(minX, Math.min(newX, maxX));
      newY = Math.max(minY, Math.min(newY, maxY));
    }

    this.position = {
      x: newX,
      y: newY,
    };
  };

  private handleMouseUp = () => {
    this.isDragging = false;
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  };

  private handleTouchStart = (e: TouchEvent) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    this.isDragging = true;
    const touch = e.touches[0];
    this.dragStart = { x: touch.clientX, y: touch.clientY };
    this.elementStart = { ...this.position };
    document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd);
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (!this.isDragging) return;
    if (e.cancelable) {
      e.preventDefault();
    }
    const touch = e.touches[0];
    const dx = touch.clientX - this.dragStart.x;
    const dy = touch.clientY - this.dragStart.y;
    let newX = this.elementStart.x + dx;
    let newY = this.elementStart.y + dy;

    if (this.containerElement && this.draggableElement) {
      const containerWidth = this.containerElement.clientWidth;
      const containerHeight = this.containerElement.clientHeight;
      const digitalHumanWidth = this.draggableElement.offsetWidth;
      const digitalHumanHeight = this.draggableElement.offsetHeight;

      const minX = 0;
      const maxX = containerWidth - digitalHumanWidth;
      const minY = 0;
      const maxY = containerHeight - digitalHumanHeight;

      newX = Math.max(minX, Math.min(newX, maxX));
      newY = Math.max(minY, Math.min(newY, maxY));
    }

    this.position = {
      x: newX,
      y: newY,
    };
  };

  private handleTouchEnd = () => {
    this.isDragging = false;
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
  };

  render() {

    return (
      <div
        class="digital-human-container"
        ref={el => (this.draggableElement = el as HTMLElement)}
        style={{
          left: `${this.position.x}px`,
          top: `${this.position.y}px`,
          cursor: this.isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={this.handleMouseDown}
        onTouchStart={this.handleTouchStart}
      >
        <img src={this.avatar} alt="Digital Human" />
      </div>
    );
  }
} 