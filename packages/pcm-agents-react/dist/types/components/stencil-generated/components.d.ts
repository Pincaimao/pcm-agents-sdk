import type { EventName, StencilReactComponent } from '@stencil/react-output-target/runtime';
import { type CareerPlanType, type ChatMessage, type FileUploadResponse, type PcmChatMessageCustomEvent, type PcmJlpxModalCustomEvent, type PcmMnmsModalCustomEvent, type PcmZyghModalCustomEvent } from "pcm-agents";
import { MyComponent as MyComponentElement } from "pcm-agents/dist/components/my-component.js";
import { PcmAppChatModal as PcmAppChatModalElement } from "pcm-agents/dist/components/pcm-app-chat-modal.js";
import { PcmChatMessage as PcmChatMessageElement } from "pcm-agents/dist/components/pcm-chat-message.js";
import { PcmChatModal as PcmChatModalElement } from "pcm-agents/dist/components/pcm-chat-modal.js";
import { PcmHrChatModal as PcmHrChatModalElement } from "pcm-agents/dist/components/pcm-hr-chat-modal.js";
import { PcmJlpxModal as PcmJlpxModalElement } from "pcm-agents/dist/components/pcm-jlpx-modal.js";
import { PcmMnmsModal as PcmMnmsModalElement } from "pcm-agents/dist/components/pcm-mnms-modal.js";
import { PcmVideoChatModal as PcmVideoChatModalElement } from "pcm-agents/dist/components/pcm-video-chat-modal.js";
import { PcmZyghModal as PcmZyghModalElement } from "pcm-agents/dist/components/pcm-zygh-modal.js";
type MyComponentEvents = NonNullable<unknown>;
export declare const MyComponent: StencilReactComponent<MyComponentElement, MyComponentEvents>;
type PcmAppChatModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>;
    onStreamComplete: EventName<CustomEvent<{
        conversation_id: string;
        event: string;
        message_id: string;
        id: string;
    }>>;
    onConversationStart: EventName<CustomEvent<{
        conversation_id: string;
        event: string;
        message_id: string;
        id: string;
    }>>;
    onInterviewComplete: EventName<CustomEvent<{
        conversation_id: string;
        total_questions: number;
    }>>;
    onRecordingError: EventName<CustomEvent<{
        type: string;
        message: string;
        details?: any;
    }>>;
    onRecordingStatusChange: EventName<CustomEvent<{
        status: 'started' | 'stopped' | 'paused' | 'resumed' | 'failed';
        details?: any;
    }>>;
};
export declare const PcmAppChatModal: StencilReactComponent<PcmAppChatModalElement, PcmAppChatModalEvents>;
type PcmChatMessageEvents = {
    onMessageChange: EventName<PcmChatMessageCustomEvent<Partial<ChatMessage>>>;
};
export declare const PcmChatMessage: StencilReactComponent<PcmChatMessageElement, PcmChatMessageEvents>;
type PcmChatModalEvents = {
    onMessageSent: EventName<CustomEvent<string>>;
    onModalClosed: EventName<CustomEvent<void>>;
    onStreamComplete: EventName<CustomEvent<{
        conversation_id: string;
        event: string;
        message_id: string;
        id: string;
    }>>;
};
export declare const PcmChatModal: StencilReactComponent<PcmChatModalElement, PcmChatModalEvents>;
type PcmHrChatModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>;
    onStreamComplete: EventName<CustomEvent<{
        conversation_id: string;
        event: string;
        message_id: string;
        id: string;
    }>>;
    onInterviewComplete: EventName<CustomEvent<{
        conversation_id: string;
        total_questions: number;
    }>>;
    onRecordingError: EventName<CustomEvent<{
        type: string;
        message: string;
        details?: any;
    }>>;
    onRecordingStatusChange: EventName<CustomEvent<{
        status: 'started' | 'stopped' | 'paused' | 'resumed' | 'failed';
        details?: any;
    }>>;
};
export declare const PcmHrChatModal: StencilReactComponent<PcmHrChatModalElement, PcmHrChatModalEvents>;
type PcmJlpxModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>;
    onUploadSuccess: EventName<PcmJlpxModalCustomEvent<FileUploadResponse>>;
    onStreamComplete: EventName<CustomEvent<{
        conversation_id: string;
        event: string;
        message_id: string;
        id: string;
    }>>;
    onConversationStart: EventName<CustomEvent<{
        conversation_id: string;
        event: string;
        message_id: string;
        id: string;
    }>>;
    onInterviewComplete: EventName<CustomEvent<{
        conversation_id: string;
        total_questions: number;
    }>>;
    onApiKeyInvalid: EventName<CustomEvent<void>>;
};
export declare const PcmJlpxModal: StencilReactComponent<PcmJlpxModalElement, PcmJlpxModalEvents>;
type PcmMnmsModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>;
    onUploadSuccess: EventName<PcmMnmsModalCustomEvent<FileUploadResponse>>;
    onStreamComplete: EventName<CustomEvent<{
        conversation_id: string;
        event: string;
        message_id: string;
        id: string;
    }>>;
    onConversationStart: EventName<CustomEvent<{
        conversation_id: string;
        event: string;
        message_id: string;
        id: string;
    }>>;
    onInterviewComplete: EventName<CustomEvent<{
        conversation_id: string;
        total_questions: number;
    }>>;
    onApiKeyInvalid: EventName<CustomEvent<void>>;
};
export declare const PcmMnmsModal: StencilReactComponent<PcmMnmsModalElement, PcmMnmsModalEvents>;
type PcmVideoChatModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>;
    onStreamComplete: EventName<CustomEvent<{
        conversation_id: string;
        event: string;
        message_id: string;
        id: string;
    }>>;
    onInterviewComplete: EventName<CustomEvent<{
        conversation_id: string;
        total_questions: number;
    }>>;
    onRecordingError: EventName<CustomEvent<{
        type: string;
        message: string;
        details?: any;
    }>>;
    onRecordingStatusChange: EventName<CustomEvent<{
        status: 'started' | 'stopped' | 'paused' | 'resumed' | 'failed';
        details?: any;
    }>>;
};
export declare const PcmVideoChatModal: StencilReactComponent<PcmVideoChatModalElement, PcmVideoChatModalEvents>;
type PcmZyghModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>;
    onUploadSuccess: EventName<PcmZyghModalCustomEvent<FileUploadResponse>>;
    onStreamComplete: EventName<CustomEvent<{
        conversation_id: string;
        event: string;
        message_id: string;
        id: string;
    }>>;
    onConversationStart: EventName<CustomEvent<{
        conversation_id: string;
        event: string;
        message_id: string;
        id: string;
    }>>;
    onPlanningComplete: EventName<PcmZyghModalCustomEvent<{
        conversation_id: string;
        plan_type: CareerPlanType;
    }>>;
    onApiKeyInvalid: EventName<CustomEvent<void>>;
};
export declare const PcmZyghModal: StencilReactComponent<PcmZyghModalElement, PcmZyghModalEvents>;
export {};
