import type { EventName, StencilReactComponent } from '@stencil/react-output-target/runtime';
import { type CareerPlanType, type ChatMessage, type FileUploadResponse, type PcmChatMessageCustomEvent, type PcmHtwsModalCustomEvent, type PcmHyzjModalCustomEvent, type PcmJlppModalCustomEvent, type PcmMnctModalCustomEvent, type PcmMnmsModalCustomEvent, type PcmMsbgModalCustomEvent, type PcmZyghModalCustomEvent } from "pcm-agents";
import { MyComponent as MyComponentElement } from "pcm-agents/dist/components/my-component.js";
import { PcmAppChatModal as PcmAppChatModalElement } from "pcm-agents/dist/components/pcm-app-chat-modal.js";
import { PcmChatMessage as PcmChatMessageElement } from "pcm-agents/dist/components/pcm-chat-message.js";
import { PcmChatModal as PcmChatModalElement } from "pcm-agents/dist/components/pcm-chat-modal.js";
import { PcmHrChatModal as PcmHrChatModalElement } from "pcm-agents/dist/components/pcm-hr-chat-modal.js";
import { PcmHtwsModal as PcmHtwsModalElement } from "pcm-agents/dist/components/pcm-htws-modal.js";
import { PcmHyzjModal as PcmHyzjModalElement } from "pcm-agents/dist/components/pcm-hyzj-modal.js";
import { PcmJlppModal as PcmJlppModalElement } from "pcm-agents/dist/components/pcm-jlpp-modal.js";
import { PcmMnctModal as PcmMnctModalElement } from "pcm-agents/dist/components/pcm-mnct-modal.js";
import { PcmMnmsModal as PcmMnmsModalElement } from "pcm-agents/dist/components/pcm-mnms-modal.js";
import { PcmMsbgModal as PcmMsbgModalElement } from "pcm-agents/dist/components/pcm-msbg-modal.js";
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
export declare const PcmHrChatModal: StencilReactComponent<PcmHrChatModalElement, PcmHrChatModalEvents>;
type PcmHtwsModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>;
    onUploadSuccess: EventName<PcmHtwsModalCustomEvent<FileUploadResponse>>;
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
    onTokenInvalid: EventName<CustomEvent<void>>;
};
export declare const PcmHtwsModal: StencilReactComponent<PcmHtwsModalElement, PcmHtwsModalEvents>;
type PcmHyzjModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>;
    onUploadSuccess: EventName<PcmHyzjModalCustomEvent<FileUploadResponse>>;
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
    onTokenInvalid: EventName<CustomEvent<void>>;
};
export declare const PcmHyzjModal: StencilReactComponent<PcmHyzjModalElement, PcmHyzjModalEvents>;
type PcmJlppModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>;
    onUploadSuccess: EventName<PcmJlppModalCustomEvent<FileUploadResponse>>;
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
    onTokenInvalid: EventName<CustomEvent<void>>;
};
export declare const PcmJlppModal: StencilReactComponent<PcmJlppModalElement, PcmJlppModalEvents>;
type PcmMnctModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>;
    onUploadSuccess: EventName<PcmMnctModalCustomEvent<FileUploadResponse>>;
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
    onTokenInvalid: EventName<CustomEvent<void>>;
};
export declare const PcmMnctModal: StencilReactComponent<PcmMnctModalElement, PcmMnctModalEvents>;
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
    onTokenInvalid: EventName<CustomEvent<void>>;
};
export declare const PcmMnmsModal: StencilReactComponent<PcmMnmsModalElement, PcmMnmsModalEvents>;
type PcmMsbgModalEvents = {
    onModalClosed: EventName<CustomEvent<void>>;
    onUploadSuccess: EventName<PcmMsbgModalCustomEvent<FileUploadResponse>>;
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
    onTokenInvalid: EventName<CustomEvent<void>>;
};
export declare const PcmMsbgModal: StencilReactComponent<PcmMsbgModalElement, PcmMsbgModalEvents>;
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
        type: CareerPlanType;
    }>>;
    onTokenInvalid: EventName<CustomEvent<void>>;
};
export declare const PcmZyghModal: StencilReactComponent<PcmZyghModalElement, PcmZyghModalEvents>;
export {};
