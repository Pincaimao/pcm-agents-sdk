import { Component, Prop, h, State, Watch, Event, EventEmitter } from '@stencil/core';
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
  @Prop() avatar: string = 'https://virtualhuman-cos-test-1251316161.cos.ap-nanjing.myqcloud.com/prod/resource-manager/small/57/158/23228/model_32764_20250321201819/preview.png';

  /**
   * 默认视频URL
   */
  @Prop() defaultVideoUrl: string = 'https://pcm-resource-1312611446.cos.ap-guangzhou.myqcloud.com/shuziren/db18e00cdce54a64bdcfe826c01fdd3e.webm';

  /**
   * AI回答的文本内容，用于后续获取视频
   */
  @Prop() speechText: string = '';

  /**
   * 是否正在流式输出
   */
  @Prop() isStreaming: boolean = false;

  @State() generatedVideoUrl: string = '';
  @State() currentVideoUrl: string = '';
  @State() isPlayingGenerated = false;
  
  private videoElement: HTMLVideoElement;
  private lastCompletedText: string = '';

  /**
   * 视频播放完成事件
   */
  @Event() videoEnded: EventEmitter<{
    videoUrl: string;
  }>;

  componentWillLoad() {
    // 初始化时设置默认视频，避免在componentDidLoad中修改state
    this.currentVideoUrl = this.defaultVideoUrl;
  }

  componentDidLoad() {
    // 设置视频元素的初始源
    if (this.videoElement) {
      this.videoElement.src = this.defaultVideoUrl;
    }
  }

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

    try {
      // 第一步：创建视频任务
      const createResponse = await sendHttpRequest({
        url: '/sdk/v1/digital-human/create-video',
        method: 'POST',
        data: {
          VirtualmanKey: "db18e00cdce54a64bdcfe826c01fdd3e",
          InputSsml: text,
          SpeechParam: {
            Speed: 1
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
        this.generatedVideoUrl = videoUrl;
        this.playGeneratedVideo(videoUrl);
        console.log('数字人视频生成完成，视频URL:', videoUrl);
      }
      
    } catch (error) {
      console.error('数字人视频生成失败:', error);
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

  private async preloadVideo(videoUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const preloadVideo = document.createElement('video');
      preloadVideo.preload = 'auto';
      preloadVideo.src = videoUrl;
      
      const handleCanPlay = () => {
        console.log('视频预加载完成:', videoUrl);
        preloadVideo.removeEventListener('canplaythrough', handleCanPlay);
        preloadVideo.removeEventListener('error', handleError);
        resolve();
      };
      
      const handleError = () => {
        console.error('视频预加载失败:', videoUrl);
        preloadVideo.removeEventListener('canplaythrough', handleCanPlay);
        preloadVideo.removeEventListener('error', handleError);
        reject(new Error('视频预加载失败'));
      };
      
      preloadVideo.addEventListener('canplaythrough', handleCanPlay);
      preloadVideo.addEventListener('error', handleError);
      
      // 开始加载
      preloadVideo.load();
    });
  }

  private async playGeneratedVideo(videoUrl: string) {
    console.log('开始预加载生成的视频...');
    
    try {
      // 先预加载视频
      await this.preloadVideo(videoUrl);
      
      // 预加载完成后切换视频
      this.currentVideoUrl = videoUrl;
      this.isPlayingGenerated = true;
      
      // 平滑切换视频：等待下一帧再操作视频元素
      requestAnimationFrame(() => {
        if (this.videoElement) {
          // 先暂停当前视频
          this.videoElement.pause();
          // 设置新的视频源
          this.videoElement.src = videoUrl;
          // 生成的视频不循环播放
          this.videoElement.loop = false;
          // 播放新视频
          this.videoElement.play().catch(error => {
            console.error('播放生成视频失败:', error);
          });
        }
      });
    } catch (error) {
      console.error('预加载视频失败，直接切换:', error);
      // 如果预加载失败，直接切换（保持原有逻辑）
      this.currentVideoUrl = videoUrl;
      this.isPlayingGenerated = true;
      
      requestAnimationFrame(() => {
        if (this.videoElement) {
          this.videoElement.pause();
          this.videoElement.src = videoUrl;
          this.videoElement.loop = false;
          this.videoElement.play().catch(error => {
            console.error('播放生成视频失败:', error);
          });
        }
      });
    }
  }

  private handleVideoEnded = () => {
    if (this.isPlayingGenerated) {
      // 只有生成的视频播放完成时才发射事件
      this.videoEnded.emit({
        videoUrl: this.currentVideoUrl,
      });

      // 生成的视频播放完毕，恢复默认视频循环播放
      this.currentVideoUrl = this.defaultVideoUrl;
      this.isPlayingGenerated = false;
      
      // 平滑切换回默认视频
      requestAnimationFrame(() => {
        if (this.videoElement) {
          // 先暂停当前视频
          this.videoElement.pause();
          // 设置回默认视频源
          this.videoElement.src = this.defaultVideoUrl;
          // 设置循环播放并开始播放
          this.videoElement.loop = true;
          this.videoElement.play().catch(error => {
            console.error('播放默认视频失败:', error);
          });
        }
      });
    }
  };

  render() {
    return (
      <div class="digital-human-container">
        <video 
          autoplay 
          playsinline 
          loop
          onEnded={this.handleVideoEnded}
          ref={el => (this.videoElement = el as HTMLVideoElement)}
        />
      </div>
    );
  }
} 