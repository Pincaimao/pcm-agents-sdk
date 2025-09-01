import { Component, EventEmitter, Prop, Event, h, State, Watch } from "@stencil/core";

const formatNumber = (n: number) => {
    const str = n.toString();
    return str[1] ? str : `0${str}`;
}

// 时间转时分秒
const timeToHMS = (time: number) => {
    const hour = Math.floor(time / 3600);
    const minute = Math.floor((time - hour * 3600) / 60);
    const second = time - hour * 3600 - minute * 60;
    return `${formatNumber(hour)}:${formatNumber(minute)}:${formatNumber(second)}`;
}

@Component({
    tag: 'pcm-time-count-down',
    styleUrls: ['pcm-time-count-down.css', '../../global/global.css', '../../global/host.css'],
    shadow: true,
})
export class TimeCountDown {
    /**
     * 倒计时总秒数
     */
    @Prop() time: number;
    /**
     * 倒计时结束事件
     */
    @Event() finished: EventEmitter;

    @State() currentTime: number;

    componentWillLoad() {
        this.currentTime = this.time;
    }

    @Watch('currentTime')
    watchStateHandler(currentTime) {
        let timer;
        if (currentTime > 0) {
            timer = setTimeout(() => {
                this.currentTime = currentTime - 1;
                clearTimeout(timer);
            }, 1000);
        } else {
            this.finished.emit();
        }
    }

    render() {
        return <span>{timeToHMS(this.currentTime)}</span>
    }
}
