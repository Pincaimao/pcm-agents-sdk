import { Component, Prop, h, State, Watch } from '@stencil/core';
import { sendHttpRequest } from '../../utils/utils';

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

  /**
   * AI回答的文本内容，用于后续获取视频
   */
  @Prop() speechText: string = '';

  /**
   * 是否正在流式输出
   */
  @Prop() isStreaming: boolean = false;

  @State() position = { x: 20, y: 60 };
  @State() isDragging = false;
  @State() isGeneratingVideo = false;
  @State() videoUrl: string = '';
  @State() isPlaying = false;
  @State() isMuted = false;
  
  private dragStart = { x: 0, y: 0 };
  private elementStart = { x: 0, y: 0 };
  private draggableElement: HTMLElement;
  private lastCompletedText: string = '';

  @Watch('isStreaming')
  handleStreamingChange(newValue: boolean, oldValue: boolean) {
    // 当从流式输出状态变为非流式输出状态，且有文本内容时，调用视频生成接口
    if (oldValue === true && newValue === false && this.speechText && this.speechText !== this.lastCompletedText) {
      this.generateDigitalHumanVideo(this.speechText);
      this.lastCompletedText = this.speechText;
    }
  }

  private async generateDigitalHumanVideo(text: string) {
    if (!text.trim()) return;

    console.log('开始生成数字人视频，文本内容：', text);
    this.isGeneratingVideo = true;

    try {
      // 第一步：创建视频任务
      const createResponse = await sendHttpRequest({
        url: '/sdk/v1/digital-human/create-video',
        method: 'POST',
        data: {
          VirtualmanKey: "db18e00cdce54a64bdcfe826c01fdd3e",
          InputSsml: text,
          SpeechParam: {
            Speed: 1.0
          },
          VideoParam: {
            Format: "TransparentWebm"
          },
          DriverType: "Text"
        }
      });

      if (!createResponse.success) {
        throw new Error(`创建视频任务失败: ${createResponse.message}`);
      }

      const taskId = createResponse.data.Payload.TaskId;
      console.log('视频任务创建成功，TaskId:', taskId);

      // 第二步：轮询查询进度
      const videoUrl = await this.pollVideoProgress(taskId);
      
      if (videoUrl) {
        this.videoUrl = videoUrl;
        console.log('数字人视频生成完成，视频URL:', videoUrl);
      }
      
    } catch (error) {
      console.error('数字人视频生成失败:', error);
    } finally {
      this.isGeneratingVideo = false;
    }
  }

  private async pollVideoProgress(taskId: string): Promise<string | null> {
    const maxAttempts = 30; // 最大轮询次数
    const pollInterval = 2000; // 轮询间隔2秒

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await sendHttpRequest({
          url: '/sdk/v1/digital-human/query-progress',
          method: 'POST',
          data: {
            TaskId: taskId
          }
        });

        if (!response.success) {
          throw new Error(`查询进度失败: ${response.message}`);
        }

        const payload = response.data.Payload;
        console.log(`视频生成进度: ${payload.Progress}%, 状态: ${payload.Status}`);

        if (payload.Status === 'SUCCESS' && payload.Progress === 100) {
          return payload.MediaUrl;
        } else if (payload.Status === 'FAILED') {
          throw new Error(`视频生成失败: ${payload.FailMessage}`);
        }

        // 等待下次轮询
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
      } catch (error) {
        console.error('轮询视频进度失败:', error);
        break;
      }
    }

    throw new Error('视频生成超时');
  }


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
        {this.videoUrl ? (
          <video 
            src={this.videoUrl} 
            autoplay 
            playsinline 
          />
        ) : (
          <img src={this.avatar} alt="Digital Human" />
        )}
        
        
        {this.isGeneratingVideo && (
          <div class="generating-indicator">
            <div class="loading-spinner"></div>
          </div>
        )}
      </div>
    );
  }
} 