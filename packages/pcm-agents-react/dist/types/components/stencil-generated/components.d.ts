import type { EventName, StencilReactComponent } from '@stencil/react-output-target/runtime';
import { type CareerPlanType, type ChatMessage, type ConversationStartEventData, type ErrorEventDetail, type FileUploadResponse, type InterviewCompleteEventData, type Pcm1zhanshiMnmsModalCustomEvent, type PcmAppChatModalCustomEvent, type PcmChatMessageCustomEvent, type PcmHrChatModalCustomEvent, type PcmHtwsModalCustomEvent, type PcmHyzjModalCustomEvent, type PcmJdModalCustomEvent, type PcmJlppModalCustomEvent, type PcmMnctModalCustomEvent, type PcmMnmsModalCustomEvent, type PcmMnmsVideoModalCustomEvent, type PcmMnmsZpModalCustomEvent, type PcmMsbgModalCustomEvent, type PcmQgqjlModalCustomEvent, type PcmUploadCustomEvent, type PcmZskChatModalCustomEvent, type PcmZyghModalCustomEvent, type RecordingErrorEventData, type RecordingStatusChangeEventData, type StreamCompleteEventData, type UploadFailedEvent } from "pcm-agents";
import { Pcm1zhanshiMnmsModal as Pcm1zhanshiMnmsModalElement } from "pcm-agents/dist/components/pcm-1zhanshi-mnms-modal.js";
import { PcmAppChatModal as PcmAppChatModalElement } from "pcm-agents/dist/components/pcm-app-chat-modal.js";
import { PcmButton as PcmButtonElement } from "pcm-agents/dist/components/pcm-button.js";
import { PcmCard as PcmCardElement } from "pcm-agents/dist/components/pcm-card.js";
import { PcmChatMessage as PcmChatMessageElement } from "pcm-agents/dist/components/pcm-chat-message.js";
import { PcmConfirmModal as PcmConfirmModalElement } from "pcm-agents/dist/components/pcm-confirm-modal.js";
import { PcmDrawer as PcmDrawerElement } from "pcm-agents/dist/components/pcm-drawer.js";
import { PcmHrChatModal as PcmHrChatModalElement } from "pcm-agents/dist/components/pcm-hr-chat-modal.js";
import { PcmHtwsModal as PcmHtwsModalElement } from "pcm-agents/dist/components/pcm-htws-modal.js";
import { PcmHyzjModal as PcmHyzjModalElement } from "pcm-agents/dist/components/pcm-hyzj-modal.js";
import { PcmJdModal as PcmJdModalElement } from "pcm-agents/dist/components/pcm-jd-modal.js";
import { PcmJlppModal as PcmJlppModalElement } from "pcm-agents/dist/components/pcm-jlpp-modal.js";
import { PcmMessage as PcmMessageElement } from "pcm-agents/dist/components/pcm-message.js";
import { PcmMnctModal as PcmMnctModalElement } from "pcm-agents/dist/components/pcm-mnct-modal.js";
import { PcmMnmsModal as PcmMnmsModalElement } from "pcm-agents/dist/components/pcm-mnms-modal.js";
import { PcmMnmsVideoModal as PcmMnmsVideoModalElement } from "pcm-agents/dist/components/pcm-mnms-video-modal.js";
import { PcmMnmsZpModal as PcmMnmsZpModalElement } from "pcm-agents/dist/components/pcm-mnms-zp-modal.js";
import { PcmMobileInputBtn as PcmMobileInputBtnElement } from "pcm-agents/dist/components/pcm-mobile-input-btn.js";
import { PcmMobileUploadBtn as PcmMobileUploadBtnElement } from "pcm-agents/dist/components/pcm-mobile-upload-btn.js";
import { PcmMsbgModal as PcmMsbgModalElement } from "pcm-agents/dist/components/pcm-msbg-modal.js";
import { PcmQgqjlModal as PcmQgqjlModalElement } from "pcm-agents/dist/components/pcm-qgqjl-modal.js";
import { PcmTimeCountDown as PcmTimeCountDownElement } from "pcm-agents/dist/components/pcm-time-count-down.js";
import { PcmUpload as PcmUploadElement } from "pcm-agents/dist/components/pcm-upload.js";
import { PcmZskChatModal as PcmZskChatModalElement } from "pcm-agents/dist/components/pcm-zsk-chat-modal.js";
import { PcmZyghModal as PcmZyghModalElement } from "pcm-agents/dist/components/pcm-zygh-modal.js";
type Pcm1zhanshiMnmsModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>;
    onUploadSuccess: EventName<Pcm1zhanshiMnmsModalCustomEvent<FileUploadResponse>>;
    onStreamComplete: EventName<Pcm1zhanshiMnmsModalCustomEvent<StreamCompleteEventData>>;
    onConversationStart: EventName<Pcm1zhanshiMnmsModalCustomEvent<ConversationStartEventData>>;
    onInterviewComplete: EventName<Pcm1zhanshiMnmsModalCustomEvent<InterviewCompleteEventData>>;
    onTokenInvalid: EventName<CustomEvent<void>>;
    onSomeErrorEvent: EventName<Pcm1zhanshiMnmsModalCustomEvent<ErrorEventDetail>>;
    onRecordingError: EventName<Pcm1zhanshiMnmsModalCustomEvent<RecordingErrorEventData>>;
};
export declare const Pcm1zhanshiMnmsModal: StencilReactComponent<Pcm1zhanshiMnmsModalElement, Pcm1zhanshiMnmsModalEvents>;
type PcmAppChatModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>;
    onStreamComplete: EventName<PcmAppChatModalCustomEvent<StreamCompleteEventData>>;
    onConversationStart: EventName<PcmAppChatModalCustomEvent<ConversationStartEventData>>;
    onInterviewComplete: EventName<PcmAppChatModalCustomEvent<InterviewCompleteEventData>>;
    onRecordingError: EventName<PcmAppChatModalCustomEvent<RecordingErrorEventData>>;
    onRecordingStatusChange: EventName<PcmAppChatModalCustomEvent<RecordingStatusChangeEventData>>;
    onTokenInvalid: EventName<CustomEvent<void>>;
};
export declare const PcmAppChatModal: StencilReactComponent<PcmAppChatModalElement, PcmAppChatModalEvents>;
type PcmButtonEvents = NonNullable<unknown>;
export declare const PcmButton: StencilReactComponent<PcmButtonElement, PcmButtonEvents>;
type PcmCardEvents = {
    onTokenInvalid: EventName<CustomEvent<void>>;
};
export declare const PcmCard: StencilReactComponent<PcmCardElement, PcmCardEvents>;
type PcmChatMessageEvents = {
    onMessageChange: EventName<PcmChatMessageCustomEvent<Partial<ChatMessage>>>;
    onFilePreviewRequest: EventName<CustomEvent<{
        url?: string;
        fileName: string;
        content?: string;
        contentType: 'file' | 'markdown' | 'text';
    }>>;
    onRetryRequest: EventName<CustomEvent<string>>;
};
export declare const PcmChatMessage: StencilReactComponent<PcmChatMessageElement, PcmChatMessageEvents>;
type PcmConfirmModalEvents = {
    onOk: EventName<CustomEvent<void>>;
    onCancel: EventName<CustomEvent<void>>;
    onClosed: EventName<CustomEvent<void>>;
    onAfterOpen: EventName<CustomEvent<void>>;
    onAfterClose: EventName<CustomEvent<void>>;
};
export declare const PcmConfirmModal: StencilReactComponent<PcmConfirmModalElement, PcmConfirmModalEvents>;
type PcmDrawerEvents = {
    onClosed: EventName<CustomEvent<void>>;
    onAfterOpen: EventName<CustomEvent<void>>;
    onAfterClose: EventName<CustomEvent<void>>;
};
export declare const PcmDrawer: StencilReactComponent<PcmDrawerElement, PcmDrawerEvents>;
type PcmHrChatModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>;
    onStreamComplete: EventName<PcmHrChatModalCustomEvent<StreamCompleteEventData>>;
    onConversationStart: EventName<PcmHrChatModalCustomEvent<ConversationStartEventData>>;
    onSomeErrorEvent: EventName<PcmHrChatModalCustomEvent<ErrorEventDetail>>;
    onInterviewComplete: EventName<PcmHrChatModalCustomEvent<InterviewCompleteEventData>>;
    onRecordingError: EventName<CustomEvent<{
        type: string;
        message: string;
        details?: any;
    }>>;
    onRecordingStatusChange: EventName<CustomEvent<{
        status: 'started' | 'stopped' | 'paused' | 'resumed' | 'failed';
        details?: any;
    }>>;
    onTokenInvalid: EventName<CustomEvent<void>>;
};
export declare const PcmHrChatModal: StencilReactComponent<PcmHrChatModalElement, PcmHrChatModalEvents>;
type PcmHtwsModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>;
    onUploadSuccess: EventName<PcmHtwsModalCustomEvent<FileUploadResponse>>;
    onStreamComplete: EventName<PcmHtwsModalCustomEvent<StreamCompleteEventData>>;
    onConversationStart: EventName<PcmHtwsModalCustomEvent<ConversationStartEventData>>;
    onInterviewComplete: EventName<PcmHtwsModalCustomEvent<InterviewCompleteEventData>>;
    onTokenInvalid: EventName<CustomEvent<void>>;
    onSomeErrorEvent: EventName<PcmHtwsModalCustomEvent<ErrorEventDetail>>;
};
export declare const PcmHtwsModal: StencilReactComponent<PcmHtwsModalElement, PcmHtwsModalEvents>;
type PcmHyzjModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>;
    onUploadSuccess: EventName<PcmHyzjModalCustomEvent<FileUploadResponse>>;
    onStreamComplete: EventName<PcmHyzjModalCustomEvent<StreamCompleteEventData>>;
    onConversationStart: EventName<PcmHyzjModalCustomEvent<ConversationStartEventData>>;
    onInterviewComplete: EventName<PcmHyzjModalCustomEvent<InterviewCompleteEventData>>;
    onTokenInvalid: EventName<CustomEvent<void>>;
    onSomeErrorEvent: EventName<PcmHyzjModalCustomEvent<ErrorEventDetail>>;
};
export declare const PcmHyzjModal: StencilReactComponent<PcmHyzjModalElement, PcmHyzjModalEvents>;
type PcmJdModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>;
    onStreamComplete: EventName<PcmJdModalCustomEvent<StreamCompleteEventData>>;
    onConversationStart: EventName<PcmJdModalCustomEvent<ConversationStartEventData>>;
    onInterviewComplete: EventName<PcmJdModalCustomEvent<InterviewCompleteEventData>>;
    onTokenInvalid: EventName<CustomEvent<void>>;
    onSomeErrorEvent: EventName<PcmJdModalCustomEvent<ErrorEventDetail>>;
};
export declare const PcmJdModal: StencilReactComponent<PcmJdModalElement, PcmJdModalEvents>;
type PcmJlppModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>;
    onUploadSuccess: EventName<PcmJlppModalCustomEvent<FileUploadResponse>>;
    onStreamComplete: EventName<PcmJlppModalCustomEvent<StreamCompleteEventData>>;
    onConversationStart: EventName<PcmJlppModalCustomEvent<ConversationStartEventData>>;
    onInterviewComplete: EventName<PcmJlppModalCustomEvent<InterviewCompleteEventData>>;
    onTokenInvalid: EventName<CustomEvent<void>>;
    onSomeErrorEvent: EventName<PcmJlppModalCustomEvent<ErrorEventDetail>>;
};
export declare const PcmJlppModal: StencilReactComponent<PcmJlppModalElement, PcmJlppModalEvents>;
type PcmMessageEvents = NonNullable<unknown>;
export declare const PcmMessage: StencilReactComponent<PcmMessageElement, PcmMessageEvents>;
type PcmMnctModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>;
    onUploadSuccess: EventName<PcmMnctModalCustomEvent<FileUploadResponse>>;
    onStreamComplete: EventName<PcmMnctModalCustomEvent<StreamCompleteEventData>>;
    onConversationStart: EventName<PcmMnctModalCustomEvent<ConversationStartEventData>>;
    onInterviewComplete: EventName<PcmMnctModalCustomEvent<InterviewCompleteEventData>>;
    onTokenInvalid: EventName<CustomEvent<void>>;
    onSomeErrorEvent: EventName<PcmMnctModalCustomEvent<ErrorEventDetail>>;
};
export declare const PcmMnctModal: StencilReactComponent<PcmMnctModalElement, PcmMnctModalEvents>;
type PcmMnmsModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>;
    onUploadSuccess: EventName<PcmMnmsModalCustomEvent<FileUploadResponse>>;
    onStreamComplete: EventName<PcmMnmsModalCustomEvent<StreamCompleteEventData>>;
    onConversationStart: EventName<PcmMnmsModalCustomEvent<ConversationStartEventData>>;
    onInterviewComplete: EventName<PcmMnmsModalCustomEvent<InterviewCompleteEventData>>;
    onTokenInvalid: EventName<CustomEvent<void>>;
    onSomeErrorEvent: EventName<PcmMnmsModalCustomEvent<ErrorEventDetail>>;
    onRecordingError: EventName<PcmMnmsModalCustomEvent<RecordingErrorEventData>>;
};
export declare const PcmMnmsModal: StencilReactComponent<PcmMnmsModalElement, PcmMnmsModalEvents>;
type PcmMnmsVideoModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>;
    onUploadSuccess: EventName<PcmMnmsVideoModalCustomEvent<FileUploadResponse>>;
    onStreamComplete: EventName<PcmMnmsVideoModalCustomEvent<StreamCompleteEventData>>;
    onConversationStart: EventName<PcmMnmsVideoModalCustomEvent<ConversationStartEventData>>;
    onInterviewComplete: EventName<PcmMnmsVideoModalCustomEvent<InterviewCompleteEventData>>;
    onTokenInvalid: EventName<CustomEvent<void>>;
    onSomeErrorEvent: EventName<PcmMnmsVideoModalCustomEvent<ErrorEventDetail>>;
    onRecordingError: EventName<PcmMnmsVideoModalCustomEvent<RecordingErrorEventData>>;
};
export declare const PcmMnmsVideoModal: StencilReactComponent<PcmMnmsVideoModalElement, PcmMnmsVideoModalEvents>;
type PcmMnmsZpModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>;
    onUploadSuccess: EventName<PcmMnmsZpModalCustomEvent<FileUploadResponse>>;
    onStreamComplete: EventName<PcmMnmsZpModalCustomEvent<StreamCompleteEventData>>;
    onConversationStart: EventName<PcmMnmsZpModalCustomEvent<ConversationStartEventData>>;
    onInterviewComplete: EventName<PcmMnmsZpModalCustomEvent<InterviewCompleteEventData>>;
    onTokenInvalid: EventName<CustomEvent<void>>;
    onSomeErrorEvent: EventName<PcmMnmsZpModalCustomEvent<ErrorEventDetail>>;
    onRecordingError: EventName<PcmMnmsZpModalCustomEvent<RecordingErrorEventData>>;
};
export declare const PcmMnmsZpModal: StencilReactComponent<PcmMnmsZpModalElement, PcmMnmsZpModalEvents>;
type PcmMobileInputBtnEvents = {
    onOk: EventName<CustomEvent<string>>;
};
export declare const PcmMobileInputBtn: StencilReactComponent<PcmMobileInputBtnElement, PcmMobileInputBtnEvents>;
type PcmMobileUploadBtnEvents = {
    onOk: EventName<CustomEvent<any[]>>;
};
export declare const PcmMobileUploadBtn: StencilReactComponent<PcmMobileUploadBtnElement, PcmMobileUploadBtnEvents>;
type PcmMsbgModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>;
    onUploadSuccess: EventName<PcmMsbgModalCustomEvent<FileUploadResponse>>;
    onStreamComplete: EventName<PcmMsbgModalCustomEvent<StreamCompleteEventData>>;
    onConversationStart: EventName<PcmMsbgModalCustomEvent<ConversationStartEventData>>;
    onInterviewComplete: EventName<PcmMsbgModalCustomEvent<InterviewCompleteEventData>>;
    onTokenInvalid: EventName<CustomEvent<void>>;
    onSomeErrorEvent: EventName<PcmMsbgModalCustomEvent<ErrorEventDetail>>;
};
export declare const PcmMsbgModal: StencilReactComponent<PcmMsbgModalElement, PcmMsbgModalEvents>;
type PcmQgqjlModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>;
    onUploadSuccess: EventName<PcmQgqjlModalCustomEvent<FileUploadResponse>>;
    onStreamComplete: EventName<PcmQgqjlModalCustomEvent<StreamCompleteEventData>>;
    onConversationStart: EventName<PcmQgqjlModalCustomEvent<ConversationStartEventData>>;
    onInterviewComplete: EventName<PcmQgqjlModalCustomEvent<InterviewCompleteEventData>>;
    onTokenInvalid: EventName<CustomEvent<void>>;
    onSomeErrorEvent: EventName<PcmQgqjlModalCustomEvent<ErrorEventDetail>>;
};
export declare const PcmQgqjlModal: StencilReactComponent<PcmQgqjlModalElement, PcmQgqjlModalEvents>;
type PcmTimeCountDownEvents = {
    onFinished: EventName<CustomEvent<any>>;
};
export declare const PcmTimeCountDown: StencilReactComponent<PcmTimeCountDownElement, PcmTimeCountDownEvents>;
type PcmUploadEvents = {
    onUploadFailed: EventName<PcmUploadCustomEvent<UploadFailedEvent>>;
    onUploadChange: EventName<PcmUploadCustomEvent<FileUploadResponse[]>>;
};
export declare const PcmUpload: StencilReactComponent<PcmUploadElement, PcmUploadEvents>;
type PcmZskChatModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>;
    onStreamComplete: EventName<PcmZskChatModalCustomEvent<StreamCompleteEventData>>;
    onConversationStart: EventName<PcmZskChatModalCustomEvent<ConversationStartEventData>>;
    onTokenInvalid: EventName<CustomEvent<void>>;
    onClearConversation: EventName<CustomEvent<string>>;
};
export declare const PcmZskChatModal: StencilReactComponent<PcmZskChatModalElement, PcmZskChatModalEvents>;
type PcmZyghModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>;
    onUploadSuccess: EventName<PcmZyghModalCustomEvent<FileUploadResponse>>;
    onStreamComplete: EventName<PcmZyghModalCustomEvent<StreamCompleteEventData>>;
    onConversationStart: EventName<PcmZyghModalCustomEvent<ConversationStartEventData>>;
    onPlanningComplete: EventName<PcmZyghModalCustomEvent<{
        conversation_id: string;
        type: CareerPlanType;
    }>>;
    onTokenInvalid: EventName<CustomEvent<void>>;
    onSomeErrorEvent: EventName<PcmZyghModalCustomEvent<ErrorEventDetail>>;
};
export declare const PcmZyghModal: StencilReactComponent<PcmZyghModalElement, PcmZyghModalEvents>;
export {};
