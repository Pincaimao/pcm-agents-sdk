import { Component, Prop, h, State, Watch, Event, EventEmitter } from '@stencil/core';
import { sendHttpRequest } from '../../utils/utils';

@Component({
  tag: 'pcm-digital-human',
  styleUrls: ['pcm-digital-human.css', '../../global/host.css'],
  shadow: true,
})
export class PcmDigitalHuman {
  /**
   * 数字人ID，用于指定数字人形象
   */
  @Prop() digitalId: string;

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
  @State() dynamicDefaultVideoUrl: string = '';
  @State() dynamicVirtualmanKey: string = '';
  
  private videoElement: HTMLVideoElement;
  private lastCompletedText: string = '';

  /**
   * 视频播放完成事件
   */
  @Event() videoEnded: EventEmitter<{
    videoUrl: string;
  }>;

  /**
   * 视频生成成功事件
   */
  @Event() videoGenerated: EventEmitter<{
    videoUrl: string;
  }>;

  /**
   * 数字人详情加载完成事件
   */
  @Event() avatarDetailLoaded: EventEmitter<{
    defaultVideoUrl: string;
    virtualmanKey: string;
  }>;

  async componentWillLoad() {
    // 如果有digitalId，先获取数字人详情
    if (this.digitalId) {
      await this.fetchAvatarDetail();
    }
    
    // 设置当前视频URL，优先使用接口获取的值，如果没有则显示提示
    this.currentVideoUrl = this.dynamicDefaultVideoUrl || '';
  }

  componentDidLoad() {
    // 设置视频元素的初始源
    if (this.videoElement && this.currentVideoUrl) {
      this.videoElement.src = this.currentVideoUrl;
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

  /**
   * 获取数字人详情
   */
  private async fetchAvatarDetail() {
    if (!this.digitalId) return;

    console.log('开始获取数字人详情，digitalId:', this.digitalId);

    try {
      const response = await sendHttpRequest({
        url: '/sdk/v1/virtual-human/avatar-detail',
        method: 'POST',
        data: {
          avatar_id: this.digitalId
        }
      });

      if (!response.success) {
        throw new Error(`获取数字人详情失败: ${response.message}`);
      }
      console.log(response);
      

      const { placeholder_video_url, virtualman_key } = response.data;
      
      if (placeholder_video_url) {
        this.dynamicDefaultVideoUrl = placeholder_video_url;
      }
      
      if (virtualman_key) {
        this.dynamicVirtualmanKey = virtualman_key;
      }

      // 发射数字人详情加载完成事件
      this.avatarDetailLoaded.emit({
        defaultVideoUrl: this.dynamicDefaultVideoUrl,
        virtualmanKey: this.dynamicVirtualmanKey
      });

    } catch (error) {
      console.error('获取数字人详情失败:', error);
    } 
  }

  private async generateDigitalHumanVideo(text: string) {
    if (!text.trim()) return;

    console.log('开始生成数字人视频，文本内容：', text);

    // 验证是否有VirtualmanKey
    if (!this.dynamicVirtualmanKey) {
      console.error('缺少VirtualmanKey，无法生成数字人视频');
      return;
    }

    const virtualmanKey = this.dynamicVirtualmanKey;

    try {
      // 第一步：创建视频任务
      const createResponse = await sendHttpRequest({
        url: '/sdk/v1/virtual-human/create-video',
        method: 'POST',
        data: {
          VirtualmanKey: virtualmanKey,
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
          url: '/sdk/v1/virtual-human/query-progress',
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
      
      // 发射视频生成成功事件
      this.videoGenerated.emit({
        videoUrl: videoUrl
      });
      
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
      
      // 即使预加载失败也发射事件
      this.videoGenerated.emit({
        videoUrl: videoUrl
      });
      
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
      const defaultUrl = this.dynamicDefaultVideoUrl;
      this.currentVideoUrl = defaultUrl;
      this.isPlayingGenerated = false;
      
      // 平滑切换回默认视频
      requestAnimationFrame(() => {
        if (this.videoElement) {
          // 先暂停当前视频
          this.videoElement.pause();
          // 设置回默认视频源
          this.videoElement.src = defaultUrl;
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