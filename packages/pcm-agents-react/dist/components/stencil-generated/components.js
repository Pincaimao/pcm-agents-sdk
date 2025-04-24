'use client';
import { createComponent } from '@stencil/react-output-target/runtime';
import { MyComponent as MyComponentElement, defineCustomElement as defineMyComponent } from "pcm-agents/dist/components/my-component.js";
import { PcmAppChatModal as PcmAppChatModalElement, defineCustomElement as definePcmAppChatModal } from "pcm-agents/dist/components/pcm-app-chat-modal.js";
import { PcmChatMessage as PcmChatMessageElement, defineCustomElement as definePcmChatMessage } from "pcm-agents/dist/components/pcm-chat-message.js";
import { PcmChatModal as PcmChatModalElement, defineCustomElement as definePcmChatModal } from "pcm-agents/dist/components/pcm-chat-modal.js";
import { PcmHrChatModal as PcmHrChatModalElement, defineCustomElement as definePcmHrChatModal } from "pcm-agents/dist/components/pcm-hr-chat-modal.js";
import { PcmHtwsModal as PcmHtwsModalElement, defineCustomElement as definePcmHtwsModal } from "pcm-agents/dist/components/pcm-htws-modal.js";
import { PcmHyzjModal as PcmHyzjModalElement, defineCustomElement as definePcmHyzjModal } from "pcm-agents/dist/components/pcm-hyzj-modal.js";
import { PcmJdModal as PcmJdModalElement, defineCustomElement as definePcmJdModal } from "pcm-agents/dist/components/pcm-jd-modal.js";
import { PcmJlppModal as PcmJlppModalElement, defineCustomElement as definePcmJlppModal } from "pcm-agents/dist/components/pcm-jlpp-modal.js";
import { PcmMnctModal as PcmMnctModalElement, defineCustomElement as definePcmMnctModal } from "pcm-agents/dist/components/pcm-mnct-modal.js";
import { PcmMnmsModal as PcmMnmsModalElement, defineCustomElement as definePcmMnmsModal } from "pcm-agents/dist/components/pcm-mnms-modal.js";
import { PcmMsbgModal as PcmMsbgModalElement, defineCustomElement as definePcmMsbgModal } from "pcm-agents/dist/components/pcm-msbg-modal.js";
import { PcmVideoChatModal as PcmVideoChatModalElement, defineCustomElement as definePcmVideoChatModal } from "pcm-agents/dist/components/pcm-video-chat-modal.js";
import { PcmZskChatModal as PcmZskChatModalElement, defineCustomElement as definePcmZskChatModal } from "pcm-agents/dist/components/pcm-zsk-chat-modal.js";
import { PcmZyghModal as PcmZyghModalElement, defineCustomElement as definePcmZyghModal } from "pcm-agents/dist/components/pcm-zygh-modal.js";
import React from 'react';
export const MyComponent = createComponent({
    tagName: 'my-component',
    elementClass: MyComponentElement,
    react: React,
    events: {},
    defineCustomElement: defineMyComponent
});
export const PcmAppChatModal = createComponent({
    tagName: 'pcm-app-chat-modal',
    elementClass: PcmAppChatModalElement,
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete',
        onRecordingError: 'recordingError',
        onRecordingStatusChange: 'recordingStatusChange'
    },
    defineCustomElement: definePcmAppChatModal
});
export const PcmChatMessage = createComponent({
    tagName: 'pcm-chat-message',
    elementClass: PcmChatMessageElement,
    react: React,
    events: { onMessageChange: 'messageChange' },
    defineCustomElement: definePcmChatMessage
});
export const PcmChatModal = createComponent({
    tagName: 'pcm-chat-modal',
    elementClass: PcmChatModalElement,
    react: React,
    events: {
        onMessageSent: 'messageSent',
        onModalClosed: 'modalClosed',
        onStreamComplete: 'streamComplete'
    },
    defineCustomElement: definePcmChatModal
});
export const PcmHrChatModal = createComponent({
    tagName: 'pcm-hr-chat-modal',
    elementClass: PcmHrChatModalElement,
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete',
        onRecordingError: 'recordingError',
        onRecordingStatusChange: 'recordingStatusChange'
    },
    defineCustomElement: definePcmHrChatModal
});
export const PcmHtwsModal = createComponent({
    tagName: 'pcm-htws-modal',
    elementClass: PcmHtwsModalElement,
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onUploadSuccess: 'uploadSuccess',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete',
        onTokenInvalid: 'tokenInvalid'
    },
    defineCustomElement: definePcmHtwsModal
});
export const PcmHyzjModal = createComponent({
    tagName: 'pcm-hyzj-modal',
    elementClass: PcmHyzjModalElement,
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onUploadSuccess: 'uploadSuccess',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete',
        onTokenInvalid: 'tokenInvalid'
    },
    defineCustomElement: definePcmHyzjModal
});
export const PcmJdModal = createComponent({
    tagName: 'pcm-jd-modal',
    elementClass: PcmJdModalElement,
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete',
        onTokenInvalid: 'tokenInvalid'
    },
    defineCustomElement: definePcmJdModal
});
export const PcmJlppModal = createComponent({
    tagName: 'pcm-jlpp-modal',
    elementClass: PcmJlppModalElement,
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onUploadSuccess: 'uploadSuccess',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete',
        onTokenInvalid: 'tokenInvalid'
    },
    defineCustomElement: definePcmJlppModal
});
export const PcmMnctModal = createComponent({
    tagName: 'pcm-mnct-modal',
    elementClass: PcmMnctModalElement,
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onUploadSuccess: 'uploadSuccess',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete',
        onTokenInvalid: 'tokenInvalid'
    },
    defineCustomElement: definePcmMnctModal
});
export const PcmMnmsModal = createComponent({
    tagName: 'pcm-mnms-modal',
    elementClass: PcmMnmsModalElement,
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onUploadSuccess: 'uploadSuccess',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete',
        onTokenInvalid: 'tokenInvalid'
    },
    defineCustomElement: definePcmMnmsModal
});
export const PcmMsbgModal = createComponent({
    tagName: 'pcm-msbg-modal',
    elementClass: PcmMsbgModalElement,
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onUploadSuccess: 'uploadSuccess',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onInterviewComplete: 'interviewComplete',
        onTokenInvalid: 'tokenInvalid'
    },
    defineCustomElement: definePcmMsbgModal
});
export const PcmVideoChatModal = createComponent({
    tagName: 'pcm-video-chat-modal',
    elementClass: PcmVideoChatModalElement,
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onStreamComplete: 'streamComplete',
        onInterviewComplete: 'interviewComplete',
        onRecordingError: 'recordingError',
        onRecordingStatusChange: 'recordingStatusChange'
    },
    defineCustomElement: definePcmVideoChatModal
});
export const PcmZskChatModal = createComponent({
    tagName: 'pcm-zsk-chat-modal',
    elementClass: PcmZskChatModalElement,
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onTokenInvalid: 'tokenInvalid'
    },
    defineCustomElement: definePcmZskChatModal
});
export const PcmZyghModal = createComponent({
    tagName: 'pcm-zygh-modal',
    elementClass: PcmZyghModalElement,
    react: React,
    events: {
        onModalClosed: 'modalClosed',
        onUploadSuccess: 'uploadSuccess',
        onStreamComplete: 'streamComplete',
        onConversationStart: 'conversationStart',
        onPlanningComplete: 'planningComplete',
        onTokenInvalid: 'tokenInvalid'
    },
    defineCustomElement: definePcmZyghModal
});
//# sourceMappingURL=components.js.map